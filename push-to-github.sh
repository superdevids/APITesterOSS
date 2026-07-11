#!/usr/bin/env bash
#
# API Tester OSS — Push to GitHub Script
# Run this script to initialize git, create a GitHub repo, and push all files.
#
# Usage:
#   chmod +x push-to-github.sh
#   ./push-to-github.sh
#
# Prerequisites:
#   - Git installed
#   - GitHub CLI (gh) installed and authenticated, OR
#   - GitHub personal access token set as GITHUB_TOKEN env var
#

set -e

echo "🚀 API Tester OSS — Push to GitHub"
echo "=================================="
echo ""

# Configuration — change these if needed
REPO_NAME="api-tester"
REPO_DESC="Native, lightweight, open-source API client — the Postman/Insomnia alternative. Built with Tauri 2.x + Svelte 5 + Rust. Binary <20MB, RAM <80MB, no login, no telemetry."
BRANCH="main"
COMMIT_MSG="feat: initial release v0.1.0 — REST API client with collections, environments, import/export, and full documentation"

# Step 1: Initialize Git
echo "📦 Step 1: Initializing Git repository..."
if [ ! -d ".git" ]; then
  git init
  git checkout -b "$BRANCH"
  echo "✅ Git initialized on branch: $BRANCH"
else
  echo "✅ Git already initialized"
fi

# Step 2: Add all files
echo ""
echo "📦 Step 2: Staging files..."
git add -A
echo "✅ Files staged"

# Show what will be committed
echo ""
echo "Files to be committed:"
git status --short | head -50
TOTAL_FILES=$(git status --short | wc -l)
echo "... total: $TOTAL_FILES files"
echo ""

# Step 3: Create initial commit
echo "📦 Step 3: Creating commit..."
git commit -m "$COMMIT_MSG" || echo "⚠️ Nothing to commit (already up to date)"
echo "✅ Commit created"

# Step 4: Create GitHub repository
echo ""
echo "📦 Step 4: Creating GitHub repository..."

if command -v gh &> /dev/null; then
  echo "   Using GitHub CLI (gh)..."
  if gh repo create "$REPO_NAME" --public --description "$REPO_DESC" --source=. --remote=origin 2>/dev/null || true; then
    echo "✅ Repository created: https://github.com/$(gh api user --jq .login)/$REPO_NAME"
  else
    echo "⚠️ Repository may already exist. Adding remote..."
    GITHUB_USER=$(gh api user --jq .login)
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || true
  fi
elif [ -n "$GITHUB_TOKEN" ]; then
  echo "   Using GITHUB_TOKEN..."
  GITHUB_USER=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -o '"login": "[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$GITHUB_USER" ]; then
    echo "❌ Could not determine GitHub username from token"
    exit 1
  fi

  # Create repo via API
  curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESC\",\"private\":false}" \
    https://api.github.com/user/repos > /dev/null

  git remote add origin "https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || true
  echo "✅ Repository created: https://github.com/$GITHUB_USER/$REPO_NAME"
else
  echo "⚠️ Neither GitHub CLI (gh) nor GITHUB_TOKEN found."
  echo "   Please create the repository manually on GitHub:"
  echo "   https://github.com/new"
  echo "   Then add the remote:"
  read -p "   Enter your GitHub username: " GITHUB_USER
  git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || true
  echo "✅ Remote added"
fi

# Step 5: Push to GitHub
echo ""
echo "📦 Step 5: Pushing to GitHub..."
git push -u origin "$BRANCH" || {
  echo ""
  echo "❌ Push failed. If the repo exists and has content, try:"
  echo "   git push -u origin $BRANCH --force"
  exit 1
}

echo ""
echo "🎉 Success! Your project is now on GitHub!"
echo "   Repository: $(git remote get-url origin)"
echo ""
echo "Next steps:"
echo "  1. Update the repository URLs in README.md, CONTRIBUTING.md, etc."
echo "  2. Enable GitHub Discussions in repo settings"
echo "  3. Add topic tags: api-client, tauri, svelte, rust, postman-alternative"
echo "  4. Create a GitHub Release with the v0.1.0 tag"
