---
title: Epic Games のゲームを再ダウンロードせず引き継ぐ
pubDate: 2026-06-23
---

Steam はライブラリフォルダを別ドライブに置いておけば、クリーンインストール後にフォルダを指定するだけで全ゲームが戻る。
Epic Games Launcher にはこれが無い。
ゲーム本体が別ドライブに残っていても、入れ直すと認識されず再ダウンロードになる。
これを解決する手段を二つ紹介する。

## なぜ Steam は楽で Epic は引き継げないのか

両者の違いは、インストール情報をどこに置くかにある。
Steam は各ライブラリフォルダの中の `appmanifest_*.acf` に状態を持つ。
だからフォルダを指定し直せば、その場で読み直して全ゲームを復元できる。

Epic は `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests` の中の `.item`（JSON）に状態を持つ。
これはゲーム本体とは別管理なので、クリーンインストールで `.item` が消えると、本体が残っていてもランチャーは存在を知らない。

ただし、各ゲームフォルダ内の隠しフォルダ `.egstore` にはバージョン情報を持つ `.manifest` があり、ゲーム本体と一緒なのでドライブが残れば生き残る。
つまり消えるのは `ProgramData` 側の `.item` だけで、ゲームの実体と `.egstore` は手元にある。
復元とは、この失われた `.item` をどう取り戻すかという話になる。

## 方法1 ランチャーに .item を作らせる

`.item` を保存していなくても復元できる。
インストールを始めるとランチャーが最新の `.item` と `.egstore` を作り直すので、その二つだけ採用して、ゲーム本体は手元に残っているものを使わせる。

1. 復元したいゲームのフォルダ（例 `D:\EpicLibrary\GameName`）の名前を一時的に変える（末尾に `-old` を付けるなど）。同名のフォルダがあるとランチャーがインストールを始められないため。
2. ランチャーでそのゲームを、元と同じ場所にインストール開始する。ランチャーが新しい `GameName` フォルダを作り、その中に `.egstore` を生成してダウンロードを始める。
3. ダウンロードが始まったらすぐ一時停止する。
4. 新しいフォルダの中にできた `.egstore` を切り取り、手順1で退避した `-old` フォルダへ移す（元の `.egstore` と置き換える）。
5. 中身の少ない新しいフォルダを削除し、`-old` フォルダの名前を元に戻す。
6. ランチャーで再開する。検証が走り、ファイルが揃っていればダウンロードはスキップされる。

この方法の利点は、追加ツールも事前準備もいらないことだ。
欠点は、ゲームを一本ずつ手作業で処理することと、手元のファイルが最新版と一致していないと差分のダウンロードが発生することにある。

## 方法2 PowerShell で .item を書き換えて一括復元

`.item` を事前に退避しておけば、入れ直したあとに全ゲームをまとめて復元できる。
ここでは PowerShell スクリプトを使う。
普段 PowerShell を触らない人でも、次の手順をなぞれば実行できる。多分。

まず、下のスクリプトを用意する。

```powershell
<#
.SYNOPSIS
    Re-link already-installed Epic Games on another drive to the launcher
    without re-downloading. No Python required; uses the built-in Windows PowerShell.

.EXAMPLE
    .\Epic-Relink.ps1 backup  -GamesFolder D:\EpicLibrary
    .\Epic-Relink.ps1 restore -GamesFolder D:\EpicLibrary
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory, Position = 0)]
    [ValidateSet('backup', 'restore')]
    [string]$Mode,

    [string]$GamesFolder,
    [string]$BackupFolder,
    [string]$ManifestsPath = (Join-Path $env:ProgramData 'Epic\EpicGamesLauncher\Data\Manifests'),
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$BACKUP_DIR_NAME = '_MANIFEST_BACKUPS'
$EGSTORE_NAME    = '.egstore'
$STAGING_NAME    = 'bps'
$SUPPORTED_FORMAT_VERSIONS = @(0)

function Write-Info ($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Ok   ($m) { Write-Host "[ OK ] $m" -ForegroundColor Green }
function Write-Warn ($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }

function Assert-LauncherClosed {
    $proc = Get-Process -Name 'EpicGamesLauncher' -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Warn 'Epic Games Launcher is running. Close it completely before continuing.'
        if (-not $Force) { throw 'Aborted. Close the launcher (or pass -Force).' }
    }
}

function Resolve-BackupFolder {
    if ($BackupFolder) { return $BackupFolder }
    if ($GamesFolder)  { return (Join-Path $GamesFolder $BACKUP_DIR_NAME) }
    throw 'Specify -BackupFolder or -GamesFolder.'
}

# Build a map: manifest base name -> game folder full path
function Get-GameManifestMap ([string]$gamesRoot) {
    $map = @{}
    foreach ($dir in (Get-ChildItem -LiteralPath $gamesRoot -Directory)) {
        if ($dir.Name -eq $BACKUP_DIR_NAME) { continue }
        $egstore = Join-Path $dir.FullName $EGSTORE_NAME
        if (-not (Test-Path -LiteralPath $egstore)) { continue }
        foreach ($mf in (Get-ChildItem -LiteralPath $egstore -Filter '*.manifest' -File -ErrorAction SilentlyContinue)) {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($mf.Name)
            $map[$base] = $dir.FullName
        }
    }
    return $map
}

function Invoke-Backup {
    Assert-LauncherClosed
    if (-not (Test-Path -LiteralPath $ManifestsPath)) { throw "Launcher manifests folder not found: $ManifestsPath" }
    $dest = Resolve-BackupFolder
    New-Item -ItemType Directory -Force -Path $dest | Out-Null

    $items = Get-ChildItem -LiteralPath $ManifestsPath -Filter '*.item' -File -ErrorAction SilentlyContinue
    if (-not $items) { Write-Warn 'No .item manifests found. Nothing to back up.'; return }

    foreach ($item in $items) {
        Copy-Item -LiteralPath $item.FullName -Destination $dest -Force
        Write-Info "Backed up: $($item.Name)"
    }
    Write-Ok "Backup complete ($($items.Count) file(s)) -> $dest"
    Write-Info 'Keep this folder together with your games drive before reinstalling Windows.'
}

function Invoke-Restore {
    Assert-LauncherClosed
    if (-not $GamesFolder)                          { throw 'Specify -GamesFolder.' }
    if (-not (Test-Path -LiteralPath $GamesFolder)) { throw "Games folder not found: $GamesFolder" }

    $backup = Resolve-BackupFolder
    if (-not (Test-Path -LiteralPath $backup)) { throw "Backup folder not found: $backup  (run 'backup' first)" }
    if (-not (Test-Path -LiteralPath $ManifestsPath)) {
        Write-Warn "Launcher manifests folder missing, creating: $ManifestsPath"
        New-Item -ItemType Directory -Force -Path $ManifestsPath | Out-Null
    }

    $map = Get-GameManifestMap $GamesFolder
    if ($map.Count -eq 0) { throw "No installed games found under $GamesFolder (looked for <game>\$EGSTORE_NAME\*.manifest)." }

    $items = Get-ChildItem -LiteralPath $backup -Filter '*.item' -File -ErrorAction SilentlyContinue
    if (-not $items) { throw "No .item manifests in backup folder: $backup" }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $relinked = 0

    foreach ($item in $items) {
        $base = [System.IO.Path]::GetFileNameWithoutExtension($item.Name)
        if (-not $map.ContainsKey($base)) {
            Write-Warn "Skip $($item.Name): no game folder with $EGSTORE_NAME\$base.manifest"
            continue
        }
        $gameFolder = $map[$base]

        $json = Get-Content -LiteralPath $item.FullName -Raw | ConvertFrom-Json
        if ($null -ne $json.FormatVersion -and ($SUPPORTED_FORMAT_VERSIONS -notcontains [int]$json.FormatVersion)) {
            Write-Warn "Skip $($item.Name): unsupported FormatVersion $($json.FormatVersion)"
            continue
        }

        $manifestLocation = Join-Path $gameFolder $EGSTORE_NAME
        $stagingLocation  = Join-Path $manifestLocation $STAGING_NAME
        $json.InstallLocation  = $gameFolder
        $json.ManifestLocation = $manifestLocation
        $json.StagingLocation  = $stagingLocation

        $outJson = $json | ConvertTo-Json -Depth 100
        $target  = Join-Path $ManifestsPath $item.Name
        [System.IO.File]::WriteAllText($target, $outJson, $utf8NoBom)

        $label = if ($json.DisplayName) { $json.DisplayName } else { $base }
        Write-Ok "Relinked: $label  ->  $gameFolder"
        $relinked++
    }

    Write-Host ''
    Write-Ok "Done. Relinked $relinked game(s) of $($items.Count) backup manifest(s)."
    Write-Info 'Start the Epic Games Launcher. Each game should verify quickly and become playable.'
}

Write-Host '==== Epic Games Relink (PowerShell, no Python) ====' -ForegroundColor Magenta
Write-Info "Manifests path: $ManifestsPath"

switch ($Mode) {
    'backup'  { Invoke-Backup }
    'restore' { Invoke-Restore }
}
```

手順は次のとおり。

1. メモ帳を開き、上のスクリプトを全部コピーして貼り付ける。
2. 「ファイル」から「名前を付けて保存」を選ぶ。ファイルの種類を「すべてのファイル」、`Epic-Relink.ps1` という名前で保存する。場所はゲームのあるドライブなど、分かりやすいところでよい。
3. 保存したフォルダを開き、中の何もない場所で右クリックして「ターミナルで開く」を選ぶ。そのフォルダで PowerShell が開く。
4. 開いた PowerShell に次を貼り付ける。`D:\EpicLibrary` は自分のゲーム保存先に置き換えてから Enter を押す。

```powershell
.\Epic-Relink.ps1 backup -GamesFolder D:\EpicLibrary
```

ゲームドライブの中に `_MANIFEST_BACKUPS` フォルダができる。
ゲーム本体と一緒に、このドライブを保管しておく。

クリーンインストールしたあと、または別の PC では、手順3と同じように PowerShell を開いて次を実行する。
保存先は退避したときと同じものを指定する。

```powershell
.\Epic-Relink.ps1 restore -GamesFolder D:\EpicLibrary
```

あとは Epic Games Launcher を起動すれば、各ゲームが検証されてそのまま遊べる。

もし「スクリプトの実行が無効になっています」と表示されたら、先に次を実行してから、もう一度コマンドを打つ。
この設定はウィンドウを閉じるまでの一時的なものだ。

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
```

`restore` がやっているのは、`.item` の中の三つの場所（`InstallLocation` と `ManifestLocation` と `StagingLocation`）を今のフォルダに書き換えて `Manifests` へ戻すことだけだ。
方法1がインストールのたびにサーバーから取り直す `.item` を、方法2は事前に退避しておくだけの違いだ。
