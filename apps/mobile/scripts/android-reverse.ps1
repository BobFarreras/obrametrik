$adbPath = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path -LiteralPath $adbPath)) {
  Write-Error "ADB no está instalado en la ruta estándar de Android Studio."
  exit 1
}

& $adbPath start-server
$devices = & $adbPath devices

if (-not ($devices -match "\tdevice$")) {
  Write-Error "No hay ningún Android autorizado por USB. Revisa la depuración USB."
  exit 1
}

& $adbPath reverse tcp:55321 tcp:55321
& $adbPath reverse tcp:3000 tcp:3000

Write-Output "USB preparado: Supabase 55321 y API web 3000."
