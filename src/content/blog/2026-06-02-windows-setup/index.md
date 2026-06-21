---
title: '個人的 Windows11 セットアップ'
pubDate: '2026-06-02'
---

内容を理解した上で実行してね。操作を誤るとパソコンが爆発します。

## Windows11 をインストール

Rufus でブートメディアを作成してインストール。

https://rufus.ie/ja/

![Rufus のセットアップ画面](./setup.png "ローカルアカウントの作成や BitLocker を無効にカスタムできて便利。")

## ディスプレイ設定

解像度、拡大縮小、リフレッシュレートを変更。

## Windows Update

更新がなくなるまで当てる。

## PowerShell

実行ポリシー変更。
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```


## ソフトのインストール

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
    'ShareX.ShareX'
)

foreach ($packageId in $packageIds) {
    winget install -e --id $packageId --accept-source-agreements --accept-package-agreements
}
```

## ソフトの手動インストール

winget で取得できなかったりパッケージマネージャ経由だと動作しないドライバ・ソフトウェアを手動でインストールする。

Nvidia App（GeForce Driver、Nvidia Broadcast のインストールもここから行う）

https://www.nvidia.com/ja-jp/software/nvidia-app/

Aqua Voice

https://aquavoice.com/download

MOTU M Series

https://motu.com/en-us/download/product/408/#3110

## サウンド設定

出力、入力デバイスを変更。

## 開発環境の構築

Microsoft 公式の WindowsDeveloperConfig を使い開発環境を構築。

https://github.com/microsoft/WindowsDeveloperConfig

```powershell
$config = "$env:TEMP\dev-config.winget"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/microsoft/WindowsDeveloperConfig/main/windows-dev-config/dev-config.winget" -OutFile $config
winget configure -f $config --accept-configuration-agreements --disable-interactivity
```

- PowerShell 7
- Git
- GitHub CLI
- VS Code
- .NET SDK
- Python
- Node.js (LTS + NVM)
- Oh My Posh
- WSL + Ubuntu

他にも色々入るけど長いので割愛。

WSL 有効化のために途中で再起動が入る。再起動後に PowerShell を開き直して同じコマンドを実行すれば残りの構成が続行される。

## ソフトのアンインストールと設定変更

レジストリの編集やソフトのアンインストールを行う。 Windows の仕様変更についていくのが面倒なので、オープンソースで長期間保守されているツールを使うのがよさげ。

https://github.com/Raphire/Win11Debloat

以下のワンライナーを実行。

```powershell
& ([scriptblock]::Create((irm "https://debloat.raphi.re/")))
```

GUI が立ち上がるので、右上の ≡ ボタンから Import config を選択。以下の内容を保存した JSON ファイルを読み込み適用。

レジストリの変更を元に戻す場合は ≡ ボタンから Restore backup

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
                 "Microsoft.Windows.AIHub",
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
                   { "Value": true, "Name": "DisableSettings365Ads" },
                   { "Value": true, "Name": "EnableDarkMode" },
                   { "Value": true, "Name": "DisableBitlockerAutoEncryption" },
                   { "Value": true, "Name": "HideSearchTb" },
                   { "Value": true, "Name": "DisableTelemetry" },
                   { "Value": true, "Name": "DisableWidgets" },
                   { "Value": true, "Name": "DisableLockscreenTips" },
                   { "Value": true, "Name": "DisableAISvcAutoStart" },
                   { "Value": true, "Name": "DisableStartPhoneLink" },
                   { "Value": true, "Name": "DisableStartRecommended" },
                   { "Value": true, "Name": "DisableMouseAcceleration" },
                   { "Value": true, "Name": "DisableStoreSearchSuggestions" },
                   { "Value": true, "Name": "DisableDeliveryOptimization" },
                   { "Value": true, "Name": "HideTaskview" },
                   { "Value": true, "Name": "DisableGameBarIntegration" },
                   { "Value": true, "Name": "DisableDVR" },
                   { "Value": true, "Name": "DisableSuggestions" },
                   { "Value": true, "Name": "ShowKnownFileExt" },
                   { "Value": true, "Name": "ClearStart" },
                   { "Value": true, "Name": "DisableDesktopSpotlight" },
                   { "Value": true, "Name": "HideOnedrive" },
                   { "Value": true, "Name": "HideGallery" },
                   { "Value": true, "Name": "EnableEndTask" },
                   { "Value": true, "Name": "ShowHiddenFolders" },
                   { "Value": true, "Name": "DisableEdgeAI" },
                   { "Value": true, "Name": "DisableSettingsHome" },
                   { "Value": true, "Name": "DisableNotepadAI" },
                   { "Value": true, "Name": "DisableStickyKeys" },
                   { "Value": true, "Name": "DisableFindMyDevice" },
                   { "Value": true, "Name": "DisableClickToDo" },
                   { "Value": true, "Name": "DisableBing" },
                   { "Value": true, "Name": "DisableUpdateASAP" },
                   { "Value": true, "Name": "DisableRecall" },
                   { "Value": true, "Name": "DisableDragTray" },
                   { "Value": true, "Name": "ExplorerToThisPC" },
                   { "Value": true, "Name": "DisableEdgeAds" },
                   { "Value": true, "Name": "DisableLocationServices" },
                   { "Value": true, "Name": "DisablePaintAI" }
               ],
    "Deployment":  [
                       { "Value": 0,    "Name": "UserSelectionIndex" },
                       { "Value": 0,    "Name": "AppRemovalScopeIndex" },
                       { "Value": true, "Name": "CreateRestorePoint" },
                       { "Value": true, "Name": "RestartExplorer" }
                   ],
    "Version":  "1.0"
}
```

## Git

```powershell
git config --global user.name "名前"
git config --global user.email "メールアドレス"
git config --global core.autocrlf true
```

## GitHub CLI

```powershell
gh auth login
```

## Claude Code

```powershell
irm https://claude.ai/install.ps1 | iex; if($?){ $b=Join-Path $HOME ".local\bin"; $p=[Environment]::GetEnvironmentVariable("Path","User"); if(($p -split ';') -notcontains $b){ [Environment]::SetEnvironmentVariable("Path","$p;$b","User") } }
```

## Caps Lockを消す

Caps Lock を PowerToys の Keyboard Manager で別のキーに割り当てる。

## スタートアップの整理

不要なソフトを無効化。