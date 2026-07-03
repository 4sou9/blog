---
name: blog-writing
description: 記事の書き方（ファイル配置、frontmatter、埋め込み記法、ボタンリンク、Custom Components）。記事の新規作成・編集時に使用。文章規範は japanese-tech-writing を別途参照。
---

# 記事の書き方

**配置**（`src/content/blog/`）: 画像なし `YYYY-MM-DD-slug.md`、画像あり `YYYY-MM-DD-slug/index.md` + 画像。

**Frontmatter**: `title`（必須）、`pubDate`（必須）、`description`（基本記入しない方針。未指定なら自動抜粋）、`unlisted: true`（任意。一覧・RSS・検索・sitemap・OG画像から除外。URL 直打ちでは見える。この文字列一致で判定される箇所があるため表記ゆれ不可）

**埋め込み**: 単独行の裸URL（リンクテキスト≠href だと変換されない）。YouTube → iframe、Twitter/X → widget、その他 → OGPカード（Steam 含む。build 時 fetch、失敗時は裸リンクのまま）。

**ボタンリンク**: `[テキスト](https://example.com "btn")`

**Custom Components**（サンプル: `memo.md` = 記法ガイド）:

```
:::info          ← Alert（info / warn / danger / tip）
本文
:::

:::collapse[タイトル]{desc="説明"}   ← <details>。desc 任意
中身
:::

::::tabs
:::tab[ラベル1]
中身
:::
::::

::::changelog
:::release{version="v1.0.0" date="2026-06-09"}
- 変更点
:::
::::

:badge[NEW]{type="new"}   ← インライン。type=default/info/warn/danger/success/new
```

入れ子は外側のコロンを内側より多くする（Tabs/Changelog は外 `::::`）。同数だと最初の子で閉じる。
