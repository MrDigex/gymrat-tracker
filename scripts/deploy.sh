#!/bin/bash
# Deploy GymRat Tracker to production (gymrat-tracker.com).
#
# The server is too small to build the frontend, so this script:
#   1. checks the working tree is clean and pushed to origin/main,
#   2. builds the frontend locally,
#   3. puts the site in maintenance mode and uploads public/build,
#   4. runs ~/deploy-gymrat.sh on the server (pull, composer, migrate, cache, up).
#
# Usage: scripts/deploy.sh [--force]
set -euo pipefail

SERVER=${DEPLOY_SERVER:-remi@69.55.54.64}
APP=gymrat-tracker

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
    echo "Commit or stash your changes before deploying." >&2
    exit 1
fi

git fetch -q origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "HEAD is not origin/main. Push (or pull) first so the server deploys this exact commit." >&2
    exit 1
fi

echo "==> Building frontend for $(git rev-parse --short HEAD)"
rm -f public/hot
npm run build >/dev/null

echo "==> Uploading public/build"
ssh "$SERVER" "cd $APP && php artisan down --retry=30 >/dev/null"
rsync -az --delete public/build/ "$SERVER:$APP/public/build/"

echo "==> Deploying on the server"
ssh "$SERVER" "~/deploy-gymrat.sh ${1:-}"
