# Find exact duplicate files by SHA1 (excluding .git)
$files = Get-ChildItem -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\.git\\' }
$hashes = @{}
foreach ($f in $files) {
    try {
        $h = (Get-FileHash $f.FullName -Algorithm SHA1).Hash
    } catch {
        continue
    }
    if (-not $hashes.ContainsKey($h)) { $hashes[$h] = @() }
    $hashes[$h] += $f.FullName
}
$found = $false
foreach ($k in $hashes.Keys | Sort-Object) {
    if ($hashes[$k].Count -gt 1) {
        $found = $true
        Write-Output "HASH: $k"
        foreach ($p in $hashes[$k]) { Write-Output (" - " + $p) }
        Write-Output ""
    }
}
if (-not $found) { Write-Output "No exact duplicate files found." }
