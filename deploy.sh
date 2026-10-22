#!/bin/bash
set -euo pipefail

aws configure list
aws sts get-caller-identity

APP_IMAGE="${APP_IMAGE:?APP_IMAGE is required}"
ECR_URI="${ECR_URI:?ECR_URI is required}"
AWS_REGION="${AWS_REGION:?AWS_REGION is required}"
REPO="/home/ubuntu/sauero"

echo "📁 Repo path: $REPO"
echo "🐳 Image: $APP_IMAGE"

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
	| docker login \
		--username AWS \
		--password-stdin "$(echo "$ECR_URI" | cut -d'/' -f1)"

echo "📥 Pulling image..."
docker pull "$APP_IMAGE"

git config --global --add safe.directory "$REPO"
cd "$REPO"

echo "🔄 Syncing compose/config from origin/master..."
git fetch origin
git checkout master
git reset --hard origin/master

echo "🚀 Starting container from ECR image..."
export APP_IMAGE
docker compose up -d --no-build --force-recreate

echo "🧹 Pruning unused images..."
docker image prune -af

echo "✅ Deployment complete."
