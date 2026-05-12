$files = Get-ChildItem -Path 'app','components','lib' -Recurse -Include '*.tsx','*.ts','*.css'
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $content = $content.Replace('#d97706','#06b6d4')
  $content = $content.Replace('#b45309','#0891b2')
  $content = $content.Replace('#f59e0b','#22d3ee')
  $content = $content.Replace('#92400e','#164e63')
  $content = $content.Replace('fcd34d','67e8f9')
  $content = $content.Replace('amber-400','cyan-400')
  $content = $content.Replace('amber-950','cyan-950')
  $content = $content.Replace('amber-800','cyan-800')
  $content = $content.Replace('amber-500','cyan-500')
  $content = $content.Replace('amber-300','cyan-300')
  $content = $content.Replace('glow-gold','glow-cyan')
  $content = $content.Replace('badge-gold','badge-cyan')
  [System.IO.File]::WriteAllText($file.FullName, $content)
}
Write-Host "Done"
