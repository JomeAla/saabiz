# SAABIZ monitoring probe (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/monitor.ps1
# Checks API health (incl. DB + Redis) and web. Exit code 0 = healthy, 1 = degraded.
# Scheduled task can alert on exit code or email via a wrapper.

$ErrorActionPreference = 'Continue'
$api = 'http://localhost:3001/api/health'
$apiDb = 'http://localhost:3001/api/health/db'
$apiRedis = 'http://localhost:3001/api/health/redis'
$web = 'http://localhost:3000'

$results = @()
$exit = 0

try {
    $h = Invoke-RestMethod -Uri $api -TimeoutSec 10
    $results += "api /api/health: ok ($($h.status))"
} catch {
    $results += "api /api/health: DOWN ($($_.Exception.Message))"
    $exit = 1
}

try {
    $d = Invoke-RestMethod -Uri $apiDb -TimeoutSec 10
    $results += "database: $($d.status) ($($d.database))"
    if ($d.status -ne 'healthy') { $exit = 1 }
} catch {
    $results += "database: DOWN ($($_.Exception.Message))"
    $exit = 1
}

try {
    $r = Invoke-RestMethod -Uri $apiRedis -TimeoutSec 10
    $results += "redis: $($r.status) ($($r.redis))"
    if ($r.status -ne 'healthy') { $exit = 1 }
} catch {
    $results += "redis: DOWN ($($_.Exception.Message))"
    $exit = 1
}

try {
    $w = Invoke-WebRequest -Uri $web -TimeoutSec 15 -UseBasicParsing
    $results += "web :3000: ok (HTTP $($w.StatusCode))"
    if ($w.StatusCode -ge 500) { $exit = 1 }
} catch {
    $results += "web :3000: DOWN ($($_.Exception.Message))"
    $exit = 1
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$results | ForEach-Object { Write-Output "[$stamp] $_" }
Write-Output "[$stamp] overall: $(if ($exit -eq 0) { 'HEALTHY' } else { 'DEGRADED' })"
exit $exit