#!/usr/bin/env bash
# ==============================================================================
# Create Ready-to-Run Portable Deployment Folder for Linux
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
PORTABLE_DIR="${ROOT_DIR}/portable_inventory_linux"

echo "=== Creating Portable Linux Folder with binary and web/ interface ==="

mkdir -p "${PORTABLE_DIR}"

# 1. Copy web folder
rm -rf "${PORTABLE_DIR}/web"
if [ -d "${ROOT_DIR}/go-backend/web" ]; then
    cp -r "${ROOT_DIR}/go-backend/web" "${PORTABLE_DIR}/web"
elif [ -d "${ROOT_DIR}/dist" ]; then
    cp -r "${ROOT_DIR}/dist" "${PORTABLE_DIR}/web"
fi

# 2. Copy or compile binary
if [ -f "${ROOT_DIR}/go-backend/inventory-linux" ]; then
    cp "${ROOT_DIR}/go-backend/inventory-linux" "${PORTABLE_DIR}/inventory-linux"
elif command -v go &> /dev/null; then
    echo "Compiling inventory-linux with Go..."
    (cd "${ROOT_DIR}/go-backend" && go build -ldflags="-s -w" -o "${PORTABLE_DIR}/inventory-linux" main.go)
fi

if [ -f "${PORTABLE_DIR}/inventory-linux" ]; then
    chmod +x "${PORTABLE_DIR}/inventory-linux"
fi

# 3. Create start script
cat <<'EOF' > "${PORTABLE_DIR}/start.sh"
#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"
echo "Starting Home Inventory Server on http://localhost:8080..."
./inventory-linux
EOF
chmod +x "${PORTABLE_DIR}/start.sh"

echo "=== Portable folder created at: ${PORTABLE_DIR} ==="
