#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="../backups/backup_$TIMESTAMP"
PROJECT_DIR=$(pwd)
DB_URI=$MONGODB_URI

# Create backup directory
mkdir -p "$BACKUP_DIR/files"
mkdir -p "$BACKUP_DIR/db"

echo "🚀 Starting backup process..."
echo "📂 Backup directory: $BACKUP_DIR"

# 1. Backup Files
echo "📦 Backing up project files..."
rsync -av --progress "$PROJECT_DIR/" "$BACKUP_DIR/files/" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'backups' \
    --exclude '.env' \
    --exclude 'scripts/backups'

# Copy .env separately (optional, maybe safer to exclude or encrypt, but for now we copy it for full restore capability)
# cp .env "$BACKUP_DIR/files/.env" 
# NOTE: Keeping .env out of backup for security, or handle with care. 
# Let's include it but warn.
cp .env "$BACKUP_DIR/files/.env"

# 2. Backup Database
if [ -n "$DB_URI" ]; then
    echo "💾 Backing up MongoDB..."
    mongodump --uri="$DB_URI" --out="$BACKUP_DIR/db"
else
    echo "⚠️ MONGODB_URI not found in .env, skipping database backup."
fi

# 3. Create Archive
echo "compressing backup..."
tar -czf "$BACKUP_DIR.tar.gz" -C "../backups" "backup_$TIMESTAMP"

# Cleanup uncompressed folder
rm -rf "$BACKUP_DIR"

echo "✅ Backup completed successfully!"
echo "📁 Archive: $BACKUP_DIR.tar.gz"
