---
title: '動画まわりで使っている自作スクリプト'
pubDate: '2026-07-28'
---

普段使っている小物スクリプトのうち、動画まわりをまとめました。
yt-dlp と ffmpeg が入っていれば動きます。

## yt-download-video.ps1

最高画質で落とすだけです。

```powershell
param([Parameter(Mandatory, ValueFromRemainingArguments)][string[]]$Urls)

yt-dlp -f "bestvideo+bestaudio/best" -o "%(upload_date>%Y-%m-%d)s_%(title)s.%(ext)s" @Urls
```

ファイル名が `2026-07-27_タイトル.mp4` になるのが主目的です。
URL はいくつでも並べられます。

## yt-download-audio.ps1

音声だけ抜きます。

```powershell
param([Parameter(Mandatory, ValueFromRemainingArguments)][string[]]$Urls)

yt-dlp -f bestaudio -x -o "%(upload_date>%Y-%m-%d)s_%(title)s.%(ext)s" @Urls
```

## yt-download-clip.ps1

長い動画から一部分だけ切り出します。

```powershell
param(
    [Parameter(Mandatory, Position = 0)][string]$Url,
    [Parameter(Mandatory, Position = 1)][string]$Start,
    [Parameter(Mandatory, Position = 2)][string]$End
)

yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4 --download-sections "*${Start}-${End}" -o "%(upload_date>%Y-%m-%d)s_%(title)s.%(ext)s" $Url
```

```powershell
.\yt-download-clip.ps1 https://youtu.be/xxxxxxxxxxx 1:30 2:00
```

`--download-sections` はその区間だけ取りに行くので、全部落としてから切るより速いです。

## yt-download-subs.ps1

字幕だけ落として srt にします。
自動生成字幕も拾います。

```powershell
[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(Mandatory, ValueFromRemainingArguments)][string[]]$Urls,
    [string]$Langs = "ja,en"
)

yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs $Langs --convert-subs srt --ignore-errors --sleep-subtitles 1 -o "%(upload_date>%Y-%m-%d)s_%(title)s.%(ext)s" @Urls
```

既定は `ja,en` で、`-Langs` で変えられます。

## srt-to-markdown.py

落とした srt は行がブツ切りで読めないので、Markdown に均します。
連番とタイムスタンプと重複行を落として、5 文ずつ段落にまとめます。

```python
import re
import sys
from pathlib import Path

SENTENCES_PER_PARAGRAPH = 5
ABBREVIATIONS = {"mr", "mrs", "ms", "dr", "st", "vs", "etc", "e.g", "i.e", "jr", "sr"}
INDEX_RE = re.compile(r"^\d+$")
TIMESTAMP_RE = re.compile(r"^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}")
TAG_RE = re.compile(r"<[^>]+>")
SENTENCE_SPLIT_RE = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9"\'])|(?<=[。！？])\s*')

sys.stdout.reconfigure(encoding="utf-8")


def extract_text(lines):
    kept = []
    for line in lines:
        stripped = TAG_RE.sub("", line.strip()).strip()
        if not stripped or INDEX_RE.match(stripped) or TIMESTAMP_RE.match(stripped):
            continue
        if not kept or kept[-1] != stripped:
            kept.append(stripped)
    text = re.sub(r"\s+", " ", " ".join(kept)).strip()
    return re.sub(r"\s+(?=[。、！？])", "", text)


def split_sentences(text):
    sentences = []
    buffer = ""
    for part in SENTENCE_SPLIT_RE.split(text):
        if not part:
            continue
        buffer = f"{buffer} {part}".strip() if buffer else part
        last_word = re.sub(r"[^a-zA-Z.]", "", buffer.split()[-1]) if buffer.split() else ""
        if last_word.rstrip(".").lower() in ABBREVIATIONS and buffer.endswith("."):
            continue
        sentences.append(buffer)
        buffer = ""
    if buffer:
        sentences.append(buffer)
    return sentences


def to_markdown(title, text):
    sentences = split_sentences(text)
    deduped = [s for i, s in enumerate(sentences) if i == 0 or s != sentences[i - 1]]
    chunks = range(0, len(deduped), SENTENCES_PER_PARAGRAPH)
    body = "\n\n".join(" ".join(deduped[i:i + SENTENCES_PER_PARAGRAPH]) for i in chunks)
    return f"# {title}\n\n{body}\n"


def process_folder(folder):
    srt_files = sorted(Path(folder).glob("*.srt"))
    if not srt_files:
        print("No SRT files found.")
        return
    for path in srt_files:
        lines = path.read_text(encoding="utf-8-sig").splitlines()
        out_path = path.with_suffix(".md")
        out_path.write_text(to_markdown(path.stem, extract_text(lines)), encoding="utf-8")
        print(f"{path.name} -> {out_path.name}")


if __name__ == "__main__":
    process_folder(sys.argv[1] if len(sys.argv) > 1 else ".")
```

フォルダを渡すと中の srt を全部変換します。
`Mr.` や `e.g.` で文が切れないように、略語のリストだけ持たせています。

## compress-video-8mb.ps1

ふたばちゃんねるに貼れるサイズまで圧縮します。

```powershell
param(
    [Parameter(Position = 0)][string[]]$InputPath,
    [Parameter(Position = 1)][string]$Output,
    [long]$MaxBytes = 8192000L,
    [int]$AudioBitrateKbps = 64,
    [int]$MaxFps = 30,
    [int]$MaxLongSide = 640,
    [ValidateSet('','film','animation','grain','stillimage')][string]$Tune = '',
    [ValidateSet('ultrafast','superfast','veryfast','faster','fast','medium','slow','slower','veryslow')][string]$Preset = 'slow'
)

$ErrorActionPreference = 'Stop'

$videoExtensions = '.mp4','.mkv','.webm','.mov','.avi','.ts','.m2ts','.flv','.wmv','.mpg','.mpeg','.m4v'
$scaleLadder = 1920,1600,1440,1280,1080,960,854,720,640,568,480

if (-not $InputPath) {
    $candidates = Get-ChildItem -File | Where-Object {
        $videoExtensions -contains $_.Extension.ToLower() -and $_.BaseName -notmatch '_\d+m$'
    }
    if (-not $candidates) { throw "No video files found in current directory." }
    $picked = $candidates |
        Select-Object Name, @{n = 'SizeMB'; e = { [math]::Round($_.Length / 1MB, 2) }}, FullName |
        Out-GridView -Title "Select videos to compress to $($MaxBytes / 1KB) KB" -PassThru
    if (-not $picked) { return }
    $InputPath = @($picked.FullName)
}

if ($Output -and $InputPath.Count -gt 1) { throw "-Output requires a single input file." }

function Get-VideoInfo {
    param([string]$Path)
    $raw = & ffprobe -v error -select_streams v:0 `
        -show_entries stream=width,height,avg_frame_rate -show_entries format=duration -of json $Path
    if ($LASTEXITCODE -ne 0) { throw "ffprobe failed: $Path" }
    $json = $raw | ConvertFrom-Json
    $stream = $json.streams[0]
    if (-not $stream) { throw "No video stream: $Path" }
    $num, $den = $stream.avg_frame_rate -split '/'
    $fps = if ([double]$den -gt 0) { [double]$num / [double]$den } else { 0 }
    if ($fps -le 0) { $fps = 30 }
    $duration = [double]::Parse($json.format.duration, [System.Globalization.CultureInfo]::InvariantCulture)
    if ($duration -le 0) { throw "Duration is zero or negative: $Path" }
    [pscustomobject]@{ Duration = $duration; Width = [int]$stream.width; Height = [int]$stream.height; Fps = $fps }
}

function Compress-One {
    param([string]$In, [string]$Out)

    $inItem = Get-Item -LiteralPath $In
    if (-not $Out) { $Out = Join-Path $inItem.DirectoryName ("{0}_{1}m.mp4" -f $inItem.BaseName, [math]::Round($MaxBytes / 1MB)) }

    $info     = Get-VideoInfo -Path $In
    $videoBps = [int][math]::Floor($MaxBytes * 0.95 * 8.0 / $info.Duration - $AudioBitrateKbps * 1000)
    if ($videoBps -lt 50000) {
        throw ("Target {0} bytes too tight for {1:N1}s clip (video={2} bps)." -f $MaxBytes, $info.Duration, $videoBps)
    }

    $fpsOut    = if ($MaxFps -gt 0) { [math]::Min($info.Fps, $MaxFps) } else { $info.Fps }
    $longSide  = [math]::Max($info.Width, $info.Height)
    $nativeBpp = $videoBps / ($info.Width * $info.Height * $fpsOut)

    $targetLong = $longSide
    if ($nativeBpp -lt 0.08) {
        $targetLong = 480
        foreach ($cand in $scaleLadder) {
            if ($cand -ge $longSide) { continue }
            $pixels = $info.Width * $info.Height * [math]::Pow($cand / $longSide, 2)
            if ($videoBps / ($pixels * $fpsOut) -ge 0.08) { $targetLong = $cand; break }
        }
    }
    if ($MaxLongSide -gt 0 -and $MaxLongSide -lt $targetLong) { $targetLong = $MaxLongSide }

    $vfArg = @()
    if ($targetLong -lt $longSide) {
        $vf = if ($info.Width -ge $info.Height) { "scale=${targetLong}:-2" } else { "scale=-2:${targetLong}" }
        $vfArg = @('-vf', $vf)
    }
    $fpsArg = if ($MaxFps -gt 0) { @('-fpsmax', "$MaxFps") } else { @() }
    $scaledBpp = $videoBps / ($info.Width * $info.Height * [math]::Pow($targetLong / $longSide, 2) * $fpsOut)
    $passLog = Join-Path $env:TEMP ("x264_2pass_" + [guid]::NewGuid().ToString('N'))

    Write-Host ("{0} -> {1}" -f $In, $Out)
    Write-Host ("  {0:N2}s  {1}x{2} @ {3:N2}fps  long side {4} -> {5}  bpp {6:N3} -> {7:N3}" -f `
        $info.Duration, $info.Width, $info.Height, $info.Fps, $longSide, $targetLong, $nativeBpp, $scaledBpp)
    Write-Host ("  limit {0:N0} bytes  audio {1} kbps" -f $MaxBytes, $AudioBitrateKbps)

    $attempt = 0
    $success = $false
    try {
        while ($attempt -le 4) {
            $attempt++
            Write-Host ("===== Attempt #{0} : video={1:N0} kbps =====" -f $attempt, ($videoBps / 1000.0))

            $commonV = @('-c:v','libx264','-preset',$Preset,'-pix_fmt','yuv420p','-b:v',"$videoBps") + $fpsArg
            if ($Tune) { $commonV += @('-tune', $Tune) }
            $audioArgs = if ($AudioBitrateKbps -gt 0) { @('-c:a','aac','-b:a',"${AudioBitrateKbps}k",'-ac','2') } else { @('-an') }

            $pass1Args = @('-y','-hide_banner','-loglevel','error','-stats','-i',$In) + $vfArg + $commonV +
                @('-pass','1','-passlogfile',$passLog,'-an','-f','null','NUL')
            & ffmpeg @pass1Args
            if ($LASTEXITCODE -ne 0) { throw "Pass 1 failed (exit=$LASTEXITCODE)" }

            $pass2Args = @('-y','-hide_banner','-loglevel','error','-stats','-i',$In) + $vfArg + $commonV +
                @('-pass','2','-passlogfile',$passLog) + $audioArgs + @('-movflags','+faststart',$Out)
            & ffmpeg @pass2Args
            if ($LASTEXITCODE -ne 0) { throw "Pass 2 failed (exit=$LASTEXITCODE)" }

            $size = (Get-Item -LiteralPath $Out).Length
            Write-Host ("  -> result: {0:N0} bytes ({1:N4} MiB)" -f $size, ($size / 1MB))
            if ($size -le $MaxBytes) { $success = $true; break }

            Write-Warning ("Over limit ({0:N0} > {1:N0}). Retrying at 90% bitrate..." -f $size, $MaxBytes)
            $videoBps = [int][math]::Floor($videoBps * 0.9)
            if ($videoBps -lt 50000) { throw "Bitrate reached lower bound." }
        }
    }
    finally {
        Get-ChildItem -Path ($passLog + '*') -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    }

    if (-not $success) {
        if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }
        throw "Could not fit under limit after 5 attempts."
    }

    $final = (Get-Item -LiteralPath $Out).Length
    Write-Host ("OK  {0}  ({1:N0} bytes, {2:P2} of limit)`n" -f $Out, $final, ($final / $MaxBytes))
}

foreach ($path in $InputPath) {
    try {
        Compress-One -In $path -Out $Output
    }
    catch {
        Write-Warning ("{0}: {1}" -f $path, $_.Exception.Message)
    }
}
```

引数なしで実行すると、カレントにある動画が一覧で出るので選べます。

やっていることは 3 つです。

- 尺と上限バイト数から映像ビットレートを逆算する
- 画素あたりのビット数が 0.08 を下回るなら、足りるところまで解像度を落とす
- 2 パスでエンコードし、それでも超えていたらビットレートを 9 割にして最大 5 回やり直す

`-MaxBytes` で上限を変えられます。
10MB 版はそれを渡すだけの 1 行です。

```powershell
& (Join-Path $PSScriptRoot 'compress-video-8mb.ps1') -MaxBytes 10000000 @args
```

## video-to-gif.ps1

GIF にします。
パレットを作ってから使う 2 段階なので、そこそこ綺麗に出ます。

```powershell
param(
    [Parameter(Position = 0)][string[]]$InputPath,
    [string]$Start,
    [string]$Duration,
    [string]$Output,
    [int]$Fps = 15,
    [int]$Width = 480
)

$ErrorActionPreference = 'Stop'

$videoExtensions = '.mp4','.mkv','.webm','.mov','.avi','.ts','.m2ts','.flv','.wmv','.mpg','.mpeg','.m4v'

if (-not $InputPath) {
    $candidates = Get-ChildItem -File | Where-Object { $videoExtensions -contains $_.Extension.ToLower() }
    if (-not $candidates) { throw "No video files found in current directory." }
    $picked = $candidates |
        Select-Object Name, @{n = 'SizeMB'; e = { [math]::Round($_.Length / 1MB, 2) }}, FullName |
        Out-GridView -Title "Select videos to convert to GIF" -PassThru
    if (-not $picked) { return }
    $InputPath = @($picked.FullName)
}

if ($Output -and $InputPath.Count -gt 1) { throw "-Output requires a single input file." }

if (-not $Start) { $Start = Read-Host 'Start time (e.g. 0:05)' }
if (-not $Duration) { $Duration = Read-Host 'Duration in seconds (e.g. 3)' }

function Convert-Gif {
    param([string]$In, [string]$Out)

    $inItem = Get-Item -LiteralPath $In
    if (-not $Out) { $Out = Join-Path $inItem.DirectoryName ($inItem.BaseName + '.gif') }

    $palette = Join-Path $env:TEMP ("gifpalette_" + [guid]::NewGuid().ToString('N') + '.png')
    $filters = "fps=$Fps,scale=${Width}:-1:flags=lanczos"

    try {
        ffmpeg -y -hide_banner -loglevel error -ss $Start -t $Duration -i $In -vf "$filters,palettegen" $palette
        if ($LASTEXITCODE -ne 0) { throw "Palette generation failed" }

        ffmpeg -y -hide_banner -loglevel error -ss $Start -t $Duration -i $In -i $palette `
            -lavfi "[0:v]$filters[x];[x][1:v]paletteuse" $Out
        if ($LASTEXITCODE -ne 0) { throw "GIF encoding failed" }

        Write-Host "OK  $Out"
    }
    finally {
        Remove-Item -LiteralPath $palette -Force -ErrorAction SilentlyContinue
    }
}

foreach ($path in $InputPath) {
    try {
        Convert-Gif -In $path -Out $Output
    }
    catch {
        Write-Warning ("{0}: {1}" -f $path, $_.Exception.Message)
    }
}
```

こちらも引数なしなら一覧から選べて、開始位置と長さを聞かれます。
