#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Full-page screenshot sweep for all dashboard profiles using vid-scroll.

.DESCRIPTION
  Captures expanded + collapsed variants of every profile at 3 breakpoints
  (390, 768, 1280) as WebP images. Full sweeps default to the ignored
  storage/screenshots/ staging directory; only curated README hero images belong in docs/screenshots/hero/.

  Requires:
    - Node 18+
    - vid-scroll cloned beside this repository (or set VID_SCROLL_DIR)
    - ffmpeg on PATH  (winget install Gyan.FFmpeg)

.PARAMETER Local
  Capture from local file:// URLs (default). Pass -Live to use the GitHub
  Pages baseUrl (requires internet access).

.PARAMETER Live
  Use the published GitHub Pages baseUrl instead of local file://.

.PARAMETER Output
  Output directory. Defaults to storage/screenshots relative to this repo (gitignored staging area).
  Graduate approved shots to docs/screenshots/ manually.

.PARAMETER Config
  Breakpoint config path relative to this repository. The wrapper resolves the
  file:// clone URL in a temporary ignored copy before invoking vid-scroll.

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
  # Refresh the curated README hero gallery
  pwsh -File scripts/capture.ps1 -Config configs\hero-screenshots.json -Output docs\screenshots\hero
#>

param(
  [switch]$Local  = $true,
  [switch]$Live   = $false,
  [string]$Output = "",
  [string]$Config = "configs\breakpoints.json",
  [string]$Only   = "",
  [string]$Pages  = ""
)

$ErrorActionPreference = "Stop"

# Resolve paths
$RepoRoot     = Split-Path -Parent $PSScriptRoot
$VidScrollDir = if ($env:VID_SCROLL_DIR) {
  $env:VID_SCROLL_DIR
} else {
  Join-Path (Split-Path -Parent $RepoRoot) "vid-scroll"
}
$CliPath      = Join-Path $VidScrollDir "src\cli.ts"
$ConfigPath   = Join-Path $RepoRoot $Config
$OutputDir    = if ($Output) {
  if ([System.IO.Path]::IsPathRooted($Output)) { $Output } else { Join-Path $RepoRoot $Output }
} else {
  Join-Path $RepoRoot "storage\screenshots"
}
$ScratchDir   = Join-Path $RepoRoot "_scratch"
$RuntimeConfigPath = Join-Path $ScratchDir "capture-breakpoints.json"

# Validate prerequisites
if (-not (Test-Path $CliPath)) {
  Write-Error "vid-scroll not found at $VidScrollDir. Clone it beside this repository or set VID_SCROLL_DIR."
  exit 1
}
if (-not (Test-Path $ConfigPath)) {
  Write-Error "capture config not found: $ConfigPath"
  exit 1
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Error "ffmpeg not found on PATH.`nInstall: winget install Gyan.FFmpeg"
  exit 1
}

New-Item -ItemType Directory -Force $OutputDir | Out-Null
New-Item -ItemType Directory -Force $ScratchDir | Out-Null

$repoUri = [System.Uri]::new(($RepoRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar)).AbsoluteUri
$configText = [System.IO.File]::ReadAllText($ConfigPath, [System.Text.Encoding]::UTF8)
if (-not $Live) {
  if (-not $configText.Contains('file:///<repo-root>/')) {
    Write-Error "capture config must use file:///<repo-root>/ as defaults.localUrl: $ConfigPath"
    exit 1
  }
  $configText = $configText.Replace('file:///<repo-root>/', $repoUri)
}
[System.IO.File]::WriteAllText(
  $RuntimeConfigPath,
  $configText,
  [System.Text.UTF8Encoding]::new($false)
)

# Build argument list
$args = @(
  "--no-install", "tsx", $CliPath,
  "--breakpoints", $RuntimeConfigPath,
  "--output", $OutputDir
)
if (-not $Live) { $args += "--local" }
if ($Only)      { $args += @("--only", $Only) }
if ($Pages)     { $args += @("--pages", $Pages) }

Write-Host ""
Write-Host "dashboard capture" -ForegroundColor Cyan
Write-Host "  config : $ConfigPath (runtime copy: $RuntimeConfigPath)"
Write-Host "  output : $OutputDir"
Write-Host "  mode   : $(if ($Live) { 'live (GitHub Pages)' } else { 'local (file://)' })"
if ($Only)  { Write-Host "  only   : $Only" }
if ($Pages) { Write-Host "  pages  : $Pages" }
Write-Host ""

Push-Location $VidScrollDir
try {
  & npx @args
  if ($LASTEXITCODE -ne 0) {
    throw "vid-scroll exited with code $LASTEXITCODE"
  }
} finally {
  Pop-Location
  Remove-Item -LiteralPath $RuntimeConfigPath -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Done — screenshots in $OutputDir" -ForegroundColor Green
