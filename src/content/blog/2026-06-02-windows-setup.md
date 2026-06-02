---
title: '個人的Windowsセットアップ'
pubDate: '2026-06-02'
---

内容を理解した上で実行してね。
操作を誤るとパソコンが爆発します。

## インストール

Rufusでブートメディアを作成してWindowsをクリーンインストールする。

https://rufus.ie/ja/

## ディスプレイ設定

1. デスクトップで右クリック → ディスプレイ設定
2. ディスプレイの解像度を最適な値に変更
3. ディスプレイの詳細設定 → リフレッシュレートの選択を最適な値に変更

## 手動インストール

wingetで取得できないドライバ・ソフトウェアを手動でインストールする。

Nvidia App

https://www.nvidia.com/ja-jp/software/nvidia-app/

Nvidia Broadcast

https://www.nvidia.com/ja-jp/geforce/broadcasting/broadcast-app/

MOTU M Series

https://motu.com/en-us/download/product/408/#3110

Aqua Voice

https://aquavoice.com/download

## Win11Debloat

管理者権限でPowerShellを起動し、以下のワンライナーを実行する。起動後に「Custom」を選択し、以下の内容をJSONファイルとして保存したものを読み込む。

https://github.com/Raphire/Win11Debloat

```powershell
& ([scriptblock]::Create((irm "https://debloat.raphi.re/")))
```

```json
{
    "Apps": [
        "Microsoft.WindowsAlarms",
        "Microsoft.BingNews",
        "Microsoft.BingSearch",
        "Microsoft.BingWeather",
        "Microsoft.WindowsCalculator",
        "Microsoft.WindowsCamera",
        "Clipchamp.Clipchamp",
        "Microsoft.Copilot",
        "MicrosoftWindows.CrossDevice",
        "Microsoft.Windows.DevHome",
        "MicrosoftCorporationII.MicrosoftFamily",
        "Microsoft.WindowsFeedbackHub",
        "Microsoft.GetHelp",
        "Microsoft.ZuneMusic",
        "Microsoft.Todos",
        "Microsoft.MicrosoftOfficeHub",
        "Microsoft.Paint",
        "Microsoft.YourPhone",
        "MicrosoftCorporationII.QuickAssist",
        "Microsoft.MicrosoftSolitaireCollection",
        "Microsoft.MicrosoftStickyNotes",
        "MicrosoftWindows.Client.WebExperience"
    ],
    "Tweaks": [
        { "Value": true, "Name": "DisableSettings365Ads" },
        { "Value": true, "Name": "EnableDarkMode" },
        { "Value": true, "Name": "DisableBitlockerAutoEncryption" },
        { "Value": true, "Name": "HideSearchTb" },
        { "Value": true, "Name": "DisableTelemetry" },
        { "Value": true, "Name": "DisableWidgets" },
        { "Value": true, "Name": "HideDupliDrive" },
        { "Value": true, "Name": "DisableLockscreenTips" },
        { "Value": true, "Name": "DisableAISvcAutoStart" },
        { "Value": true, "Name": "DisableStartPhoneLink" },
        { "Value": true, "Name": "DisableSearchHighlights" },
        { "Value": true, "Name": "DisableMouseAcceleration" },
        { "Value": true, "Name": "DisableStartRecommended" },
        { "Value": true, "Name": "DisableStoreSearchSuggestions" },
        { "Value": true, "Name": "HideTaskview" },
        { "Value": true, "Name": "DisableEdgeAI" },
        { "Value": true, "Name": "DisableGameBarIntegration" },
        { "Value": true, "Name": "DisableDVR" },
        { "Value": true, "Name": "DisableSuggestions" },
        { "Value": true, "Name": "ShowKnownFileExt" },
        { "Value": true, "Name": "DisableDesktopSpotlight" },
        { "Value": true, "Name": "HideOnedrive" },
        { "Value": true, "Name": "EnableWindowsSubsystemForLinux" },
        { "Value": true, "Name": "HideGallery" },
        { "Value": true, "Name": "EnableEndTask" },
        { "Value": true, "Name": "ShowHiddenFolders" },
        { "Value": true, "Name": "DisableSettingsHome" },
        { "Value": true, "Name": "DisableNotepadAI" },
        { "Value": true, "Name": "DisableStickyKeys" },
        { "Value": true, "Name": "DisableCopilot" },
        { "Value": true, "Name": "DisableClickToDo" },
        { "Value": true, "Name": "DisableBing" },
        { "Value": true, "Name": "DisableSearchHistory" },
        { "Value": true, "Name": "DisableRecall" },
        { "Value": true, "Name": "DisableDragTray" },
        { "Value": true, "Name": "ExplorerToDownloads" },
        { "Value": true, "Name": "DisableEdgeAds" },
        { "Value": true, "Name": "DisablePaintAI" },
        { "Value": true, "Name": "DisableUpdateASAP" },
        { "Value": true, "Name": "HideHome" }
    ],
    "Deployment": [
        { "Value": 0,    "Name": "UserSelectionIndex" },
        { "Value": 0,    "Name": "AppRemovalScopeIndex" },
        { "Value": true, "Name": "CreateRestorePoint" },
        { "Value": true, "Name": "RestartExplorer" }
    ],
    "Version": "1.0"
}
```

## スクリプト実行

以下の内容を `run.bat` として保存する。PS1ファイルをこのbatにドラッグ＆ドロップすると、管理者権限で実行できる。

```bat
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~1"
pause
```

以下の内容を `install.ps1` として保存し、`run.bat` にドラッグして実行する。wingetでソフトウェアをまとめてインストールする。

```powershell
$packageIds = @(
    # ブラウザ
    'Google.Chrome'

    # VPN
    'NordSecurity.NordVPN'

    # ゲーム
    'Valve.Steam'
    'EpicGames.EpicGamesLauncher'

    # ビデオ
    'MPC-BE.MPC-BE'

    # コミュニケーション
    'Discord.Discord'
    'RomTenma.Siki'

    # 開発
    'Microsoft.VisualStudioCode'
    'Git.Git'
    'Microsoft.PowerShell'
    'OpenJS.NodeJS'
    'GitHub.cli'

    # ユーティリティ
    'Microsoft.PowerToys'
    'M2Team.NanaZip'
)

foreach ($packageId in $packageIds) {
    winget install -e --id $packageId --accept-source-agreements --accept-package-agreements
}
```

以下の内容を `setting.ps1` として保存し、`run.bat` にドラッグして実行する。電源・マウスの初期設定を行う（スクリプト内で管理者権限に自動昇格する）。

```powershell
# 管理者権限の昇格
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process pwsh -Verb RunAs -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath)
    exit
}

# 電源設定
powercfg -x monitor-timeout-ac 5   # 5分後にモニターをオフ
powercfg -x standby-timeout-ac 0   # スリープしない

# マウス加速を無効化
$mouse = 'HKCU:\Control Panel\Mouse'
Set-ItemProperty -Path $mouse -Name MouseSpeed      -Value '0'
Set-ItemProperty -Path $mouse -Name MouseThreshold1 -Value '0'
Set-ItemProperty -Path $mouse -Name MouseThreshold2 -Value '0'
```

## PowerToys — キーリマップ

PowerToys → Keyboard Manager → キーの再マップ で Caps Lock を別のキーに割り当てる。

