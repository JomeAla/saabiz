# Stable launcher: runs API (built output) and Web (next dev) WITHOUT the Nx daemon.
# Usage: .\start-servers.ps1 [-apiOnly] [-webOnly]
param(
  [switch]$apiOnly,
  [switch]$webOnly
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $root '.env'

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim()
      $value = $value -replace '^"(.*)"$', '$1'
      if (-not [Environment]::GetEnvironmentVariable($name)) {
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
      }
    }
  }
} else {
  Write-Host 'WARN: .env not found - API may not boot' -ForegroundColor Yellow
}

if (-not $webOnly) {
  Write-Host 'Starting API (dist) on :3001' -ForegroundColor Cyan
  Start-Process -FilePath "node.exe" -ArgumentList "dist/apps/api/src/main.js" -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $root 'api_dev.log') -RedirectStandardError (Join-Path $root 'api_dev.err.log')
}
if (-not $apiOnly) {
  Write-Host 'Starting Web (next dev) on :3000' -ForegroundColor Cyan
  Start-Process -FilePath "node.exe" -ArgumentList "node_modules/next/dist/bin/next", "dev", "apps/web", "-p", "3000" -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $root 'web_dev.log') -RedirectStandardError (Join-Path $root 'web_dev.err.log')
}
Write-Host 'Launched. Logs: api_dev.log / web_dev.log'