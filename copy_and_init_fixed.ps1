#!/usr/bin/env pwsh
<#
copy_and_init_fixed.ps1

Copies the workspace `Website/` contents into this folder and initializes a git repo
with an initial commit. Run this script from the `universal-understanding-v4` folder.
#>

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$source = Join-Path $scriptRoot '..\Website'

if (-not (Test-Path $source)) {
    Write-Error "Source folder not found: $source"
    exit 1
}

Write-Host "Copying files from: $source -> $scriptRoot"
Get-ChildItem -Path $source -Force | ForEach-Object {
    $dest = Join-Path $scriptRoot $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Warning "Git not found in PATH. Files copied but git init/commit skipped. Install Git or run the commands in GIT_PUSH_COMMANDS.txt."
    exit 0
}

if (-not (Test-Path (Join-Path $scriptRoot '.git'))) {
    Write-Host "Initializing git repository..."
    git init
    git add .
    git commit -m "chore(init): add Website content for universal-understanding-v4"
    Write-Host "Initial commit created. See GIT_PUSH_COMMANDS.txt to create remote and push."
} else {
    Write-Host "Repository already exists here. Adding and committing new files."
    git add .
    git commit -m "chore: add Website content" -a
}

Write-Host "Done. Next: follow GIT_PUSH_COMMANDS.txt to create the remote and push the main branch."
