#!/usr/bin/env bash
# ==============================================================================
# Home Inventory - Quick Backup Script (Linux / macOS)
# Backs up db.json and the uploads/ directory to a timestamped archive.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
BACKUP_DIR="${ROOT_DIR}/backups"
TIMESTAMP="$(date +'%Y-%m-%d_%H-%M-%S')"
ARCHIVE_NAME="home_inventory_backup_${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"

# Locate db.json and uploads directory
DB_FILE=""
if [ -f "${ROOT_DIR}/db.json" ]; then
    DB_FILE="${ROOT_DIR}/db.json"
elif [ -f "${ROOT_DIR}/go-backend/db.json" ]; then
    DB_FILE="${ROOT_DIR}/go-backend/db.json"
fi

UPLOADS_DIR=""
if [ -d "${ROOT_DIR}/uploads" ]; then
    UPLOADS_DIR="${ROOT_DIR}/uploads"
elif [ -d "${ROOT_DIR}/go-backend/uploads" ]; then
    UPLOADS_DIR="${ROOT_DIR}/go-backend/uploads"
fi

if [ -z "${DB_FILE}" ]; then
    echo "ERROR: db.json file not found!" >&2
    exit 1
fi

echo "Creating backup..."
echo "  - Database: ${DB_FILE}"
echo "  - Photos:   ${UPLOADS_DIR:-None}"

tar -czf "${BACKUP_DIR}/${ARCHIVE_NAME}" \
    -C "$(dirname "${DB_FILE}")" "$(basename "${DB_FILE}")" \
    ${UPLOADS_DIR:+-C "$(dirname "${UPLOADS_DIR}")" "$(basename "${UPLOADS_DIR}")"}

echo "SUCCESS! Backup saved to: ${BACKUP_DIR}/${ARCHIVE_NAME}"
