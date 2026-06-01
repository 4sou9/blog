---
title: '表示テスト：OGPカード・GIF・SVG'
pubDate: '2026-06-01'
---

## 自サイト記事のOGPカード

デプロイ済みURLを貼るとビルド時に自サイトのOGPを取得してカード表示します。

[https://4sou9.github.io/blog/2026-01-10-astro-blog/](https://4sou9.github.io/blog/2026-01-10-astro-blog/)

[https://4sou9.github.io/blog/2026-02-05-css-custom-properties/](https://4sou9.github.io/blog/2026-02-05-css-custom-properties/)

[https://4sou9.github.io/blog/2026-03-15-git-commands/](https://4sou9.github.io/blog/2026-03-15-git-commands/)

[https://4sou9.github.io/blog/2026-05-25-dark-mode-palette/](https://4sou9.github.io/blog/2026-05-25-dark-mode-palette/)

---

## GIF画像

![Rotating Earth](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rotating_earth_%28large%29.gif/100px-Rotating_earth_%28large%29.gif)

---

## SVG図形（インライン）

基本図形：

<svg width="300" height="160" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="160" fill="#111109" rx="8"/>
  <circle cx="70" cy="80" r="45" fill="#8fb6f0" opacity="0.85"/>
  <rect x="130" y="35" width="90" height="90" fill="#f4f5f7" opacity="0.55" rx="6"/>
  <polygon points="255,35 295,125 215,125" fill="#aab2bd" opacity="0.75"/>
</svg>

グラデーション：

<svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8fb6f0"/>
      <stop offset="100%" stop-color="#aab2bd"/>
    </linearGradient>
  </defs>
  <rect width="300" height="80" fill="url(#g1)" rx="8"/>
  <text x="150" y="48" text-anchor="middle" font-size="22" fill="#1a1a0e" font-weight="600">グラデーション</text>
</svg>

アニメーション：

<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="50" fill="none" stroke="#8fb6f0" stroke-width="6" stroke-dasharray="80 240">
    <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1.5s" repeatCount="indefinite"/>
  </circle>
</svg>
