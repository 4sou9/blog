import { visit } from 'unist-util-visit';

const SKIP_RE = /youtube\.com|youtu\.be|twitter\.com|x\.com/;

async function fetchOgp(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    if (html.includes('cf-mitigated') || html.includes('jschl-answer') || html.includes('Just a moment')) return null;
    const get = (...patterns) => {
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return '';
    };
    return {
      title: get(
        /property="og:title"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:title"/,
        /<title[^>]*>([^<]+)<\/title>/,
      ),
      description: get(
        /property="og:description"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:description"/,
        /name="description"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+name="description"/,
      ),
      image: get(
        /property="og:image"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:image"/,
      ),
      siteName: get(
        /property="og:site_name"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:site_name"/,
      ),
    };
  } catch {
    return null;
  }
}

function makeCard(href, ogp) {
  let hostname = href;
  try { hostname = new URL(href).hostname; } catch {}

  return {
    type: 'element',
    tagName: 'a',
    properties: { href, className: ['ogp-card'], target: '_blank', rel: 'noopener noreferrer' },
    children: [
      ...(ogp.image ? [{
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['ogp-image'],
          style: `background-image:url(${ogp.image})`,
        },
        children: [],
      }] : []),
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['ogp-content'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['ogp-title'] },
            children: [{ type: 'text', value: ogp.title || href }],
          },
          ...(ogp.description ? [{
            type: 'element',
            tagName: 'div',
            properties: { className: ['ogp-desc'] },
            children: [{ type: 'text', value: ogp.description }],
          }] : []),
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['ogp-url'] },
            children: [{ type: 'text', value: ogp.siteName || hostname }],
          },
        ],
      },
    ],
  };
}

export default function rehypeOgpCard() {
  return async (tree) => {
    const tasks = [];

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent) return;
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== 'element' || child.tagName !== 'a') return;
      const href = child.properties?.href ?? '';
      if (SKIP_RE.test(href)) return;
      const linkText = child.children?.[0]?.value ?? '';
      if (linkText !== href) return;

      tasks.push({ index, parent, href });
    });

    await Promise.all(tasks.map(async ({ index, parent, href }) => {
      const ogp = await fetchOgp(href);
      if (ogp) parent.children[index] = makeCard(href, ogp);
    }));
  };
}
