---
title: Epic Games のゲームを再ダウンロードせず引き継ぐ
pubDate: 2026-06-23
description: クリーンインストールや別ドライブ移設で Epic がゲームを見失ったとき、再ダウンロードせず認識させる二つの方法。
---

Steam はライブラリフォルダを別ドライブに置いておけば、クリーンインストール後にフォルダを指定するだけで全ゲームが即座に戻る。
Epic Games Launcher にはこの引き継ぎが無い。
ゲーム本体が別ドライブに残っていても、ランチャーを入れ直すと存在を認識せず、再ダウンロードを促してくる。
この差を埋める方法を二つ紹介する。

## なぜ Steam は楽で Epic は引き継げないのか

両者の違いは、インストール情報をどこに置くかにある。
Steam は各ライブラリフォルダの中の `appmanifest_*.acf` に状態を持つ。
だからフォルダを指定し直せば、その場で読み直して全ゲームを復元できる。

Epic は `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests` の中の `.item`（JSON）に持つ。
この置き場所はランチャーのインストールに紐付いていて、ゲーム本体とは別管理になっている。
クリーンインストールで `.item` が消えると、本体が残っていてもランチャーは何も知らない状態になる。

ただし、各ゲームフォルダの中には `.egstore` という隠しフォルダがあり、ここにバージョン情報を持つ `.manifest` がある。
`.egstore` はゲーム本体と一緒なので、データドライブが残っていれば生き残る。
つまり消えるのは `ProgramData` 側の `.item` だけで、ゲームの実体と `.egstore` は手元にある。
復元とは、この失われた `.item` をどう取り戻すかという話になる。

## 方法1 ランチャーに .item を作らせる

`.item` を事前に保存していなくても復元できる。
`.item` はアカウントとストアのカタログからランチャーが再生成できるからだ。
インストールを開始した瞬間、ランチャーはサーバーに問い合わせて `.item` を作る。
これを利用して、ダウンロードの中身だけ手元のファイルに差し替える。

1. ランチャーで対象ゲームを、既存ファイルと同じ場所にインストール開始する。ランチャーが新しい `.item` と `.egstore` を作る。
2. ダウンロードが始まったらすぐ一時停止する。
3. 残っているゲーム本体ファイルを、そのフォルダへ上書きコピーする。
4. 再開する。検証が走り、ファイルが揃っていればダウンロードはスキップされる。

この方法の利点は、追加ツールも事前準備もいらないことだ。
欠点は、ゲームを一本ずつ手作業で処理することと、手元のファイルが最新版と一致していないと差分のダウンロードが発生することにある。

## 方法2 PowerShell で .item を書き換えて一括復元

`.item` を事前に退避していれば、もっと楽にできる。
`.item` の中で場所に依存するのは次の三つだけだ。

- `InstallLocation`：ゲーム本体フォルダ
- `ManifestLocation`：`<ゲームフォルダ>\.egstore`
- `StagingLocation`：`<ゲームフォルダ>\.egstore\bps`

この三つを今のパスに書き換えてランチャーの `Manifests` フォルダへ戻せば、ランチャーは既存インストールを認識する。

同じことをする Python 製ツール（[Epic-Games-Library-Relinker](https://github.com/Supernova1114/Epic-Games-Library-Relinker)）があるが、Python のインストールが要る。
Windows 標準の PowerShell だけで動くように書き直したのが、この記事末尾のスクリプトだ。
二つのコマンドで完結する。

```powershell
# クリーンインストールの前に、今の .item を退避する
.\Epic-Relink.ps1 backup -GamesFolder D:\EpicLibrary

# 入れ直した後、ゲームフォルダに合わせて復元する
.\Epic-Relink.ps1 restore -GamesFolder D:\EpicLibrary
```

`D:\EpicLibrary` はゲームが並ぶ親フォルダの例なので、自分の保存先に読み替える。

`restore` の中身は単純だ。
各ゲームフォルダの `.egstore\*.manifest` と、退避した `.item` を、拡張子を除いたファイル名で突き合わせる。
一致したら先述の三つのパスを今の場所に書き換え、`Manifests` フォルダへ配置する。
ゲームが何本あっても一度で終わる。

`.item` を退避できるのは、退避した時点でランチャーがオンラインで作った正規のファイルだからだ。
方法1がインストール開始のたびにサーバーから取り直しているものを、方法2は事前に手元へ保存しておく、という違いになる。

## どちらを使うか

| 状況 | 方法 |
| --- | --- |
| クリーンインストール前に `.item` を退避できた | 方法2（一括、ツールで自動） |
| 退避し忘れた、または既に消えた | 方法1（一本ずつだが救済できる） |

## 注意点

- 手元のゲームが最新版でないと、結局ダウンロードが走る。退避や移行は更新を当てた直後に行う。
- `.egstore` フォルダを消さない。これが無いと突き合わせができない。
- クラウドセーブは別管理なので、この方法では引き継げない。
- 対応する `.item` の形式は `FormatVersion 0`。将来フォーマットが変わったら確認が要る。
- 初めて使うときは、一本だけで試してからまとめて流すと安心できる。

:::collapse[Epic-Relink.ps1 全文]{desc="方法2 で使う PowerShell スクリプト"}
```powershell
<#
.SYNOPSIS
    Epic Games Launcher に、別ドライブに残った既存ゲームを再ダウンロードせず認識させる。
    Python 不要。Windows 標準の PowerShell だけで動く。

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

# .egstore\*.manifest のベース名 -> ゲームフォルダのフルパス の対応表を作る
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
:::
