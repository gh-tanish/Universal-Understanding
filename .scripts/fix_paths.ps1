$files = Get-ChildItem -Path . -Filter *.html -Recurse
$stylePatterns = @('../../../../../styles.css','../../../../styles.css','../../../styles.css','../../styles.css','../styles.css','styles.css')
$scriptPatterns = @('../../../../../script.js','../../../../script.js','../../../script.js','../../script.js','../script.js','script.js')

foreach($f in $files){
    $orig = Get-Content $f.FullName -Raw
    $text = $orig
    foreach($p in $stylePatterns){
        $text = $text.Replace('href="'+$p+'"','href="/Universal-Understanding/styles.css"')
    }
    foreach($p in $scriptPatterns){
        $text = $text.Replace('src="'+$p+'"','src="/Universal-Understanding/script.js"')
    }
    if($text -ne $orig){
        Set-Content $f.FullName $text
        Write-Output "Updated: $($f.FullName)"
    }
}
Write-Output "Done"
