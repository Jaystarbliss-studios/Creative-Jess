[CmdletBinding()]
param(
    [switch]$SkipGeneratedConfig
)

$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$configPath = Join-Path $repoRoot 'config\local-companion-paths.ps1'

if (-not $SkipGeneratedConfig -and (Test-Path $configPath)) {
    . $configPath
    Write-Host "Loaded local app/MCP paths from $configPath"
} elseif (-not $SkipGeneratedConfig) {
    Write-Warning "No generated local path configuration was found. The companion can start, but no apps or MCP CLIs may be configured. Run scripts/bootstrap-upstream.ps1 first or set the CRAFT_* variables yourself."
}

Push-Location $repoRoot
try {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw 'Node.js/npm was not found. Install Node.js 22 or newer and run npm install first.'
    }
    & npm run companion
    if ($LASTEXITCODE -ne 0) {
        throw "The local companion exited with code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
