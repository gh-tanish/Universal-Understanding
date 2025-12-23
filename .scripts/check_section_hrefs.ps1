# Check section-card hrefs and report targets that don't exist
$root = Get-Location
$htmlFiles = Get-ChildItem -Recurse -File -Include *.html | Where-Object { $_.FullName -notmatch '\.git\\' }
$issues = @()
foreach ($f in $htmlFiles) {
    $txt = Get-Content $f.FullName -Raw
    # Match anchors that contain class="section-card" and capture href
    $pattern = 'class="[^"]*section-card[^"]*"[^>]*href=["\'']([^"\'']+)["\'']'
    $matches = [regex]::Matches($txt, $pattern, 'IgnoreCase')
    foreach ($m in $matches) {
        $href = $m.Groups[1].Value.Trim()
        $baseDir = Split-Path $f.FullName
        $candidatePaths = @()
        $candidatePaths += Join-Path $baseDir $href
        $candidatePaths += Join-Path $baseDir (Join-Path $href 'index.html')
        if ($href -like '*/') {
            $candidatePaths += Join-Path $baseDir ($href.TrimEnd('/'))
            $candidatePaths += Join-Path $baseDir ($href.TrimEnd('/') + '.html')
        }
        $clean = $href -replace '^(?:Website[\\/])+',''
        if ($clean -ne $href) {
            $candidatePaths += Join-Path $baseDir $clean
            $candidatePaths += Join-Path $baseDir (Join-Path $clean 'index.html')
        }
        $exists = $false
        foreach ($cp in $candidatePaths) { if (Test-Path $cp) { $exists = $true; break } }
        if (-not $exists) {
            $relativeFile = Resolve-Path -Relative $f.FullName
            $issues += [PSCustomObject]@{File=$relativeFile; Href=$href; Candidates=($candidatePaths -join '; ')}
        }
    }
}
if ($issues.Count -eq 0) {
    Write-Output 'No missing section-card hrefs detected.'
} else {
    foreach ($it in $issues) {
        Write-Output "File: $($it.File)`n - href: $($it.Href)`n - checked: $($it.Candidates)`n"
    }
}
