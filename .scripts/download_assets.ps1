param(
    [string]$BaseUrl = 'https://gh-tanish.github.io/Universal-Understanding/'
)
if ($BaseUrl[-1] -ne '/') { $BaseUrl += '/' }
function Save-Url($url, $local){
    $dir = Split-Path $local -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Write-Output "Downloading $url -> $local"
    & curl.exe -fsSL $url -o $local
    if ($LASTEXITCODE -ne 0) { Write-Warning "Failed to download $url" }
}
# Collect all relative asset URLs from downloaded HTML files
$files = Get-ChildItem -Recurse -Include *.html | Where-Object { $_.FullName -notmatch '\\.git\\' }
$assets = New-Object System.Collections.Generic.HashSet[string]
foreach ($f in $files){
    $txt = Get-Content -Raw -LiteralPath $f.FullName -ErrorAction SilentlyContinue
    if (-not $txt) { continue }
    $matches = [regex]::Matches($txt, '(?:src|href)=["\"]([^"\"]+)["\"]', 'IgnoreCase')
    foreach ($m in $matches) {
        $tok = $m.Groups[1].Value
        if ($tok -match '^(?:https?:)?//') { continue }
        if ($tok -match '^mailto:' -or $tok -match '^#') { continue }
        # skip pages (html or directories) that we already downloaded
        if ($tok -match '\.html$' -or $tok.EndsWith('/')) { continue }
        # normalize token relative to the file
        try{
            $base = (New-Object System.Uri((New-Object System.Uri($BaseUrl)), (Resolve-Path -LiteralPath $f.FullName).Path))
        } catch { $base = New-Object System.Uri($BaseUrl) }
        try{
            $abs = (New-Object System.Uri($base, $tok)).AbsoluteUri
            $assets.Add($abs) | Out-Null
        } catch { }
    }
}
# Also include common asset names at root
$common = @('styles.css','script.js')
foreach ($c in $common){ $assets.Add((New-Object System.Uri($BaseUrl, $c)).AbsoluteUri) | Out-Null }
# Download assets
$count = 0
foreach ($u in $assets){
    try{
        $uri = [Uri] $u
        $rel = $uri.AbsolutePath.TrimStart('/')
        if (-not $rel) { continue }
        $local = Join-Path (Get-Location) $rel
        Save-Url $u $local
        $count++
    } catch { Write-Warning "Skipping asset $u" }
}
# Commit and push
try { git add -A; git commit -m "chore(sync): download referenced assets from live site" -q } catch { Write-Output 'Nothing to commit' }
try { git push universal main } catch { Write-Warning 'git push failed' }
Write-Output "Downloaded assets: $count"
