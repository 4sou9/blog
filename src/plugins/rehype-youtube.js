import { visit } from 'unist-util-visit';

export default function rehypeYoutube() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent) return;
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== 'element' || child.tagName !== 'a') return;
      const href = child.properties?.href ?? '';
      let id = null;
      try {
        const url = new URL(href);
        if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
          id = url.searchParams.get('v');
        } else if (url.hostname === 'youtu.be') {
          id = url.pathname.slice(1);
        }
      } catch {}
      if (!id) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'iframe',
        properties: {
          src: `https://www.youtube.com/embed/${id}`,
          title: href,
          width: '100%',
          style: 'aspect-ratio:16/9;border:none;margin:1rem 0;display:block;',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: true,
        },
        children: [],
      };
    });
  };
}
