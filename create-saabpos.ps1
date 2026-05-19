$ErrorActionPreference = 'Stop'

$logoPath = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath 'logo.png'
$batPath  = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath 'start-saabpos.bat'
$desktop  = [Environment]::GetFolderPath('Desktop')

$shortcutPath = Join-Path $desktop 'Saab Electric POS.lnk'

if (!(Test-Path $batPath)) {
  throw "Launcher not found: $batPath"
}

if (!(Test-Path $logoPath)) {
  throw "Icon image not found: $logoPath"
}

# Build a proper .ico in temp so Windows shortcut can use it.
$tempDir = Join-Path $env:TEMP 'saabpos-shortcut'
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$icoPath = Join-Path $tempDir 'saabpos-icon.ico'

# Convert logo.png -> .ico (requires an image tool).
# If ImageMagick is not installed, we fall back to setting the shortcut icon via the .png path (may be ignored by Windows).
$hasMagick = Get-Command magick -ErrorAction SilentlyContinue
if ($hasMagick) {
  & magick $logoPath -resize 64x64 $icoPath
} else {
  Write-Host "ImageMagick 'magick' not found. Creating shortcut without .ico conversion. (Icon may not apply.)"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = (Split-Path -Parent $batPath)
if (Test-Path $icoPath) {
  $shortcut.IconLocation = $icoPath
} else {
  $shortcut.IconLocation = $logoPath
}

$shortcut.Save()

Write-Host "Shortcut created: $shortcutPath" 

