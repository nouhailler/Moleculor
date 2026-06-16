import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/icon.svg', 'utf8');
const targets = [
  ['public/icon-512.png', 512],
  ['public/icon-192.png', 192],
  ['public/apple-touch-icon.png', 180],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [out, size] of targets) {
  await page.setViewportSize({ width: size, height: size });
  const html = `<!doctype html><html><head><style>
    *{margin:0;padding:0}html,body{width:${size}px;height:${size}px}
    svg{display:block;width:${size}px;height:${size}px}
  </style></head><body>${svg}</body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  const buf = await page.screenshot({ omitBackground: false });
  writeFileSync(out, buf);
  console.log('wrote', out, size);
}
await browser.close();
