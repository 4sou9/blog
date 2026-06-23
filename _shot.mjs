import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 400 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:4399/blog/', { waitUntil: 'networkidle' });
await p.waitForSelector('.pagefind-ui__search-input', { timeout: 8000 });
await p.waitForTimeout(300);
await p.screenshot({ path: 'C:/Users/kirito/blog/_hdr.png', clip: { x: 0, y: 0, width: 900, height: 110 } });
// 高さ計測（ガタつき確認用）
const h = await p.$eval('.site-search', el => el.getBoundingClientRect().height);
const ih = await p.$eval('.pagefind-ui__search-input', el => el.getBoundingClientRect().height);
const th = await p.$eval('.site-title', el => el.getBoundingClientRect().height);
console.log(JSON.stringify({ searchContainer: h, input: ih, title: th }));
await b.close();
