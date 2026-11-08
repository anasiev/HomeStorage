# Home Inventory - Go Backend

Standalone, lightweight, self-contained web server and REST API written in pure Go (`net/http`) without external DBMS dependencies.

## Key Features
- **Zero External DBMS**: Backed by `db.json` with thread-safe `sync.RWMutex` file persistence.
- **Fast $O(1)$ Photo Security**: Photos are organized in `uploads/<location>/` with `[item_id]_...` naming to prevent collision and data loss.
- **Embedded Web Frontend (`//go:embed`)**: The entire compiled React frontend is baked directly into `inventory.exe`. The executable can be moved to any new folder and will run 100% standalone without requiring the `web/` folder.
- **Optional External Override**: If an external `web/` folder exists alongside `inventory.exe`, it will be used for easy customizations without recompiling.
- **System Service Ready**: Run as a Windows Service or Linux systemd service (see `/scripts/`).

## Quick Start
```bash
# 1. Build frontend assets (first time or after UI edits):
npm run build

# 2. Compile 100% standalone single-file Windows binary:
cd go-backend
go build -ldflags="-s -w" -o inventory.exe main.go

# 3. Compile 100% standalone Linux binary:
cd go-backend
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o inventory-linux main.go
```

Once compiled, you can copy just `inventory.exe` (or `inventory-linux`) to any folder or machine. It will automatically initialize `db.json` and the `uploads/` folder upon first launch.

## Backup
Always preserve `db.json` and the `uploads/` directory to backup your inventory.
