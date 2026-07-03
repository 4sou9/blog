---
title: 'Steam のプレイ時間を稼ぐだけのツールを作りました'
pubDate: '2026-06-09'
---

ゲームを実際に遊ばずに、放置で Steam のプレイ時間だけを積み上げるツール「Steam Idle Picker」を作りました。
最大 32 本のゲームを同時に「プレイ中」の状態にできます。

![SteamIdlePickerのGUI](./screenshot.png "何の意味があるんですか？")

## 使い方

1. 更新ボタンを押して、ライブラリのゲーム一覧を読み込む
2. 時間を稼ぎたいゲームを選ぶ
3. 再生ボタンを押すと、選んだゲームが放置状態に入る

やめるときは停止ボタンを押すだけです。
一覧は名前、App ID、放置中かどうかでソートでき、検索で絞り込めます。
言語（日本語/英語）とダーク/ライトテーマは、Windows の設定に合わせて自動で切り替わります。

## 動作環境とダウンロード

- Windows 10/11（x64）
- Steam がインストール済みで、起動していること
- Microsoft Edge WebView2 ランタイム（Windows 11 には標準で入っています）

[ダウンロード (v2.1.0)](https://github.com/4sou9/Steam_Idle_Picker/releases/download/v2.1.0/Steam%20Idle%20Picker_2.1.0_x64-setup.exe "btn")

ソースコードはこちら。

https://github.com/4sou9/Steam_Idle_Picker

## Tauri で作り直した話

初版は WPF（.NET 8）で作っていましたが、v2.1.0 で Tauri 2 + Rust + React に全面的に書き直しました。
これで実行に .NET ランタイムが不要になり、UI も Windows 11 の Fluent Design 風に刷新しています。
あわせて、検索やソートのあとに表示が崩れる不具合も直しました。
