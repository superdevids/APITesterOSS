# API Tester OSS — Push to GitHub (PowerShell)
# Run: .\push-to-github.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 API Tester OSS — Push to GitHub`n" -ForegroundColor Cyan
Write-Host "==================================`n"

$REPO_NAME = "api-tester"
$REPO_DESC = "Native, lightweight, open-source API client — the Postman/Insomnia alternative. Built with Tauri 2.x + Svelte 5 + Rust. Binary <20MB, RAM <80MB, no login, no telemetry."
$BRANCH = "main"
$COMMIT_MSG = "feat: initial release v0.1.0 — REST API client with collections, environments, import/export, and full documentation"

# Step 1: Initialize Git
Write-Host "📦 Step 1: Initializing Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    git checkout -b $BRANCH
    Write-Host "✅ Git initialized on branch: $BRANCH" -ForegroundColor Green
} else {
    Write-Host "✅ Git already initialized" -ForegroundColor Green
}

# Step 2: Add all files
Write-Host "`n📦 Step 2: Staging files..." -ForegroundColor Yellow
git add -A
Write-Host "✅ Files staged" -ForegroundColor Green

$totalFiles = (git status --short | Measure-Object -Line).Lines
Write-Host "`nTotal files: $totalFiles`n"

# Step 3: Create initial commit
Write-Host "📦 Step 3: Creating commit..." -ForegroundColor Yellow
git commit -m $COMMIT_MSG 2>&1 | Out-Null
Write-Host "✅ Commit created" -ForegroundColor Green

# Step 4: Create GitHub repository
Write-Host "`n📦 Step 4: Creating GitHub repository..." -ForegroundColor Yellow

$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if ($ghInstalled) {
    Write-Host "   Using GitHub CLI (gh)..."
    gh repo create $REPO_NAME --public --description $REPO_DESC --source=. --remote=origin 2>$null
    if ($LASTEXITCODE -eq 0) {
        $githubUser = (gh api user --jq .login)
        Write-Host "✅ Repository created: https://github.com/$githubUser/$REPO_NAME" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Repository may already exist" -ForegroundColor Yellow
        $githubUser = (gh api user --jq .login)
        git remote add origin "https://github.com/$githubUser/$REPO_NAME.git" 2>$null
    }
} elseif ($env:GITHUB_TOKEN) {
    Write-Host "   Using GITHUB_TOKEN..."
    $headers = @{ "Authorization" = "token $env:GITHUB_TOKEN" }
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    $githubUser = $user.login

    $body = @{ name = $REPO_NAME; description = $REPO_DESC; private = $false } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null

    git remote add origin "https://github.com/$githubUser/$REPO_NAME.git" 2>$null
    Write-Host "✅ Repository created: https://github.com/$githubUser/$REPO_NAME" -ForegroundColor Green
} else {
    Write-Host "⚠️ Neither GitHub CLI (gh) nor GITHUB_TOKEN found." -ForegroundColor Yellow
    Write-Host "   Please create the repository manually: https://github.com/new"
    $githubUser = Read-Host "   Enter your GitHub username"
    git remote add origin "https://github.com/$githubUser/$REPO_NAME.git" 2>$null
    Write-Host "✅ Remote added" -ForegroundColor Green
}

# Step 5: Push
Write-Host "`n📦 Step 5: Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin $BRANCH
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Success! Your project is now on GitHub!" -ForegroundColor Green
    $remoteUrl = git remote get-url origin
    Write-Host "   Repository: $remoteUrl`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed. Try: git push -u origin $BRANCH --force" -ForegroundColor Red
}
