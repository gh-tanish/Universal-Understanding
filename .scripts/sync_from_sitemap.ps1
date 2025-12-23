param(
    [string]$BaseUrl = 'https://gh-tanish.github.io/Universal-Understanding/'
)
if ($BaseUrl[-1] -ne '/') { $BaseUrl += '/' }
$sitemapFile = Join-Path (Get-Location) 'live_sitemap.json'
if (-not (Test-Path $sitemapFile)) { Write-Error "Sitemap file not found at $sitemapFile"; exit 2 }
try{
    $pages = Get-Content $sitemapFile -Raw | ConvertFrom-Json
} catch { Write-Error "Failed to parse sitemap JSON: $_"; exit 3 }
$count = 0
foreach ($p in $pages){
    $rel = ($p.path -replace '^/+', '')
    if (-not $rel) { continue }
    $url = [Uri]::new($BaseUrl, $rel).AbsoluteUri
    $local = Join-Path (Get-Location) $rel
    if ($rel.EndsWith('/')) { $local = Join-Path $local 'index.html' }
    $dir = Split-Path $local -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Write-Output "Downloading $url -> $local"
    & curl.exe -fsSL $url -o $local
    if ($LASTEXITCODE -ne 0) { Write-Warning "Failed: $url" }
    $count++
}
# also download common files
$common = @('index.html','styles.css','script.js','sitemap.json','Website/sitemap.json')
foreach ($c in $common){
    $url = [Uri]::new($BaseUrl, $c).AbsoluteUri
    $local = Join-Path (Get-Location) $c
    $dir = Split-Path $local -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Write-Output "Downloading $url -> $local"
    & curl.exe -fsSL $url -o $local
    if ($LASTEXITCODE -ne 0) { Write-Warning "Failed: $url" }
}
# commit and push
try { git add -A; git commit -m "chore(sync): import pages from live site" -q } catch { Write-Output 'Nothing to commit or commit failed' }
try { git push universal main } catch { Write-Warning 'git push failed' }
Write-Output "Downloaded pages: $count"