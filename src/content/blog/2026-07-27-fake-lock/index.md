---
title: '職場でゲームの放置周回をするため偽のロック画面を作りました'
pubDate: '2026-07-27'
---

グランブルーファンタジー リリンクにハマっています。

https://store.steampowered.com/app/881020/

今は MSP（キャラの強化に使うマスタリーポイント）を稼ぐために、ルシファーをオートで延々と回しています。
必要な量が量なので、夜に何時間か放置したところで追いつきません。
それなら職場の PC でも起動しておいて、勤務中はずっと回しておけばいいと考えました。

問題は席を離れるときです。
Windows 標準のロック（Win+L）をかけると、オート周回がそこで止まります。
一方で、ほかのウィンドウにフォーカスが移っただけなら周回は続きます。

そこで、偽のロック画面ウィンドウを PowerShell で書きました。

## 使い方

スクリプトを実行すると、ウィンドウを出さないまま常駐します。
その状態で Ctrl+F12 を押すと、画面全体が黒くなり、ターミナル風のログとパスワード入力欄が出ます。

![偽のロック画面](./screenshot.png "この裏でルシファーが回っています")

パスワードを入れて Enter を押すと元の画面に戻ります。
間違えたときは `access denied: authentication failure` と表示され、入力欄が空になります。

偽装中は Windows キー、Alt+Tab、Alt+F4、Ctrl+Esc、Alt+Esc が効きません。
通りすがりにキーボードを触られても、簡単には剥がれないようにしてあります。

## スクリプト全文

```powershell
if ([Threading.Thread]::CurrentThread.GetApartmentState() -ne 'STA') {
    $ps = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    Start-Process $ps '-STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File', "`"$PSCommandPath`""
    exit
}

$Password = "1223"

Add-Type -AssemblyName System.Windows.Forms, System.Drawing

Add-Type @'
using System;
using System.Runtime.InteropServices;

public class KeyBlocker
{
    const int WH_KEYBOARD_LL = 13;
    static IntPtr hookId = IntPtr.Zero;
    static Func proc = HookCallback;

    public delegate IntPtr Func(int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SetWindowsHookEx(int idHook, Func lpfn, IntPtr hMod, uint tid);
    [DllImport("user32.dll")]
    static extern bool UnhookWindowsHookEx(IntPtr hhk);
    [DllImport("user32.dll")]
    static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")]
    static extern short GetKeyState(int vk);
    [DllImport("user32.dll")]
    static extern short GetAsyncKeyState(int vk);
    [DllImport("kernel32.dll")]
    static extern IntPtr GetModuleHandle(string name);

    public static bool Down(int vk) { return (GetAsyncKeyState(vk) & 0x8000) != 0; }

    public static void Start()
    {
        hookId = SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(null), 0);
        if (hookId == IntPtr.Zero) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
    }

    public static void Stop()
    {
        if (hookId != IntPtr.Zero) { UnhookWindowsHookEx(hookId); hookId = IntPtr.Zero; }
    }

    static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            int vk = Marshal.ReadInt32(lParam);
            bool alt = (GetKeyState(0x12) & 0x8000) != 0;
            bool ctrl = (GetKeyState(0x11) & 0x8000) != 0;
            if (vk == 0x5B || vk == 0x5C) return (IntPtr)1;
            if (vk == 0x09 && alt) return (IntPtr)1;
            if (vk == 0x1B && (alt || ctrl)) return (IntPtr)1;
            if (vk == 0x73 && alt) return (IntPtr)1;
        }
        return CallNextHookEx(hookId, nCode, wParam, lParam);
    }
}
'@

$green = [Drawing.Color]::FromArgb(0, 255, 65)
$mono = New-Object Drawing.Font('Consolas', 14)
$margin = 24

function Show-Lock {
    $form = New-Object Windows.Forms.Form
    $form.FormBorderStyle = 'None'
    $form.StartPosition = 'Manual'
    $form.TopMost = $true
    $form.BackColor = 'Black'
    $form.ShowInTaskbar = $false
    $form.Bounds = [Windows.Forms.SystemInformation]::VirtualScreen
    $form.KeyPreview = $true

    function New-Label($text) {
        $l = New-Object Windows.Forms.Label
        $l.Text = $text
        $l.ForeColor = $green
        $l.BackColor = 'Black'
        $l.Font = $mono
        $l.AutoSize = $true
        $form.Controls.Add($l)
        $l
    }

    $header = New-Label @"
[  OK  ] Reached target Graphical Interface.
[  OK  ] Started Session Lock Manager.
[ WARN ] Interactive session suspended by user.

SESSION LOCKED - AUTHENTICATION REQUIRED
"@
    $prompt = New-Label 'auth@localhost:~$ login --password '
    $status = New-Label ''

    $box = New-Object Windows.Forms.TextBox
    $box.UseSystemPasswordChar = $true
    $box.BorderStyle = 'None'
    $box.BackColor = 'Black'
    $box.ForeColor = $green
    $box.Font = $mono
    $box.Width = 300
    $form.Controls.Add($box)

    $layout = {
        $header.Location = New-Object Drawing.Point($margin, $margin)
        $y = $margin + $header.Height + $margin
        $prompt.Location = New-Object Drawing.Point($margin, $y)
        $box.Location = New-Object Drawing.Point(($margin + $prompt.Width), ($y + 2))
        $status.Location = New-Object Drawing.Point($margin, ($y + $margin))
    }

    $timer = New-Object Windows.Forms.Timer
    $timer.Interval = 250
    $timer.Add_Tick({
        $form.Bounds = [Windows.Forms.SystemInformation]::VirtualScreen
        $form.TopMost = $true
        $form.BringToFront()
    })

    $form.Add_Shown({
        & $layout
        $box.Focus()
        [KeyBlocker]::Start()
        $timer.Start()
    })

    $form.Add_FormClosing({
        $timer.Stop()
        [KeyBlocker]::Stop()
    })

    $box.Add_KeyDown({
        if ($_.KeyCode -eq 'Enter') {
            if ($box.Text -eq $Password) {
                $form.Close()
            } else {
                $box.Clear()
                $status.Text = 'access denied: authentication failure'
                & $layout
            }
        }
    })

    [void]$form.ShowDialog()
}

$script:hotkey = 0x11, 0x7B
$script:locked = $false
$poll = New-Object Windows.Forms.Timer
$poll.Interval = 50
$poll.Add_Tick({
    if ($script:locked) { return }
    if (@($script:hotkey | Where-Object { -not [KeyBlocker]::Down($_) }).Count -eq 0) {
        $script:locked = $true
        Show-Lock
        $script:locked = $false
    }
})
$poll.Start()

[Windows.Forms.Application]::Run((New-Object Windows.Forms.ApplicationContext))
```

`fake-lock.ps1` として保存し、右クリックの「PowerShell で実行」から起動します。
最初に実行ポリシーで弾かれる場合は、`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` を通しておいてください。
`$Password` はそのままにせず書き換えます。

## 常駐を止める

常駐したスクリプトはウィンドウを持たないので、タスクバーからは終了できません。
止めるときは、コマンドラインに `fake-lock.ps1` を含む `powershell.exe` を探して落とします。

```powershell
$procs = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
    Where-Object { $_.CommandLine -like '*fake-lock.ps1*' }

if (-not $procs) {
    Write-Host 'fake-lock daemon is not running.'
    return
}

foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force
    Write-Host "Stopped fake-lock daemon (PID $($p.ProcessId))."
}
```

コマンドラインで絞っているので、無関係な PowerShell は巻き込みません。
ファイル名は `fake-lock-kill.ps1` にして、本体と同じ場所に置いています。

このファイル名には理由があります。
仮に `kill-fake-lock.ps1` と名付けると、その文字列自体が `*fake-lock.ps1*` に一致してしまい、停止スクリプトが自分自身を落として終わります。
`fake-lock-kill.ps1` なら一致しません。

## 中で何をしているか

### STA で起動し直す

冒頭の 5 行は、自分自身を `-STA` 付きで起動し直しています。
Windows Forms は STA（シングルスレッドアパートメント）でないと動かない一方、PowerShell 7 の既定は MTA です。
そのまま走らせるとフォームの生成で失敗するので、現在のアパートメントを確認して、STA でなければ Windows PowerShell 5.1 の `powershell.exe` を `-STA` で呼び直し、元のプロセスは終了します。

### キーボードショートカットを潰す

`KeyBlocker` クラスは、`SetWindowsHookEx` に `WH_KEYBOARD_LL` を渡して、システム全体のキー入力を横取りするフックを仕掛けます。
コールバックで仮想キーコードを読み、潰したい組み合わせなら `1` を返します。
`1` を返すとそこでチェーンが切れるので、そのキーはどのアプリにも届きません。

止めているのは次の 4 つです。

- 左右の Windows キー（`0x5B` と `0x5C`）
- Alt+Tab（`0x09` + Alt）
- Ctrl+Esc と Alt+Esc（`0x1B` + Ctrl または Alt）
- Alt+F4（`0x73` + Alt）

同じクラスに `Down` メソッドも生やしてあります。
`GetAsyncKeyState` でキーの押下状態を直接読むもので、後述のホットキー検出に使います。

### 画面全体を覆い続ける

フォームは枠なし、黒背景、タスクバーに出さない設定で、大きさを `SystemInformation.VirtualScreen` に合わせています。
これは全モニターをまとめた仮想デスクトップの矩形なので、マルチモニターでも隙間なく埋まります。

さらに 250 ミリ秒ごとのタイマーで、この矩形の再設定と `TopMost`、`BringToFront` を繰り返します。
通知やほかのアプリが前に出てきても、すぐ押し戻されます。

表示は systemd の起動ログ風にしました。
Windows のロック画面を模写すると細部の粗が目立つので、最初から別物の見た目にしています。

### ホットキーを拾う

常駐している間は、50 ミリ秒ごとのタイマーが Ctrl（`0x11`）と F12（`0x7B`）の同時押しを見張っています。
組み合わせは `$script:hotkey` に仮想キーコードを並べて指定しているので、変えたいときはここを書き換えます。
`$script:locked` フラグは、偽装中にホットキーが再度反応して二重に開くのを防ぐためのものです。

最後の `Application.Run` には空の `ApplicationContext` を渡しています。
これでメインウィンドウを持たないままメッセージループが回り、ホットキー待ちの常駐が成立します。

## このロック画面で守れない範囲

:::warn
見た目だけのロックなので、Windows のロックの代わりにはなりません。
会社から支給された PC の場合、常駐スクリプトの導入自体が社内規定に触れることもあります。
:::

Ctrl+Alt+Del は低レベルフックでは止められません。
これは OS が特権的に処理する組み合わせで、押されるとセキュリティ画面に切り替わり、そこからタスクマネージャーでスクリプトを終了できてしまいます。
パスワードもスクリプトに平文で置いてあるだけなので、ファイルを開かれれば読めます。
