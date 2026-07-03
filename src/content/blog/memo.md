---
title: 'ブログ記法ガイド'
pubDate: '2026-06-02'
unlisted: true
---

このブログで使える記法と運用手順の一覧。
各記法は書き方のコードと、実際にレンダリングされた表示例をセットで載せている。

## このブログについて

| 項目 | 内容 |
|------|------|
| フレームワーク | [Astro](https://astro.build) v6 |
| デプロイ先 | GitHub Pages（`https://4sou9.github.io/blog/`） |
| ベースパス | `/blog`（`import.meta.env.BASE_URL`） |
| コンテンツ | `src/content/blog/` 以下の `.md` ファイル |
| スタイル | `src/styles/global.css` |

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
description: 'OGP用の説明文'  # 基本記入しない。省略時は本文冒頭から自動生成
unlisted: true                 # 省略可。一覧非表示にする
---
```

`unlisted: true` を書くと記事一覧・RSS・検索・サイトマップ・OG 画像生成から除外されるが、URL を直接開けばアクセスできる。
この文字列一致で判定される箇所があるため、表記を揺らさずこのとおりに書く。

## 基本の Markdown

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

`h1` は記事タイトルとして自動挿入されるため、本文内では使わない。

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

| 列1 | 列2 |
|-----|-----|
| A   | B   |

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

## 画像

### 通常画像

```md
![alt テキスト](./image.png)
```

### キャプション付き画像

title を指定すると `<figure>` + `<figcaption>` に変換される（`rehype-figure.js`）。

```md
![alt テキスト](./image.png "キャプションテキスト")
```

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

## 埋め込み

段落に**単独で書いた裸の URL**（リンクテキスト ≠ href だと変換されない）が、URL の種類に応じて自動変換される。

### YouTube

`<iframe>` 埋め込みになる（`rehype-youtube.js`）。

```md
https://www.youtube.com/watch?v=VIDEO_ID
```

https://www.youtube.com/watch?v=dQw4w9WgXcQ

### Twitter / X

ウィジェット埋め込みになる（`rehype-twitter.js`）。

```md
https://twitter.com/user/status/STATUS_ID
```

https://x.com/elonmusk/status/1519480761749016577

### OGP カード

上記以外の URL は OGP カードになる（`rehype-ogp-card.js`。Steam ストアの URL もこれ）。
カードの情報はビルド時に取得され、失敗した場合は裸リンクのままになる（Cloudflare 保護されたサイトなど）。

```md
https://astro.build/
```

https://astro.build/

OGP カードにしたくない場合はテキストと URL を別にする：

```md
[Astro 公式サイト](https://astro.build)
```

## Custom Components

入れ子にするときは外側のコロンを内側より多くする（Tabs / Changelog は外側が `::::`）。
同数だと最初の子で閉じてしまう。

### Alert

`info` / `warn` / `danger` / `tip` の 4 種類。

```md
:::info
本文。リンクも `code` も入る。
:::
```

:::info
これは **info** アラートです。リンクも `code` も入ります。
:::

:::warn
これは warn アラート。注意喚起に使います。
:::

:::danger
これは danger アラート。破壊的操作の警告に。
:::

:::tip
これは tip アラート（おまけ）。
:::

### Collapsible

`<details>` に変換される。`desc` は省略可。

```md
:::collapse[タイトル]{desc="説明"}
中身
:::
```

:::collapse[詳細を表示]{desc="クリックで開閉します"}
中身はここに書きます。

- リスト
- も
- 書ける
:::

### Tabs

```md
::::tabs
:::tab[ラベル1]
中身
:::

:::tab[ラベル2]
中身
:::
::::
```

::::tabs
:::tab[Windows]
Windows の手順。
:::

:::tab[macOS]
macOS の手順。
:::

:::tab[Linux]
Linux の手順。
:::
::::

### Changelog

```md
::::changelog
:::release{version="v1.0.0" date="2026-06-09"}
- 変更点
:::
::::
```

::::changelog
:::release{version="v2.0.0" date="2026-06-09"}
- 新機能を追加
- バグ修正
:::

:::release{version="v1.0.0" date="2026-05-01"}
- 初回リリース
:::
::::

### Badge

インライン要素。`type` は `default` / `info` / `warn` / `danger` / `success` / `new`。

```md
:badge[NEW]{type="new"}
```

新着 :badge[NEW]{type="new"} / 情報 :badge[INFO]{type="info"} / 警告 :badge[WARN]{type="warn"} / 危険 :badge[DANGER]{type="danger"} / 成功 :badge[OK]{type="success"}

## デプロイ

main に push すると GitHub Actions が自動でビルド＆デプロイする。

```bash
npm run build    # ビルド確認
git add .
git commit -m "メッセージ"
git push origin main
```

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

## ローカル開発

```bash
npm run dev      # 開発サーバー起動（検索は動かない）
npm run build    # 本番ビルド（astro build + pagefind）
npm run preview  # ビルド結果プレビュー
```

### キャッシュ削除

dev 環境と本番で動作が異なる場合：

```bash
rm -rf .astro node_modules/.vite
```

プラグインを変更した場合は dev サーバーの再起動が必要（`watchPlugins` が自動再起動するが効かない場合も）。
