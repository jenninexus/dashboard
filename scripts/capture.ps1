#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Full-page screenshot sweep for all dashboard profiles using vid-scroll.

.DESCRIPTION
  Captures expanded + collapsed variants of every profile at 3 breakpoints
  (390, 768, 1280) as WebP images, output to docs/screenshots/.

  Requires:
    - Node 18+
    - vid-scroll cloned at C:\Github\vid-scroll  (or set VID_SCROLL_DIR env)
    - ffmpeg on PATH  (winget install Gyan.FFmpeg)

.PARAMETER Local
  Capture from local file:// URLs (default). Pass -Live to use the GitHub
  Pages baseUrl (requires internet access).

.PARAMETER Live
  Use the published GitHub Pages baseUrl instead of local file://.

.PARAMETER Output
  Output directory. Defaults to storage/screenshots relative to this repo (gitignored staging area).
  Graduate approved shots to docs/screenshots/ manually.

.PARAMETER Only
  Comma-separated breakpoint names to limit capture (e.g. "1280-desktop").

.PARAMETER Pages
  Comma-separated page slugs to limit capture (e.g. "seo,health").

.EXAMPLE
  # Capture everything locally → storage/screenshots/ (default staging area)
  pwsh -File scripts/capture.ps1

.EXAMPLE
  # Desktop only, SEO profile
  pwsh -File scripts/capture.ps1 -Only "1280-desktop" -Pages "seo"

.EXAMPLE
  # Capture from live GitHub Pages
  pwsh -File scripts/capture.ps1 -Live

.EXAMPLE
  # Graduate approved shots to docs/screenshots/ (committed to repo)
  pwsh -File scripts/capture.ps1 -Output docs\screenshots
#>

param(
  [switch]$Local  = $true,
  [switch]$Live   = $false,
  [string]$Output = "",
  [string]$Only   = "",
  [string]$Pages  = ""
)

$ErrorActionPreference = "Stop"

# Resolve paths
$RepoRoot     = Split-Path -Parent $PSScriptRoot
$VidScrollDir = $env:VID_SCROLL_DIR ?? "C:\Github\vid-scroll"
$CliPath      = Join-Path $VidScrollDir "src\cli.ts"
$ConfigPath   = Join-Path $RepoRoot "configs\breakpoints.json"
$OutputDir    = if ($Output) { $Output } else { Join-Path $RepoRoot "storage\screenshots" }

# Validate prerequisites
if (-not (Test-Path $CliPath)) {
  Write-Error "vid-scroll not found at $VidScrollDir`nClone it: git clone https://github.com/monofinitystudio/vid-scroll C:\Github\vid-scroll"
  exit 1
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Error "ffmpeg not found on PATH.`nInstall: winget install Gyan.FFmpeg"
  exit 1
}

New-Item -ItemType Directory -Force $OutputDir | Out-Null

# Build argument list
$args = @(
  "tsx", $CliPath,
  "--breakpoints", $ConfigPath,
  "--output", $OutputDir
)
if (-not $Live) { $args += "--local" }
if ($Only)      { $args += @("--only", $Only) }
if ($Pages)     { $args += @("--pages", $Pages) }

Write-Host ""
Write-Host "dashboard capture" -ForegroundColor Cyan
Write-Host "  config : $ConfigPath"
Write-Host "  output : $OutputDir"
Write-Host "  mode   : $(if ($Live) { 'live (GitHub Pages)' } else { 'local (file://)' })"
if ($Only)  { Write-Host "  only   : $Only" }
if ($Pages) { Write-Host "  pages  : $Pages" }
Write-Host ""

Push-Location $VidScrollDir
try {
  & node $args
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Done — screenshots in $OutputDir" -ForegroundColor Green
