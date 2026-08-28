# SAABIZ PostgreSQL backup script (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1
# Creates gzipped dumps in ./backups and keeps the newest 14.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root 'backups'
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Load DATABASE_URL from .env (postgresql://user:pass@host:port/db?schema=...)
$envFile = Join-Path $root '.env'
if (-not (Test-Path $envFile)) { Write-Error '.env not found'; exit 1 }

$dbUrl = (Select-String -Path $envFile -Pattern '^DATABASE_URL=').Line -replace '^DATABASE_URL="?', '' -replace '"$', ''
if (-not $dbUrl) { Write-Error 'DATABASE_URL missing from .env'; exit 1 }

$uri = [Uri]$dbUrl
$user = $uri.UserInfo.Split(':')[0]
$pass = ($uri.UserInfo -split ':', 2)[1]
$db = $uri.AbsolutePath.TrimStart('/').Split('?')[0]
$hostname = $uri.Host
$port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }

$pgDump = 'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe'
if (-not (Test-Path $pgDump)) { $pgDump = 'pg_dump' }

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outFile = Join-Path $backupDir "saabiz_$stamp.sql.gz"
$tmpDump = Join-Path $env:TEMP "saabiz_dump_$stamp.sql"

$env:PGPASSWORD = $pass
try {
    & $pgDump -h $hostname -p $port -U $user -d $db --no-owner --no-privileges -f $tmpDump
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }

    # Compress with .NET (no external gzip required on Windows)
    $inStream = [System.IO.File]::OpenRead($tmpDump)
    $outStream = [System.IO.File]::Create($outFile)
    $gz = New-Object System.IO.Compression.GZipStream($outStream, [System.IO.Compression.CompressionMode]::Compress)
    try {
        $inStream.CopyTo($gz)
    } finally {
        $gz.Dispose(); $outStream.Dispose(); $inStream.Dispose()
    }
    Remove-Item $tmpDump -Force

    $size = (Get-Item $outFile).Length / 1MB
    Write-Output "Backup written: $outFile ($([math]::Round($size, 2)) MB)"
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

# Retention: keep the newest 14 dumps
$keep = 14
Get-ChildItem $backupDir -Filter 'saabiz_*.sql.gz' | Sort-Object Name -Descending | Select-Object -Skip $keep | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Output "Pruned old backup: $($_.Name)"
}