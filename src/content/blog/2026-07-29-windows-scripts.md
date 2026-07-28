---
title: 'Windows まわりで使っている自作スクリプト'
pubDate: '2026-07-29'
---

前回の続きで、環境まわりの小物です。

## dev-associations.ps1

`.ps1` や `.py` をダブルクリックで実行できるようにします。
Windows の既定だと `.ps1` はメモ帳で開くので、毎回右クリックするのが面倒でした。

```powershell
if ($args) { throw "This script takes no arguments." }

$ErrorActionPreference = 'Stop'

function Resolve-Exe([string]$Name) {
    $alias = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\$Name.exe"
    if (Test-Path $alias) { $alias } else { (Get-Command $Name -ErrorAction SilentlyContinue).Source }
}

function Remove-UserChoice([string]$Ext) {
    $sub = "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\$Ext\UserChoice"
    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($sub, [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree, [System.Security.AccessControl.RegistryRights]::ChangePermissions)
    if ($key) {
        $acl = $key.GetAccessControl()
        foreach ($rule in @($acl.GetAccessRules($true, $false, [System.Security.Principal.NTAccount]))) {
            if ($rule.AccessControlType -eq 'Deny') { $acl.RemoveAccessRule($rule) | Out-Null }
        }
        $key.SetAccessControl($acl)
        $key.Close()
    }
    Remove-Item "HKCU:\$sub" -Force -ErrorAction SilentlyContinue
}

$pwsh = Resolve-Exe pwsh
$py   = Resolve-Exe py
$pyw  = Resolve-Exe pyw
$node = Resolve-Exe node
$bash = 'C:\Program Files\Git\bin\bash.exe'
if (-not (Test-Path $bash)) { $bash = (Get-Command bash -ErrorAction SilentlyContinue).Source }

$assoc = [ordered]@{}
if ($pwsh)           { $assoc['.ps1'] = "`"$pwsh`" -ExecutionPolicy RemoteSigned -File `"%L`"" }
if ($py)             { $assoc['.py']  = "`"$py`" `"%L`" %*" }
if ($pyw)            { $assoc['.pyw'] = "`"$pyw`" `"%L`" %*" }
if ($node)           { $assoc['.js']  = "`"$node`" `"%L`" %*" }
if ($bash)            { $assoc['.sh']  = "`"$bash`" `"%L`" %*" }

foreach ($ext in $assoc.Keys) {
    $extKey = "HKCU:\Software\Classes\$ext"
    $cmdKey = "HKCU:\Software\Classes\dev$ext\shell\open\command"
    $ucKey  = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\$ext\UserChoice"

    $prevChoice = if (Test-Path $ucKey) { (Get-ItemProperty $ucKey).ProgId } else { $null }
    if (-not $prevChoice) { $prevChoice = '<none>' }

    foreach ($key in $extKey, $cmdKey) {
        if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
    }
    Set-ItemProperty -Path $extKey -Name '(default)' -Value "dev$ext"
    Set-ItemProperty -Path $cmdKey -Name '(default)' -Value $assoc[$ext]

    try {
        Remove-UserChoice $ext
        if (Test-Path $ucKey) { Write-Warning "$ext : UserChoice removal failed; Explorer keeps using $prevChoice." }
    } catch {
        Write-Warning "$ext : UserChoice removal failed: $($_.Exception.Message)"
    }
    Write-Host ("{0,-5} -> {1}" -f $ext, $assoc[$ext])
}

Add-Type -Namespace Win32 -Name Shell -MemberDefinition '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);'
[Win32.Shell]::SHChangeNotify(0x08000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)
Read-Host 'Press Enter to close' | Out-Null
```

対象は `.ps1` `.py` `.pyw` `.js` `.sh` の 5 つで、見つかった実行ファイルの分だけ設定します。
書き込み先は `HKCU` だけなので、管理者権限は要りません。

厄介なのは `UserChoice` です。
一度でも「別のアプリで開く」を選ぶとここに記録が残り、`Software\Classes` 側の設定より優先されます。
おまけに書き換え防止の Deny が付いているので、ACL から Deny を外してからキーごと消しています。
最後の `SHChangeNotify` は、変更をエクスプローラーに知らせるためのものです。

## dev-associations-undo.ps1

上を元に戻します。

```powershell
if ($args) { throw "This script takes no arguments." }

$ErrorActionPreference = 'Stop'

$progIds = Get-ChildItem 'HKCU:\Software\Classes' | Where-Object { $_.PSChildName -like 'dev.*' }
if (-not $progIds) {
    Write-Host 'Nothing to undo.'
}

foreach ($p in $progIds) {
    $ext = $p.PSChildName.Substring(3)
    $extKey = "HKCU:\Software\Classes\$ext"
    if ((Test-Path $extKey) -and (Get-ItemProperty $extKey).'(default)' -eq $p.PSChildName) {
        Remove-Item -Path $extKey -Recurse -Force
    }
    Remove-Item -Path "HKCU:\Software\Classes\$($p.PSChildName)" -Recurse -Force
    Write-Host "$ext -> reverted to system default"
}

Add-Type -Namespace Win32 -Name Shell -MemberDefinition '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);'
[Win32.Shell]::SHChangeNotify(0x08000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)
```

`dev.` で始まる ProgId を探して消すだけです。
自分で作ったものしか消さないので、他の関連付けは巻き込みません。

## list-commands.ps1

使えるコマンドを一覧します。

```powershell
param([string]$Name = "*")

Get-Command -Name $Name | Sort-Object CommandType, Name |
    Select-Object CommandType, Name, Version, Source |
    Out-GridView -Wait -Title "Available Commands"
```

`Out-GridView` に流すので、絞り込みや並べ替えがその場でできます。
名前を渡せば `list-commands git*` のように前もって絞れます。

## winget-update-all.ps1

全部更新するだけの 1 行です。

```powershell
winget upgrade --all --include-unknown --accept-source-agreements --accept-package-agreements
```

`--include-unknown` はバージョンを取得できないパッケージも対象に入れる指定です。
これが無いと、入れた覚えのあるものがいくつか更新されずに残ります。

## git-menu.ps1

引数なしで実行するとメニューが出ます。

```powershell
param(
    [ValidateSet('','status','pull','commit','log')][string]$Action = '',
    [string]$Message
)

$ErrorActionPreference = 'Stop'
$direct = -not $Action

try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) { throw "Not a git repository: $PWD" }

    if (-not $Action) {
        $branch = git branch --show-current
        $menu = @(
            [pscustomobject]@{ Action = 'status'; Description = 'Show working tree status' }
            [pscustomobject]@{ Action = 'pull';   Description = 'Pull latest changes' }
            [pscustomobject]@{ Action = 'commit'; Description = 'Stage all, commit, push' }
            [pscustomobject]@{ Action = 'log';    Description = 'Show recent commits' }
        )
        $picked = $menu | Out-GridView -OutputMode Single -Title "git: $(Split-Path $PWD -Leaf) [$branch]"
        if (-not $picked) { return }
        $Action = $picked.Action
    }

    switch ($Action) {
        'status' { git status }
        'pull'   { git pull }
        'log'    { git log --oneline --graph --decorate -20 }
        'commit' {
            git add -A
            if (git diff --cached --name-only) {
                if (-not $Message) { $Message = Read-Host 'Commit message (empty = timestamp)' }
                if (-not $Message) { $Message = Get-Date -Format 'yyyy-MM-dd HH:mm' }
                git commit -m $Message
            }
            else {
                Write-Host 'Nothing to commit.'
            }
            git rev-parse --abbrev-ref '@{u}' *> $null
            if ($LASTEXITCODE -eq 0) { git push } else { git push -u origin HEAD }
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

if ($direct) { Read-Host 'Press Enter to close' | Out-Null }
```

commit を選ぶと `add -A` から push まで一気に走ります。
メッセージを空で通すと日時が入ります。
上流ブランチが無ければ `-u origin HEAD` を付けるので、初回でも通ります。

`git-menu status` のように直接指定もできて、その場合は入力待ちで止まりません。

## backup-to-r2-C.ps1

rclone で Cloudflare R2 に上げています。

```powershell
$Source = "C:\Cloudflare R2"
$Remote = "r2:public"

rclone sync $Source $Remote --progress --transfers 8 --checkers 8
```

D ドライブ側は同じ内容で `$Source` だけ違うものを置いています。

`sync` はリモートを手元と同じ状態にする動作なので、手元で消したファイルはリモートからも消えます。
残したいだけなら `copy` のほうが安全です。
