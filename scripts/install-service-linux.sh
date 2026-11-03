#!/usr/bin/env bash
# ==============================================================================
# Linux systemd Service Installer for Home Inventory
# Run with root privileges (sudo bash install-service-linux.sh)
# ==============================================================================

set -euo pipefail

INSTALL_DIR="/opt/home-inventory"
SERVICE_NAME="home-inventory"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "=== Installing Home Inventory as a Linux systemd Service ==="

# Check for root privileges
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: This script must be run with root privileges (e.g. sudo bash $0)" >&2
    exit 1
fi

# Create target directory
mkdir -p "${INSTALL_DIR}"
mkdir -p "${INSTALL_DIR}/uploads"

# Determine script root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"

# Compile or copy binary
if [ -f "${PROJECT_ROOT}/go-backend/inventory-linux" ]; then
    cp "${PROJECT_ROOT}/go-backend/inventory-linux" "${INSTALL_DIR}/inventory-linux"
elif command -v go &> /dev/null; then
    echo "Compiling Linux binary with Go..."
    (cd "${PROJECT_ROOT}/go-backend" && go build -ldflags="-s -w" -o "${INSTALL_DIR}/inventory-linux" main.go)
else
    echo "WARNING: Pre-compiled binary not found and 'go' is not installed."
    echo "Please copy your compiled 'inventory-linux' binary into ${INSTALL_DIR}/inventory-linux"
fi

# Copy web assets if present
if [ -d "${PROJECT_ROOT}/go-backend/web" ]; then
    cp -r "${PROJECT_ROOT}/go-backend/web" "${INSTALL_DIR}/web"
elif [ -d "${PROJECT_ROOT}/dist" ]; then
    cp -r "${PROJECT_ROOT}/dist" "${INSTALL_DIR}/web"
fi

# Ensure permissions
chmod +x "${INSTALL_DIR}/inventory-linux" 2>/dev/null || true
chmod 755 "${INSTALL_DIR}"
chmod 777 "${INSTALL_DIR}/uploads"

# Copy and configure service file
cat <<EOF > "${SERVICE_FILE}"
[Unit]
Description=Home Inventory & Storage Management Service
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SUDO_USER:-root}
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/inventory-linux
Restart=always
RestartSec=5s
Environment="PORT=8080"
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Reload and enable
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

echo "=== Service successfully installed and started! ==="
echo "Status check:  systemctl status ${SERVICE_NAME}"
echo "View logs:     journalctl -u ${SERVICE_NAME} -f"
echo "Open web app:  http://localhost:8080"
