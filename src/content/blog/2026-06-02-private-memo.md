---
title: 'ブログ運用メモ'
pubDate: '2026-06-02'
unlisted: true
---

## このブログについて

- フレームワーク: [Astro](https://astro.build) v6
- デプロイ先: GitHub Pages（`https://4sou9.github.io/blog/`）
- ソース: `src/content/blog/` 以下の `.md` ファイル

---

## 記事の作成

### ファイル命名規則

```
src/content/blog/YYYY-MM-DD-slug.md
```

### フロントマター

```yaml
---
title: '記事タイトル'
pubDate: '2026-06-02'
description: 'OGP用の説明文（省略可）'
unlisted: true   # 一覧に載せたくない記事はこれを追加
---
```

### 非公開記事（unlisted）

フロントマターに `unlisted: true` を書くと一覧には表示されないが、URLを直接開けばアクセスできる。

---

## Markdown記法チートシート

### テキスト装飾

```md
**太字**  *イタリック*  ~~打ち消し~~  `インラインコード`
```

### 見出し

```md
# h1（記事内では使わない。タイトルとして自動挿入される）
## h2
### h3
#### h4
```

### リスト

```md
- 箇条書き
  - ネスト

1. 番号付き
2. リスト
```

### リンク・画像

```md
[リンクテキスト](https://example.com)
![alt](画像URL)
```

### コードブロック

````md
```js
const x = 1;
```
````

### テーブル

```md
| 列1 | 列2 |
|-----|-----|
| A   | B   |
```

### 引用

```md
> 引用テキスト
```

---

## 埋め込み機能

段落に単独で書いたURLが自動変換される。

| 書き方 | 変換後 |
|--------|--------|
| YouTube URL を単独行に | iframeで動画埋め込み |
| X/Twitter ステータスURLを単独行に | ツイート埋め込み |
| Steam ストアURLを単独行に | Steamウィジェット埋め込み |
| その他URLを単独行に | OGPリンクカード |

OGPカードにしたくない場合はリンクテキストをURLと別にする。

```md
<!-- OGPカードになる（テキスト＝URL） -->
https://astro.build

<!-- 普通のリンクになる（テキスト≠URL） -->
[Astro公式サイト](https://astro.build)
```

---

## デプロイ

```bash
npm run build    # ビルド確認
git add .
git commit -m "メッセージ"
git push origin main
```

GitHub Actions が自動でビルド＆デプロイされる。

---

## カスタマイズ箇所

| 内容 | ファイル |
|------|---------|
| サイトタイトル | `src/layouts/Base.astro` の `SITE_TITLE` |
| 色・幅・フォント | `src/styles/global.css` の CSS変数・body |
| OGP画像 | `public/og-image.svg` |
