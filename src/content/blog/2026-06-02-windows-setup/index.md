---
title: '個人的 Windows11 セットアップ'
pubDate: '2026-06-02'
---

毎回やっている初期設定を上から順にまとめました。
あくまで自分用の構成なので、入れるソフトや設定は好みで決めています。

## Windows11 をインストール

インストールメディアは公式のメディア作成ツールではなく Rufus で作ります。
USB メモリにインストールメディアを書き込んだら、その USB から起動して Windows11 をインストールします。

https://rufus.ie/ja/

![Rufus のセットアップ画面](./setup.png "設定画面")

## ディスプレイ設定

設定 → システム → ディスプレイ から、解像度、拡大率、リフレッシュレートを使っているモニターに合わせます。

## Windows Update

設定 → Windows Update から、更新が出てこなくなるまで繰り返し当てます。

## PowerShell の実行ポリシーを変更

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## ソフトをまとめてインストール

パッケージ ID を配列に並べて、まとめてインストールします。

```powershell
$packageIds = @(
    # ブラウザ
    'Google.Chrome'

    # VPN
    'NordSecurity.NordVPN'

    # ゲーム
    'Valve.Steam'
    'EpicGames.EpicGamesLauncher'

    # メディア
    'mpv.net'

    # AI
    'Anthropic.Claude'

    # コミュニケーション
    'Discord.Discord'
    'RomTenma.Siki'

    # ダウンロード
    'yt-dlp.yt-dlp'
    'yt-dlp.FFmpeg'

    # ユーティリティ
    'M2Team.NanaZip'
)

foreach ($packageId in $packageIds) {
    winget install -e --id $packageId --accept-source-agreements --accept-package-agreements
}
```

## winget で入らないソフトを手動でインストール

winget に無かったり、winget 経由だとうまく動かなかったりするドライバやソフトは個別に入れます。

[**Nvidia App**](https://www.nvidia.com/ja-jp/software/nvidia-app/) - GeForce ドライバと Nvidia Broadcast を入れます。

[**Aqua Voice**](https://aquavoice.com/download) - 音声入力ツール。

[**MOTU M Series**](https://motu.com/en-us/download/product/408/#3110) - オーディオインターフェースのドライバ。

## サウンド設定

設定 → システム → サウンド から、既定の出力デバイスと入力デバイスを使う機材に切り替えます。

## 開発環境を構築

Microsoft 公式の WindowsDeveloperConfig で、開発ツールを一括で入れます。

https://github.com/microsoft/WindowsDeveloperConfig

管理者の PowerShell で実行します。

```powershell
winget configure --enable
$config = "$env:TEMP\dev-config.winget"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/microsoft/WindowsDeveloperConfig/main/windows-dev-config/dev-config.winget" -OutFile $config
winget configure -f $config --accept-configuration-agreements --disable-interactivity
```

これで入るものは次のとおりです。

- PowerShell 7
- Git
- GitHub CLI
- GitHub Copilot CLI
- VS Code
- .NET SDK
- Python
- uv（Python の高速なパッケージ/環境管理）
- Node.js（LTS）
- nvm for Windows（Node のバージョン管理）
- Oh My Posh
- winappcli（Windows App CLI）
- PowerToys
- WSL + Ubuntu

:::warn
WSL を有効化する途中で、一度再起動が入ります。
再起動したら PowerShell を開き直し、同じコマンドをもう一度実行してください。
残りの構成が続きから進みます。
WSL の初期化に失敗する場合は、BIOS/UEFI でハードウェア仮想化を有効にする。
:::

## 不要なアプリの削除と設定変更

Windows は仕様がよく変わるので、手作業で追うより、オープンソースで継続的に保守されているツールに任せたほうがいいです。
ここでは Win11Debloat を使います。

https://github.com/Raphire/Win11Debloat

次のワンライナーで起動します。

```powershell
& ([scriptblock]::Create((irm "https://debloat.raphi.re/")))
```

GUI が立ち上がったら、右上の ≡ ボタンから Import config を選び、下の JSON を保存したファイルを読み込んで適用します。
変更を元に戻したくなったら、同じ ≡ ボタンの Restore backup から戻せます。

:::danger
この手順はごっそりレジストリの編集とアプリ削除をするので、後戻りしにくいです。
下の JSON は自分の環境に合わせた削除リストなので、適用前に中身を確認して、残したいアプリは外しておいてください。
`CreateRestorePoint` で復元ポイントは作られ、レジストリ変更は Restore backup で戻せますが、削除したアプリは全て手動で入れ直しになります。
:::

```json
{
    "Apps":  [
                 "Microsoft.WindowsAlarms",
                 "Microsoft.BingNews",
                 "Microsoft.BingSearch",
                 "Microsoft.BingWeather",
                 "Microsoft.WindowsCalculator",
                 "Microsoft.WindowsCamera",
                 "Clipchamp.Clipchamp",
                 "MicrosoftWindows.CrossDevice",
                 "Microsoft.Windows.DevHome",
                 "MicrosoftCorporationII.MicrosoftFamily",
                 "Microsoft.WindowsFeedbackHub",
                 "Microsoft.GetHelp",
                 "Microsoft.ZuneMusic",
                 "Microsoft.Todos",
                 "Microsoft.Paint",
                 "Microsoft.YourPhone",
                 "Microsoft.PowerAutomateDesktop",
                 "MicrosoftCorporationII.QuickAssist",
                 "Microsoft.ScreenSketch",
                 "Microsoft.MicrosoftSolitaireCollection",
                 "Microsoft.WindowsSoundRecorder",
                 "Microsoft.MicrosoftStickyNotes",
                 "Microsoft.GamingApp",
                 "Microsoft.XboxGamingOverlay"
             ],
    "Tweaks":  [
                   {
                       "Value":  true,
                       "Name":  "DisableSettings365Ads"
                   },
                   {
                       "Value":  true,
                       "Name":  "EnableDarkMode"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableBitlockerAutoEncryption"
                   },
                   {
                       "Value":  true,
                       "Name":  "HideSearchTb"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableTelemetry"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableWidgets"
                   },
                   {
                       "Value":  true,
                       "Name":  "HideDupliDrive"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableLockscreenTips"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableStartPhoneLink"
                   },
                   {
                       "Value":  true,
                       "Name":  "StartAllAppsList"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableMouseAcceleration"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableStartRecommended"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableStoreSearchSuggestions"
                   },
                   {
                       "Value":  true,
                       "Name":  "PreventUpdateAutoReboot"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableDeliveryOptimization"
                   },
                   {
                       "Value":  true,
                       "Name":  "HideTaskview"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableGameBarIntegration"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableDVR"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableSuggestions"
                   },
                   {
                       "Value":  true,
                       "Name":  "ShowKnownFileExt"
                   },
                   {
                       "Value":  true,
                       "Name":  "ClearStartAllUsers"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableDesktopSpotlight"
                   },
                   {
                       "Value":  true,
                       "Name":  "HideOnedrive"
                   },
                   {
                       "Value":  true,
                       "Name":  "HideGallery"
                   },
                   {
                       "Value":  true,
                       "Name":  "EnableEndTask"
                   },
                   {
                       "Value":  true,
                       "Name":  "ShowHiddenFolders"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableSettingsHome"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableStickyKeys"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableFindMyDevice"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableUpdateASAP"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableBing"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableDragTray"
                   },
                   {
                       "Value":  true,
                       "Name":  "ExplorerToThisPC"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableEdgeAds"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableLocationServices"
                   }
               ],
    "Deployment":  [
                       {
                           "Value":  0,
                           "Name":  "UserSelectionIndex"
                       },
                       {
                           "Value":  0,
                           "Name":  "AppRemovalScopeIndex"
                       },
                       {
                           "Value":  true,
                           "Name":  "CreateRestorePoint"
                       },
                       {
                           "Value":  true,
                           "Name":  "RestartExplorer"
                       }
                   ],
    "Version":  "1.0"
}
```

## Git の初期設定

```powershell
git config --global user.name "名前"
git config --global user.email "メールアドレス"
```

## GitHub CLI でログイン

```powershell
gh auth login
```

## Claude Code をインストール

```powershell
irm https://claude.ai/install.ps1 | iex; if($?){ $b=Join-Path $HOME ".local\bin"; $p=[Environment]::GetEnvironmentVariable("Path","User"); if(($p -split ';') -notcontains $b){ [Environment]::SetEnvironmentVariable("Path","$p;$b","User") } }
```

## 残りの細かい調整

**スリープ抑止**：PowerToys の Awake を無期限にして、長時間の書き出しやエンコード中にスリープ・画面オフさせないようにします。

**スタートアップの整理**：タスクマネージャーのスタートアップ タブで、不要な自動起動を無効にします。