---
title: '個人的 Windows11 セットアップ'
pubDate: '2026-06-02'
---

新しい PC を用意したときや Windows をクリーンインストールしたときに、毎回やっている初期設定を上から順にまとめた。
あくまで自分用の構成なので、入れるソフトや設定は好みで決めている。

## Windows11 をインストール

公式のメディア作成ツールではなく Rufus を使う。
インストールメディアを作る段階で、Microsoft アカウントの強制や BitLocker の自動暗号化を回避でき、ローカルアカウントで始められるからだ。

Rufus を入手したら、USB メモリにインストールメディアを書き込む。
その USB から起動して Windows11 をインストールする。

https://rufus.ie/ja/

![Rufus のセットアップ画面](./setup.png "設定画面")

## ディスプレイ設定

設定 → システム → ディスプレイ から、解像度、拡大率、リフレッシュレートを使っているモニターに合わせる。

## Windows Update

設定 → Windows Update から、更新が出てこなくなるまで繰り返し当てる。
ドライバやセキュリティ更新を先に済ませておくと、このあとの作業でつまずきにくい。

## PowerShell の実行ポリシーを変更

Windows は既定でスクリプトの実行をブロックしている。拾ってきたスクリプトをうっかり動かさないための安全策。
RemoteSigned は、自分で書いたローカルのスクリプトはそのまま実行でき、ネット経由のものは署名がある場合だけ許可する設定。改ざんされたダウンロード済みスクリプトを弾きやすくなる。
`-Scope CurrentUser` なら変更は自分のアカウントだけで済む。とはいえ実行ポリシーは回避もできる「ガードレール」なので、過信せず中身を確認してから流すのが前提。

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## ソフトをまとめてインストール

winget は Windows 標準のパッケージマネージャ。
入れたいソフトのパッケージ ID を並べ、ループでまとめてインストールする。
そのまま PowerShell に貼り付けて実行すればいい。

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

    # コミュニケーション
    'Discord.Discord'
    'RomTenma.Siki'

    # ダウンロード
    'qBittorrent.qBittorrent'
    'yt-dlp.yt-dlp'
    'yt-dlp.FFmpeg'

    # ユーティリティ
    'M2Team.NanaZip'
    'KDE.KDEConnect'
)

foreach ($packageId in $packageIds) {
    winget install -e --id $packageId --accept-source-agreements --accept-package-agreements
}
```

## winget で入らないソフトを手動でインストール

winget に無かったり、winget 経由だとうまく動かなかったりするドライバやソフトは個別に入れる。

[**Nvidia App**](https://www.nvidia.com/ja-jp/software/nvidia-app/) - GeForce ドライバと Nvidia Broadcast を入れる。

[**Adobe Creative Cloud**](https://www.adobe.com/jp/creativecloud/desktop-app.html) - Premiere Pro、After Effects、Photoshop、Illustrator を入れる。

[**Aqua Voice**](https://aquavoice.com/download) - 音声入力ツール。

[**VOICEVOX**](https://voicevox.hiroshiba.jp/) - 無料のテキスト読み上げソフト。

[**A.I.VOICE2 Editor**](https://aivoice.jp/) - 音声合成ソフト。

[**MOTU M Series**](https://motu.com/en-us/download/product/408/#3110) - オーディオインターフェースのドライバ。

## サウンド設定

MOTU のドライバを入れたので、ここで音まわりを設定する。
設定 → システム → サウンド から、既定の出力デバイスと入力デバイスを使う機材に切り替える。

## 開発環境を構築

Microsoft 公式の WindowsDeveloperConfig で、開発まわりのツールを一括で入れる。
設定ファイルに「入れるもの」を宣言しておき、winget configure に渡すだけで揃う。

https://github.com/microsoft/WindowsDeveloperConfig

管理者の PowerShell で実行する（非昇格だと別途 Visual C++ 再頒布可能パッケージが要る）。
`winget configure` を有効化してから、設定ファイルを落として適用する。

```powershell
winget configure --enable
$config = "$env:TEMP\dev-config.winget"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/microsoft/WindowsDeveloperConfig/main/windows-dev-config/dev-config.winget" -OutFile $config
winget configure -f $config --accept-configuration-agreements --disable-interactivity
```

これで入るもの。

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
WSL を有効化する途中で、一度再起動が入る。
再起動したら PowerShell を開き直し、同じコマンドをもう一度実行する。残りの構成が続きから進む。
WSL の初期化に失敗する場合は、BIOS/UEFI でハードウェア仮想化を有効にする。
:::

## 不要なアプリの削除と設定変更

:::danger
この手順は大量のレジストリの編集とアプリの削除を伴うので、後戻りしにくい。
下の JSON は自分の環境に合わせた削除リストなので、適用前に中身を確認して、残したいアプリ（電卓やカメラなども消える）は外しておくとよい。
 `CreateRestorePoint` で復元ポイントは作られ、レジストリ変更は Restore backup で戻せるが、削除したアプリは全て入れ直しになる。
:::

プリインストールされた使わないアプリを消し、プライバシーや見た目まわりの設定をまとめて変える。
Windows は仕様がよく変わるので、手作業で追うより、オープンソースで継続的に保守されているツールに任せるのがよさげ。
ここでは Win11Debloat を使う。

https://github.com/Raphire/Win11Debloat

次のワンライナーで起動する。
これは `debloat.raphi.re` からスクリプトを取得して、そのまま実行する書き方（`irm` でダウンロードした中身を即実行）。
中身を見ずに走らせる以上、配布元とその通信を信頼することになるので、不安なら URL をブラウザで開いて中身を読むか、上の GitHub リポジトリから取得して実行する。

```powershell
& ([scriptblock]::Create((irm "https://debloat.raphi.re/")))
```

GUI が立ち上がったら、右上の ≡ ボタンから Import config を選び、下の JSON を保存したファイルを読み込んで適用する。
変更を元に戻したくなったら、同じ ≡ ボタンの Restore backup から戻せる。

```json
{
    "Apps":  [
                 "Microsoft.3DBuilder",
                 "Microsoft.Microsoft3DViewer",
                 "ACGMediaPlayer",
                 "ActiproSoftwareLLC",
                 "AdobeSystemsIncorporated.AdobePhotoshopExpress",
                 "Microsoft.WindowsAlarms",
                 "Amazon.com.Amazon",
                 "Asphalt8Airborne",
                 "AutodeskSketchBook",
                 "Microsoft.BingFinance",
                 "Microsoft.BingFoodAndDrink",
                 "Microsoft.BingHealthAndFitness",
                 "Microsoft.BingNews",
                 "Microsoft.BingSearch",
                 "Microsoft.BingSports",
                 "Microsoft.BingTranslator",
                 "Microsoft.BingTravel",
                 "Microsoft.BingWeather",
                 "king.com.BubbleWitch3Saga",
                 "CaesarsSlotsFreeCasino",
                 "Microsoft.WindowsCalculator",
                 "Microsoft.WindowsCamera",
                 "king.com.CandyCrushSaga",
                 "king.com.CandyCrushSodaSaga",
                 "Clipchamp.Clipchamp",
                 "COOKINGFEVER",
                 "Microsoft.549981C3F5F10",
                 "MicrosoftWindows.CrossDevice",
                 "CyberLinkMediaSuiteEssentials",
                 "DellInc.DellDigitalDelivery",
                 "DellInc.DellMobileConnect",
                 "DellInc.DellSupportAssistforPCs",
                 "Microsoft.Windows.DevHome",
                 "Disney",
                 "DisneyMagicKingdoms",
                 "DrawboardPDF",
                 "Duolingo-LearnLanguagesforFree",
                 "EclipseManager",
                 "Facebook",
                 "MicrosoftCorporationII.MicrosoftFamily",
                 "FarmVille2CountryEscape",
                 "Microsoft.WindowsFeedbackHub",
                 "fitbit",
                 "Flipboard",
                 "Microsoft.GetHelp",
                 "Microsoft.Getstarted",
                 "HiddenCity",
                 "AD2F1837.HPAIExperienceCenter",
                 "AD2F1837.HPConnectedMusic",
                 "AD2F1837.HPConnectedPhotopoweredbySnapfish",
                 "AD2F1837.HPDesktopSupportUtilities",
                 "AD2F1837.HPEasyClean",
                 "AD2F1837.HPFileViewer",
                 "AD2F1837.HPJumpStarts",
                 "AD2F1837.HPPCHardwareDiagnosticsWindows",
                 "AD2F1837.HPPowerManager",
                 "AD2F1837.HPPrinterControl",
                 "AD2F1837.HPPrivacySettings",
                 "AD2F1837.HPQuickDrop",
                 "AD2F1837.HPQuickTouch",
                 "AD2F1837.HPRegistration",
                 "AD2F1837.HPSupportAssistant",
                 "AD2F1837.HPSureShieldAI",
                 "AD2F1837.HPSystemInformation",
                 "AD2F1837.HPWelcome",
                 "AD2F1837.HPWorkWell",
                 "HULULLC.HULUPLUS",
                 "iHeartRadio",
                 "Instagram",
                 "E046963F.LenovoCompanion",
                 "LenovoCompanyLimited.LenovoVantageService",
                 "LinkedInforWindows",
                 "Sidia.LiveWallpaper",
                 "Microsoft.windowscommunicationsapps",
                 "MarchofEmpires",
                 "Microsoft.ZuneMusic",
                 "Microsoft.Messaging",
                 "Microsoft.M365Companions",
                 "Microsoft.MicrosoftJournal",
                 "Microsoft.News",
                 "Microsoft.PCManager",
                 "MSTeams",
                 "MicrosoftTeams",
                 "Microsoft.Todos",
                 "Microsoft.MixedReality.Portal",
                 "Microsoft.ZuneVideo",
                 "AD2F1837.myHP",
                 "Netflix",
                 "Microsoft.NetworkSpeedTest",
                 "NYTCrossword",
                 "Microsoft.MicrosoftOfficeHub",
                 "OneCalendar",
                 "Microsoft.OneConnect",
                 "Microsoft.OneDrive",
                 "Microsoft.Office.OneNote",
                 "Microsoft.OutlookForWindows",
                 "Microsoft.Paint",
                 "Microsoft.MSPaint",
                 "PandoraMediaInc",
                 "Microsoft.People",
                 "Microsoft.YourPhone",
                 "Microsoft.Windows.Photos",
                 "PhototasticCollage",
                 "PicsArt-PhotoStudio",
                 "Plex",
                 "PolarrPhotoEditorAcademicEdition",
                 "Microsoft.MicrosoftPowerBIForWindows",
                 "AmazonVideo.PrimeVideo",
                 "Microsoft.Print3D",
                 "MicrosoftCorporationII.QuickAssist",
                 "Microsoft.RemoteDesktop",
                 "Royal Revolt",
                 "Shazam",
                 "Microsoft.SkypeApp",
                 "SlingTV",
                 "Microsoft.ScreenSketch",
                 "Microsoft.MicrosoftSolitaireCollection",
                 "Microsoft.WindowsSoundRecorder",
                 "Spotify",
                 "Microsoft.MicrosoftStickyNotes",
                 "Microsoft.Office.Sway",
                 "TikTok",
                 "TuneInRadio",
                 "Twitter",
                 "Viber",
                 "Microsoft.Whiteboard",
                 "Microsoft.StartExperiencesApp",
                 "Microsoft.WidgetsPlatformRuntime",
                 "Microsoft.WindowsMaps",
                 "MicrosoftWindows.Client.WebExperience",
                 "WinZipUniversal",
                 "Wunderlist",
                 "Microsoft.XboxApp",
                 "Microsoft.XboxGameOverlay",
                 "Microsoft.GamingApp",
                 "Microsoft.XboxGamingOverlay",
                 "Microsoft.XboxIdentityProvider",
                 "Microsoft.XboxSpeechToTextOverlay",
                 "Microsoft.Xbox.TCUI",
                 "XING"
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
                       "Name":  "DisableLockscreenTips"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableAISvcAutoStart"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableStartPhoneLink"
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
                       "Name":  "DisableEdgeAI"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableSettingsHome"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableNotepadAI"
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
                       "Name":  "DisableClickToDo"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableBing"
                   },
                   {
                       "Value":  true,
                       "Name":  "DisableRecall"
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
                   },
                   {
                       "Value":  true,
                       "Name":  "DisablePaintAI"
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

コミットに使う名前とメールアドレスを設定する。

```powershell
git config --global user.name "名前"
git config --global user.email "メールアドレス"
```

## GitHub CLI でログイン

```powershell
gh auth login
```

あとは対話に従って GitHub アカウントを認証する。

## Claude Code をインストール

インストーラを実行し、実行ファイルの場所（`~/.local\bin`）を PATH に通す。
これも `irm | iex`（ダウンロードした中身を即実行）の形で、Anthropic 公式が案内しているインストール方法。
ただし「公式が推奨だから中身を見なくていい」わけではなく、debloat と同じく claude.ai とその通信を信頼することになる点は変わらない。気になるなら `irm https://claude.ai/install.ps1` だけ先に実行して中身を確認してから流す。

```powershell
irm https://claude.ai/install.ps1 | iex; if($?){ $b=Join-Path $HOME ".local\bin"; $p=[Environment]::GetEnvironmentVariable("Path","User"); if(($p -split ';') -notcontains $b){ [Environment]::SetEnvironmentVariable("Path","$p;$b","User") } }
```

## その他

**Caps Lock の無効化**：PowerToys の Keyboard Manager で、Caps Lock を別のキーに割り当てて潰す。

**スリープ抑止**：PowerToys の Awake を無期限にして、長時間の書き出しやエンコード中にスリープ・画面オフさせないようにする。

**スタートアップの整理**：タスクマネージャーのスタートアップ タブで、不要なソフトの自動起動を無効にする。