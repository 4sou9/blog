# PreToolUse hook: block Set-Content/Out-File/Add-Content that target a .md file.
# Rationale: Windows PowerShell's Set-Content (even -Encoding UTF8) corrupts Japanese
# text in .md files. Stop it deterministically instead of relying on the model, and
# steer toward the Edit / Write tools.
# Exit code 2 = block (stderr is fed back to Claude).
# NOTE: keep this script ASCII-only -- powershell.exe (5.1) misreads UTF-8-no-BOM files.

$raw = [Console]::In.ReadToEnd()
if (-not $raw) { exit 0 }

try { $data = $raw | ConvertFrom-Json } catch { exit 0 }

$cmd = $data.tool_input.command
if (-not $cmd) { exit 0 }

# Only block when Set-Content / Out-File / Add-Content writes to a .md file.
if ($cmd -match '(?i)(Set-Content|Out-File|Add-Content)' -and $cmd -match '(?i)\.md([''"\s>|;)]|$)') {
    [Console]::Error.WriteLine("Blocked: PowerShell Set-Content/Out-File corrupts Japanese .md files. Use the Edit or Write tool instead.")
    exit 2
}

exit 0
