---
title: 'ブログ運用メモ'
pubDate: '2026-06-02'
unlisted: true
---

## このブログについて

| 項目 | 内容 |
|------|------|
| フレームワーク | [Astro](https://astro.build) v6 |
| デプロイ先 | GitHub Pages（`https://4sou9.github.io/blog/`） |
| ベースパス | `/blog`（`import.meta.env.BASE_URL`） |
| コンテンツ | `src/content/blog/` 以下の `.md` ファイル |
| スタイル | `src/styles/global.css` |

---

## 記事の作成

### ファイル命名規則

画像なし：

```
src/content/blog/YYYY-MM-DD-slug.md
```

画像あり：

```
src/content/blog/YYYY-MM-DD-slug/index.md
src/content/blog/YYYY-MM-DD-slug/image.png
```

### フロントマター

```yaml
---
title: '記事タイトル'          # 必須
pubDate: '2026-06-02'          # 必須。Date 型に強制変換される
description: 'OGP用の説明文'  # 省略可。省略時は本文冒頭から自動生成
unlisted: true                 # 省略可。一覧非表示にする
---
```

### unlisted 記事

`unlisted: true` を書くと記事一覧・サイトマップに載らないが、URL を直接開けばアクセスできる。

---

## Markdown 記法

### テキスト装飾

```md
**太字**  *イタリック*  ~~打ち消し~~  `インラインコード`
```

**太字**　*イタリック*　~~打ち消し~~　`インラインコード`

### 見出し

```md
## h2
### h3
#### h4
```

`h1` は記事タイトルとして自動挿入されるため記事本文内では使わない。

### リスト

```md
- 箇条書き
  - ネスト

1. 番号付き
2. リスト
```

### 引用

```md
> 引用テキスト
```

> 引用テキスト

### 水平線

```md
---
```

### テーブル

```md
| 列1 | 列2 |
|-----|-----|
| A   | B   |
```

---

## リンク

### 通常リンク

```md
[リンクテキスト](https://example.com)
```

テキストと URL が異なる場合は通常のインラインリンクになる。

### ボタンリンク

title に `"btn"` を指定するとボタン風スタイルになる（`remark-btn.js`）。

```md
[リンクテキスト](https://example.com "btn")
```

[リンクテキスト](https://example.com "btn")

---

## 画像

### 通常画像

```md
![alt テキスト](./image.png)
```

### キャプション付き画像（figure）

title を指定すると `<figure>` + `<figcaption>` に変換される（`rehype-figure.js`）。

```md
![alt テキスト](./image.png "キャプションテキスト")
```

---

## コードブロック

言語を指定すると Shiki（github-dark テーマ）でシンタックスハイライト、言語ラベル、コピーボタンが付く。

````md
```js
const x = 1;
```
````

```js
const x = 1;
```

---

## 埋め込み

段落に **単独で書いた裸の URL**（リンクテキスト ≠ href だと変換されない）が各サービスに自動変換される。

### YouTube

```md
https://www.youtube.com/watch?v=VIDEO_ID
```

`<iframe>` 埋め込みになる（`rehype-youtube.js`）。

### Twitter / X

```md
https://twitter.com/user/status/STATUS_ID
```

Twitter ウィジェット埋め込みになる（`rehype-twitter.js`）。

### Steam

```md
https://store.steampowered.com/app/APP_ID/
```

Steam ウィジェット（高さ 190px）になる（`rehype-steam.js`）。

### OGP カード

上記以外の URL は OGP カードになる（`rehype-ogp-card.js`、ビルド時取得）。

```md
https://astro.build
```

OGP カードにしたくない場合はテキストと URL を別にする：

```md
[Astro 公式サイト](https://astro.build)
```

Cloudflare 保護されたサイトはカード取得に失敗し通常リンクにフォールバックする。

---

## デプロイ

```bash
npm run build    # ビルド確認
git add .
git commit -m "メッセージ"
git push origin main
```

GitHub Actions が自動でビルド＆デプロイする。

---

## カスタマイズ箇所

| 内容 | ファイル |
|------|---------|
| サイトタイトル | `src/layouts/Base.astro` の `SITE_TITLE` |
| 色・幅・フォント | `src/styles/global.css` の CSS 変数・body |
| OGP 画像（デフォルト） | `public/og-image.svg` |
| ベースパス | `astro.config.mjs` の `base` |

### CSS 変数

| 変数 | 値 | 用途 |
|------|----|------|
| `--bg` | `#1a1a1a` | 背景色 |
| `--fg` | `#f4f5f7` | 本文色 |
| `--muted` | `#aab2bd` | 訪問済みリンク・補足テキスト |
| `--faint` | `#828b97` | 日付・コードブロック枠など |
| `--link` | `#8fb6f0` | ボタンリンク色 |

---

## ローカル開発

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルド結果プレビュー
```

### キャッシュ削除

dev 環境と本番で動作が異なる場合：

```bash
rm -rf .astro node_modules/.vite
```

プラグインを変更した場合は dev サーバーの再起動が必要（`watchPlugins` が自動再起動するが効かない場合も）。
