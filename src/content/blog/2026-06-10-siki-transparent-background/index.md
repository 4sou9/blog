---
title: '汎用掲示板ビューア Siki を常時透過する'
pubDate: '2026-06-10'
---

![Sikiのウィンドウが半透明になっている様子](./screenshot.png "Siki めっちゃ使いやすいので全人類使ったほうがいい")

https://sikiapp.net/

## 手順

### 1. startup プラグインをダウンロード

https://sikiapp.net/plugins/

### 2. plugins フォルダに配置

エクスプローラーのアドレスバーに以下のパスをコピペして開く。

```
%APPDATA%\Siki\profile\plugins
```

ダウンロードした `startup.zip` を展開して出てくるフォルダをそのまま配置。

### 3. index.js を編集する

`startup` フォルダ内の `index.js` を開き、中身を丸ごと以下に置き換える。

```js
/** 
  * Sikiの起動時に一度だけ実行されるスクリプト 
  * フォルダをpluginsへ配置して有効化
  * 
  * @version 0.0.1
 */

/**
 * プラグインのタイプ
 * startupは起動時にmainScriptの内容を一度だけ実行します
 */
module.exports.type = 'startup'

/**
 * プラグインの情報
 */
module.exports.meta = {
  name: 'startup',
  description: 'startup',
  version: '1.0.0',
  needVersion: '0.24.7'
}

/**
 * 
 * @param {Object} settings 
 * @param {{[key: string]: any}} settings.config - config.jsに記述された設定内容
 * @param {{[key: string]: any}} settings.userSettings - user.jsに記述された設定内容
 */
module.exports.mainScript = async (settings) => {
  const { BrowserWindow } = require('electron')
  const win = BrowserWindow.getAllWindows()[0]
  const OPACITY = 0.9

  const applyOpacity = () => win.setOpacity(OPACITY)

  win.on('focus', applyOpacity)
  setTimeout(applyOpacity, 500)

}
```

`OPACITY = 0.9` の値を変えると透過度を調整できます。1 が不透明、0 が完全透明です。

### 4. 設定を適用する

1. Siki を再起動
2. 設定 ＞ プラグイン から startup にチェックを入れる
3. もう一度再起動

スクリプトが読み込まれて、ウィンドウが半透明になります。
