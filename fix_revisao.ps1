$file = "app\propostas\nova\page.tsx"
$content = Get-Content $file -Raw -Encoding UTF8

# Corrige a linha com revisao corrompida
$content = $content -replace "revisao: \\\\R\\\\\`$\\\\{String\(fullData\.versao\)\.padStart\(2, '0'\)\\\\}\\\\\,", "revisao: ``R`${String(fullData.versao).padStart(2, '0')}``,"

Set-Content $file $content -Encoding UTF8
Write-Host "Substituicao concluida"
