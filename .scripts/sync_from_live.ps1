param(
    [string]$BaseUrl = 'https://gh-tanish.github.io/Universal-Understanding/'
)
Write-Output "Syncing from live site: $BaseUrl"
function Ensure-Dir($path){ if(-not (Test-Path $path)){ New-Item -ItemType Directory -Path $path -Force | Out-Null } }
function Save-UrlToPath($url, $localPath){
    try{
        Ensure-Dir ((Split-Path $localPath -Parent))
        Write-Output "Downloading $url -> $localPath"
        Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $localPath -ErrorAction Stop
        return $true
    } catch { Write-Warning "Failed to download $url: $_"; return $false }
}
# Normalize base
if ($BaseUrl[-1] -ne '/') { $BaseUrl += '/' }
# Try sitemap.json locations
$attempts = @('sitemap.json','Website/sitemap.json')
$pages = $null
foreach ($a in $attempts){
    $url = $BaseUrl.TrimEnd('/') + '/' + $a
    try{
        Write-Output "Trying sitemap at: $url"
        $pages = Invoke-RestMethod -Uri $url -UseBasicParsing -ErrorAction Stop
        if ($pages) { Write-Output "Loaded sitemap from $url"; break }
    } catch { }
}
# If no sitemap.json, try inline sitemap in root index.html
if (-not $pages){
    try{
        $rootHtml = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing -ErrorAction Stop
        $m = [regex]::Match($rootHtml.Content, '<script[^>]+id=["\']sitemap-data["\'][^>]*>(.*?)</script>', 'Singleline')
        if ($m.Success){
            $json = $m.Groups[1].Value.Trim()
            $pages = ConvertFrom-Json $json
            Write-Output "Loaded inline sitemap from root index.html"
        }
    } catch { }
}
# If still no pages, fallback to downloading root index.html and common assets
$downloadList = @()
if ($pages){
    foreach ($p in $pages){
        $path = $p.path -replace '^/+', ''
        if (-not $path) { continue }
        $downloadList += $path
    }
} else {
    Write-Warning "No sitemap found; will download root index and common assets only.";
    $downloadList += 'index.html'
    $downloadList += 'styles.css'
    $downloadList += 'script.js'
}
# Ensure unique
$downloadList = $downloadList | Select-Object -Unique
# Download each page and collect asset urls
$assetUrls = New-Object System.Collections.Generic.HashSet[string]
foreach ($rel in $downloadList){
    $url = [Uri]::new($BaseUrl, $rel).AbsoluteUri
    $localPath = Join-Path (Get-Location) $rel
    # Normalize target: if rel ends with '/', save index.html inside
    if ($rel.EndsWith('/')){ $localPath = Join-Path $localPath 'index.html' }
    Save-UrlToPath $url $localPath | Out-Null
    # Parse downloaded HTML for assets
    try{
        $content = Get-Content -Raw -LiteralPath $localPath -ErrorAction Stop
        $matches = [regex]::Matches($content, '(?:src|href)=["\']([^"\']+)["\']', 'IgnoreCase')
        foreach ($m in $matches){
            $token = $m.Groups[1].Value
            if ($token -match '^(?:https?:)?//') { continue } # skip external
            if ($token -match '^mailto:') { continue }
            # make absolute relative to page url
            $abs = ''
            if ($token.StartsWith('/')){ $abs = [Uri]::new($BaseUrl.TrimEnd('/')) .ToString().TrimEnd('/') + $token }
            else { $abs = (New-Object System.Uri((New-Object System.Uri($url)), $token)).AbsoluteUri }
            $assetUrls.Add($abs) | Out-Null
        }
    } catch { }
}
# Also ensure top-level assets are downloaded
$commonAssets = @('styles.css','script.js','sitemap.json','Website/sitemap.json')
foreach ($a in $commonAssets){ $assetUrls.Add(([Uri]::new($BaseUrl, $a)).AbsoluteUri) | Out-Null }
# Download assets
foreach ($u in $assetUrls){
    try{
        $uri = [Uri] $u
        $relPath = $uri.AbsolutePath.TrimStart('/')
        if ($relPath -eq '') { continue }
        $local = Join-Path (Get-Location) $relPath
        # if path ends with '/', target index.html
        if ($local.EndsWith('.')) { $local = $local + 'index.html' }
        Save-UrlToPath $u $local | Out-Null
    } catch { Write-Warning "Skipping asset $u" }
}
# Git add/commit/push
try{
    git add -A
    git commit -m "chore(sync): download public pages/assets from live site $BaseUrl" -q
} catch { Write-Output "No local changes to commit or git commit failed: $_" }
try{ git push universal main } catch { Write-Warning "git push failed: $_" }
Write-Output "Sync complete. Downloaded pages: $($downloadList.Count). Assets: $($assetUrls.Count)"