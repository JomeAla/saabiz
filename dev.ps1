# SAABIZ - Native Dev Environment Runbook (Windows)
# Starts the multi-domain platform without Docker.
#
# Usage:
#   .\dev.ps1            # check deps, add hosts entries, start api + web
#   .\dev.ps1 -servers   # api + web
#   .\dev.ps1 -hosts      # only update hosts file (needs admin)
#   .\dev.ps1 -check      # only verify prerequisites
#
# Requires: PostgreSQL 17 (native), Memurai (Redis), Node 18+/24, pnpm 10
$ErrorActionPreference = 'Stop'

param(
  [switch]$hosts,
  [switch]$check,
  [switch]$servers
)

$PLATFORM = 'saabiz.com'
$WILD_HOSTS = @(
  '127.0.0.1 acme.saabiz.com',
  '127.0.0.1 globex.saabiz.com'
)

function RunCheck {
  Write-Host '== Prerequisites ==' -ForegroundColor Cyan

  $pg = Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' }
  if ($pg) { Write-Host "  [OK] PostgreSQL: $($pg.Name)" -ForegroundColor Green }
  else { Write-Host '  [WARN] No running PostgreSQL service found' -ForegroundColor Yellow }

  $redis = Get-Process memurai -ErrorAction SilentlyContinue
  if ($redis -or (Get-Service -Name 'Memurai' -ErrorAction SilentlyContinue | Where-Object Status -eq 'Running')) {
    Write-Host '  [OK] Memurai (Redis) is running' -ForegroundColor Green
  } else {
    Write-Host '  [WARN] Memurai (Redis) is NOT running' -ForegroundColor Yellow
  }

  node --version | ForEach-Object { Write-Host "  [OK] Node $_" -ForegroundColor Green }
  (Get-Command pnpm -ErrorAction SilentlyContinue) | Out-Null
  if ($?) { pnpm --version | ForEach-Object { Write-Host "  [OK] pnpm $_" -ForegroundColor Green } }
  else { Write-Host '  [WARN] pnpm not found on PATH' -ForegroundColor Yellow }

  $apiPort = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
  $webPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($apiPort) { Write-Host '  [OK] API already listening on :3001' -ForegroundColor Green }
  else { Write-Host '  [--] API not running on :3001' -ForegroundColor Gray }
  if ($webPort) { Write-Host '  [OK] Web already listening on :3000' -ForegroundColor Green }
  else { Write-Host '  [--] Web not running on :3000' -ForegroundColor Gray }
}

function UpdateHosts {
  Write-Host 'Updating hosts entries...' -ForegroundColor Cyan
  $hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
  $content = Get-Content -LiteralPath $hostsPath -Raw -ErrorAction Stop
  foreach ($line in $WILD_HOSTS) {
    if ($content -match [regex]::Escape($line)) {
      Write-Host "  [OK] Already present: $line" -ForegroundColor Green
    } else {
      try {
        Add-Content -LiteralPath $hostsPath -Value "`n$line" -ErrorAction Stop
        Write-Host "  [ADD] $line" -ForegroundColor Green
      } catch {
        Write-Host "  [FAIL] Cannot write hosts file. Re-run PowerShell as Administrator." -ForegroundColor Red
        exit 1
      }
    }
  }
}

if ($check) { RunCheck; exit 0 }
if ($hosts) { UpdateHosts; exit 0 }

Write-Host 'SAABIZ Native Dev (no Docker)' -ForegroundColor Magenta
RunCheck
UpdateHosts

if (-not $servers) { Write-Host 'Dry run complete. Use -servers to start API + Web.' -ForegroundColor Yellow; exit 0 }

Write-Host ''
Write-Host 'Starting API on :3001 and Web on :3000' -ForegroundColor Cyan
$env:NX_DAEMON = 'false'
pnpm run dev:all