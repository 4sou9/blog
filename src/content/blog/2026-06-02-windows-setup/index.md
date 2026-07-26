---
title: '個人的 Windows11 セットアップ'
pubDate: '2026-06-02'
---

新しい PC を用意したときや Windows をクリーンインストールしたときに、毎回やっている初期設定を上から順にまとめました。
あくまで自分用の構成なので、入れるソフトや設定は好みで決めています。

## Windows11 をインストール

インストールメディアは公式のメディア作成ツールではなく Rufus で作ります。
Rufus は起動可能な USB メモリを作るオープンソースのツールで、書き込み時のオプションで Microsoft アカウントの強制や BitLocker の自動暗号化を外せるため、最初からローカルアカウントで始められます。

Rufus で USB メモリにインストールメディアを書き込んだら、その USB から起動して Windows11 をインストールします。

https://rufus.ie/ja/

![Rufus のセットアップ画面](./setup.png "設定画面")

## ディスプレイ設定

設定 → システム → ディスプレイ から、解像度、拡大率、リフレッシュレートを使っているモニターに合わせます。

## Windows Update

設定 → Windows Update から、更新が出てこなくなるまで繰り返し当てます。
ドライバやセキュリティ更新を先に済ませておくと、このあとの作業でつまずきにくくなります。

## PowerShell の実行ポリシーを変更

Windows は、拾ってきたスクリプトをうっかり動かさないための安全策として、既定でスクリプトの実行をブロックしています。
このあとの手順でスクリプトを使うので、実行ポリシーを RemoteSigned に緩めておきます。
RemoteSigned は、ローカルで作ったスクリプトはそのまま実行でき、ネット経由のものは署名がある場合だけ許可する設定です。
`-Scope CurrentUser` を付ければ、変更は自分のアカウントだけで済みます。
とはいえ実行ポリシーは回避もできるガードレールなので、過信せず中身を確認してから流すのが前提です。

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## ソフトをまとめてインストール

winget は Windows に標準で入っているパッケージマネージャです。
入れたいソフトのパッケージ ID を配列に並べてループで回せば、まとめてインストールできます。
2 つの `--accept-*` オプションで確認プロンプトを飛ばしているので、下のスクリプトを PowerShell に貼り付ければ途中で止まらず最後まで走ります。

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
    'DuongDieuPhap.ImageGlass'

    # AI
    'Anthropic.Claude'

    # コミュニケーション
    'Discord.Discord'
    'RomTenma.Siki'

    # ダウンロード
    'qBittorrent.qBittorrent'
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

[**Adobe Creative Cloud**](https://www.adobe.com/jp/creativecloud/desktop-app.html) - Premiere Pro、After Effects、Photoshop、Illustrator を入れます。

[**Aqua Voice**](https://aquavoice.com/download) - 音声入力ツール。

[**VOICEVOX**](https://voicevox.hiroshiba.jp/) - 無料のテキスト読み上げソフト。

[**A.I.VOICE2 Editor**](https://aivoice.jp/) - 音声合成ソフト。

[**MOTU M Series**](https://motu.com/en-us/download/product/408/#3110) - オーディオインターフェースのドライバ。

## サウンド設定

MOTU のドライバを入れたので、ここで音まわりを設定します。
設定 → システム → サウンド から、既定の出力デバイスと入力デバイスを使う機材に切り替えます。

## 開発環境を構築

Microsoft 公式の WindowsDeveloperConfig で、開発まわりのツールを一括で入れます。
設定ファイルに「入れるもの」を宣言しておき、winget configure に渡すだけで揃います。

https://github.com/microsoft/WindowsDeveloperConfig

管理者の PowerShell で実行します（非昇格だと別途 Visual C++ 再頒布可能パッケージが要ります）。
`winget configure` を有効化してから、設定ファイルを落として適用します。

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
WSL の初期化に失敗する場合は、BIOS/UEFI でハードウェア仮想化を有効にしてください。
:::

## 不要なアプリの削除と設定変更

:::danger
この手順は大量のレジストリの編集とアプリの削除を伴うので、後戻りしにくいです。
下の JSON は自分の環境に合わせた削除リストなので、適用前に中身を確認して、残したいアプリ（電卓やカメラなども消えます）は外しておいてください。
`CreateRestorePoint` で復元ポイントは作られ、レジストリ変更は Restore backup で戻せますが、削除したアプリは全て入れ直しになります。
:::

プリインストールされた使わないアプリを消し、プライバシーや見た目まわりの設定をまとめて変えます。
Windows は仕様がよく変わるので、手作業で追うより、オープンソースで継続的に保守されているツールに任せたほうがいいです。
ここでは Win11Debloat を使います。

https://github.com/Raphire/Win11Debloat

次のワンライナーで起動します。
これは `debloat.raphi.re` からスクリプトを取得して、そのまま実行する書き方です（`irm` でダウンロードした中身を即実行）。
中身を見ずに走らせる以上、配布元とその通信を信頼することになるので、不安なら URL をブラウザで開いて中身を読むか、上の GitHub リポジトリから取得して実行してください。

```powershell
& ([scriptblock]::Create((irm "https://debloat.raphi.re/")))
```

GUI が立ち上がったら、右上の ≡ ボタンから Import config を選び、下の JSON を保存したファイルを読み込んで適用します。
変更を元に戻したくなったら、同じ ≡ ボタンの Restore backup から戻せます。

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
                 "Microsoft.Windows.Photos",
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

コミットに使う名前とメールアドレスを設定します。

```powershell
git config --global user.name "名前"
git config --global user.email "メールアドレス"
```

## GitHub CLI でログイン

GitHub CLI で認証しておくと、git の資格情報もまとめて設定され、以後 push のたびに認証を聞かれずに済みます。

```powershell
gh auth login
```

あとは対話に従って GitHub アカウントを認証します。

## Claude Code をインストール

下のコマンドは、インストーラの実行と、実行ファイルの場所（`~/.local\bin`）を PATH に通す処理をまとめたものです。
インストーラの実行部分は `irm | iex`（ダウンロードした中身を即実行）の形で、Anthropic 公式が案内している方法そのままになっています。
ただし「公式が推奨だから中身を見なくていい」わけではなく、debloat と同じく claude.ai とその通信を信頼することになる点は変わりません。
気になるなら `irm https://claude.ai/install.ps1` だけ先に実行して中身を確認してから流してください。

```powershell
irm https://claude.ai/install.ps1 | iex; if($?){ $b=Join-Path $HOME ".local\bin"; $p=[Environment]::GetEnvironmentVariable("Path","User"); if(($p -split ';') -notcontains $b){ [Environment]::SetEnvironmentVariable("Path","$p;$b","User") } }
```

## 残りの細かい調整

**Caps Lock の無効化**：PowerToys の Keyboard Manager で、Caps Lock を別のキーに割り当てて潰します。

**スリープ抑止**：PowerToys の Awake を無期限にして、長時間の書き出しやエンコード中にスリープ・画面オフさせないようにします。

**スタートアップの整理**：タスクマネージャーのスタートアップ タブで、不要なソフトの自動起動を無効にします。