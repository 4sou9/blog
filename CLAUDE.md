# CLAUDE.md

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview built output
```

No lint or test scripts exist.

## Architecture

Astro static blog ("ねこのメモ") deployed to GitHub Pages.

**Content** (`src/content/blog/`)
- 画像なし: `YYYY-MM-DD-slug.md`、画像あり: `YYYY-MM-DD-slug/index.md` + 画像ファイル
- Frontmatter: `title` (required), `pubDate` (required, coerced to Date), `description` (optional), `unlisted` (optional, 一覧非表示)

**Plugins** (`src/plugins/`)
- `rehype-youtube.js` — YouTube URL → `<iframe>` embed
- `rehype-twitter.js` — Twitter/X URL → embed widget
- `rehype-steam.js` — Steam store URL → Steam widget `<iframe>`（高さ190px）
- `rehype-ogp-card.js` — bare URL → OGP card (build time)。`steampowered.com` はスキップ済み
- `rehype-figure.js` — 画像 → `<figure>` + キャプション（alt/title）
- `rehype-external-links.js` — 本文の外部リンク（http/https）に `target="_blank"` + `rel="noopener noreferrer"` を付与
- `remark-btn.js` — リンクタイトル `"btn"` → ボタン風スタイル
- `remark-excerpt.js` — 本文先頭から抜粋（description 未指定時の概要）

**埋め込みの書き方**: Markdown上で単独行の裸URL（リンクテキスト≠hrefだと変換されない）

```
# YouTube
https://www.youtube.com/watch?v=VIDEO_ID

# Twitter/X
https://twitter.com/user/status/STATUS_ID

# Steam ストアページ
https://store.steampowered.com/app/APP_ID/

# その他URL → OGPカード
https://example.com/
```

**キャッシュ削除**: dev環境と本番で動作が異なる場合は `.astro` と `node_modules/.vite` を削除して再起動。プラグイン変更はdev serverの再起動が必要（`watchPlugins`が自動再起動するが効かない場合も）。

**BASE_URL**: `import.meta.env.BASE_URL` = `/blog`（trailing slash なし）。常に `${base}/path` と書く。

**ボタンリンク**: リンクタイトルに `"btn"` を指定するとボタン風スタイルになる（`remark-btn.js`）。
```
[テキスト](https://example.com "btn")
```

**Custom Components**（`:::`ディレクティブ、`remark-directives.js`）: `C:\Users\kirito\site`（Discord 開発者ドキュメント風）を参考に実装。スタイルは `global.css` の「Custom Components」節。
```
# Alert（info / warn / danger / tip）
:::info
本文
:::

# Collapsible（<details>。title はラベル、desc は任意）
:::collapse[タイトル]{desc="説明"}
中身
:::

# Tabs（入れ子なので外側は :::: を使う）
::::tabs
:::tab[ラベル1]
中身1
:::
:::tab[ラベル2]
中身2
:::
::::

# Changelog（入れ子なので外側は :::: を使う）
::::changelog
:::release{version="v1.0.0" date="2026-06-09"}
- 変更点
:::
::::

# Badge（インライン。type=default/info/warn/danger/success/new）
:badge[NEW]{type="new"}
```
**入れ子の注意**: `remark-directive` はコンテナを入れ子にするとき、外側のコロンを内側より多くする必要がある（Tabs/Changelog は外 `::::`・内 `:::`）。同数だと最初の子で閉じてしまう。サンプルは `sandbox.md`（unlisted）。

## 執筆スキル

記事を書く・推敲するときは `japanese-tech-writing` skill（`.claude/skills/`）の文章規範に従う。一文一行、LLM っぽい空句の禁止、冗長の排除など。常駐させず呼び出し時に参照する。
