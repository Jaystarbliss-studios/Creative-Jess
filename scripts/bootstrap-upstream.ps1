[CmdletBinding()]
param(
    [string]$Root = (Join-Path $PSScriptRoot '..\.upstream'),
    [switch]$IncludeArtCraft,
    [switch]$SkipBuild
)
$ErrorActionPreference = 'Stop'
$Root = [System.IO.Path]::GetFullPath($Root)
$LogRoot = Join-Path $Root '_logs'
New-Item -ItemType Directory -Force -Path $Root, $LogRoot | Out-Null
foreach ($commandName in @('git', 'cargo', 'rustc', 'node')) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) { throw "Required command '$commandName' was not found. Install Git and Rust first." }
}
$rustVersionText = (& rustc --version).ToString()
if ($rustVersionText -notmatch 'rustc (\d+)\.(\d+)') { throw "Could not parse Rust toolchain version: $rustVersionText" }
$rustMajor = [int]$Matches[1]; $rustMinor = [int]$Matches[2]
if (($rustMajor -lt 1) -or ($rustMajor -eq 1 -and $rustMinor -lt 95)) { throw "PhotoCraft and VectorCraft manifests require Rust 1.95 or newer. Found: $rustVersionText" }

$repositories = @('photocraft','vectorcraft','lightcraft','filmcraft','artcraftx','cadcraft','wordcraft','soundcraft','pdfcraft','designcraft','effectcraft','deckcraft','gridcraft','craft-launcher','craft-fonts','craft-repo-status-app')
if ($IncludeArtCraft) { $repositories += 'artcraft' }
$appPaths = [ordered]@{}
$mcpPaths = [ordered]@{}
$results = [System.Collections.Generic.List[object]]::new()

foreach ($repo in $repositories) {
    $destination = Join-Path $Root $repo
    $logFile = Join-Path $LogRoot ($repo + '.log')
    try {
        if (-not (Test-Path (Join-Path $destination '.git'))) {
            if (Test-Path $destination) { throw "Destination exists but is not a Git checkout. Move it manually before cloning: $destination" }
            Write-Host "Cloning $repo..."
            & git clone --depth 1 --filter=blob:none --single-branch --branch main ("https://github.com/storytold/" + $repo + ".git") $destination 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "git clone failed with exit code $LASTEXITCODE" }
        } else { Write-Host "Using existing checkout for $repo (this script will not reset or overwrite it)." }

        $manifest = Join-Path $destination 'Cargo.toml'
        if (-not (Test-Path $manifest)) {
            $results.Add([pscustomobject]@{ Repository = $repo; Status = 'no Cargo.toml'; Desktop = ''; McpCli = ''; Log = $logFile })
            continue
        }
        if ($SkipBuild) {
            $results.Add([pscustomobject]@{ Repository = $repo; Status = 'cloned; build skipped'; Desktop = ''; McpCli = ''; Log = $logFile })
            continue
        }

        Push-Location $destination
        try {
            Write-Host "Reading Cargo workspace metadata for $repo..."
            $metadataOutput = & cargo metadata --no-deps --format-version 1 2>> $logFile
            if ($LASTEXITCODE -ne 0) { throw "cargo metadata failed with exit code $LASTEXITCODE" }
            $metadata = ($metadataOutput -join [Environment]::NewLine) | ConvertFrom-Json
            $selected = @()
            $desktopPackage = $metadata.packages | Where-Object { $_.name -eq $repo -or $_.manifest_path.EndsWith('\apps\' + $repo + '\Cargo.toml') -or $_.manifest_path.EndsWith('\crates\desktop\' + $repo + '\Cargo.toml') -or ($_.targets | Where-Object { $_.kind -contains 'bin' -and $_.name -eq $repo }) } | Select-Object -First 1
            if ($desktopPackage) { $selected += $desktopPackage }
            foreach ($package in @($metadata.packages | Where-Object { $_.name -match '-(cli|automation|mcp)$' })) {
                if (-not ($selected | Where-Object { $_.name -eq $package.name })) { $selected += $package }
            }
            if ($selected.Count -eq 0) {
                $results.Add([pscustomobject]@{ Repository = $repo; Status = 'no obvious desktop/CLI package'; Desktop = ''; McpCli = ''; Log = $logFile })
                continue
            }
            $mcpSmokePassed = $false
            foreach ($package in $selected) {
                Write-Host "Building $repo / $($package.name)..."
                "=== cargo build --release -p $($package.name) ===" | Out-File -FilePath $logFile -Append -Encoding utf8
                & cargo build --release -p $package.name 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
                if ($LASTEXITCODE -ne 0) { Write-Warning "Build failed for $repo / $($package.name). See $logFile"; continue }
                foreach ($target in @($package.targets | Where-Object { $_.kind -contains 'bin' })) {
                    $executable = Join-Path (Join-Path $destination 'target\release') ($target.name + '.exe')
                    if (-not (Test-Path $executable)) { continue }
                    if (($package.name -match '-(cli|automation|mcp)$') -or ($target.name -match '-(cli|automation|mcp)$')) {
                        if (-not $mcpPaths.Contains($repo)) { $mcpPaths[$repo] = [System.IO.Path]::GetFullPath($executable) }
                    } elseif (($package.name -eq $repo) -or ($target.name -eq $repo) -or (-not $appPaths.Contains($repo))) {
                        if (-not $appPaths.Contains($repo)) { $appPaths[$repo] = [System.IO.Path]::GetFullPath($executable) }
                    }
                }
            }
            if ($mcpPaths.Contains($repo)) {
                Write-Host "Smoke-testing actual MCP CLI for $repo..."
                "=== node scripts/smoke-mcp.mjs --binary $($mcpPaths[$repo]) ===" | Out-File -FilePath $logFile -Append -Encoding utf8
                $smokeArgs = @((Join-Path $PSScriptRoot 'smoke-mcp.mjs'), '--binary', $mcpPaths[$repo])
                if ($repo -in @('photocraft', 'vectorcraft')) { $smokeArgs += '--scoped-roots' }
                & node @smokeArgs 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
                $mcpSmokePassed = ($LASTEXITCODE -eq 0)
                if (-not $mcpSmokePassed) { Write-Warning "MCP smoke test failed for $repo. See $logFile" }
            }
            $status = if ($mcpPaths.Contains($repo) -and $appPaths.Contains($repo) -and $mcpSmokePassed) { 'desktop and MCP built; MCP smoke passed' } elseif ($mcpPaths.Contains($repo) -and $mcpSmokePassed) { 'MCP built and smoke-tested; desktop not found' } elseif ($mcpPaths.Contains($repo)) { 'MCP CLI built; MCP smoke failed' } elseif ($appPaths.Contains($repo)) { 'desktop built; MCP CLI not found' } else { 'no executable verified; inspect build log' }
            $results.Add([pscustomobject]@{ Repository = $repo; Status = $status; Desktop = $appPaths[$repo]; McpCli = $mcpPaths[$repo]; Log = $logFile })
        } finally { Pop-Location }
    } catch {
        Write-Warning ($repo + ': ' + $_.Exception.Message)
        $results.Add([pscustomobject]@{ Repository = $repo; Status = 'failed: ' + $_.Exception.Message; Desktop = ''; McpCli = ''; Log = $logFile })
    }
}

$configDirectory = Join-Path (Split-Path $PSScriptRoot -Parent) 'config'
New-Item -ItemType Directory -Force -Path $configDirectory | Out-Null
$pathScript = Join-Path $configDirectory 'local-companion-paths.ps1'
$projectRoot = Join-Path $Root 'CraftProjects'
$exportRoot = Join-Path $projectRoot 'exports'
New-Item -ItemType Directory -Force -Path $projectRoot, $exportRoot | Out-Null
$scopedRoots = [ordered]@{}
foreach ($repo in @('photocraft', 'vectorcraft')) {
    if ($mcpPaths.Contains($repo)) {
        $scopedRoots[$repo] = [ordered]@{ readRoot = [System.IO.Path]::GetFullPath($projectRoot); writeRoot = [System.IO.Path]::GetFullPath($exportRoot) }
    }
}
$appJson = ConvertTo-Json -InputObject $appPaths -Compress
$mcpJson = ConvertTo-Json -InputObject $mcpPaths -Compress
$rootsJson = ConvertTo-Json -InputObject $scopedRoots -Compress -Depth 5
$extraArgs = [ordered]@{}
if ($mcpPaths.Contains('pdfcraft')) { $extraArgs['pdfcraft'] = @('--root', [System.IO.Path]::GetFullPath($projectRoot)) }
$extraArgsJson = ConvertTo-Json -InputObject $extraArgs -Compress -Depth 5
@(
    '# Generated by scripts/bootstrap-upstream.ps1. Local absolute paths; do not commit this file.'
    ('$env:CRAFT_APP_PATHS_JSON = ''' + $appJson.Replace("'", "''") + '''')
    ('$env:CRAFT_MCP_PATHS_JSON = ''' + $mcpJson.Replace("'", "''") + '''')
    ('$env:CRAFT_MCP_SCOPED_ROOTS_JSON = ''' + $rootsJson.Replace("'", "''") + '''')
    ('$env:CRAFT_MCP_EXTRA_ARGS_JSON = ''' + $extraArgsJson.Replace("'", "''") + '''')
    '# Copy working files into the project root above; scoped MCP exports are limited to the exports subfolder.'
    '# Optional: set CRAFT_WORKSPACE_ORIGINS to the actual web workspace origin.'
) | Set-Content -Path $pathScript -Encoding utf8
$results | Format-Table Repository, Status, Desktop, McpCli -AutoSize
Write-Host ''
Write-Host "Generated local path configuration: $pathScript"
Write-Host "Build logs: $LogRoot"
Write-Host 'Review every build log and test each CLI. This script does not mark upstream apps verified.'
