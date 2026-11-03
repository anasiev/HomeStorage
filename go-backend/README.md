# Home Inventory - Go Backend

Standalone, lightweight, self-contained web server and REST API written in pure Go (`net/http`) without external DBMS dependencies.

## Key Features
- **Zero External DBMS**: Backed by `db.json` with thread-safe `sync.RWMutex` file persistence.
- **Fast $O(1)$ Photo Security**: Photos are organized in `uploads/<location>/` with `[item_id]_...` naming to prevent collision and data loss.
- **Embedded Web Frontend**: Serves production build files from `./web/`.
- **System Service Ready**: Run as a Windows Service or Linux systemd service (see `/scripts/`).

## Quick Start
```bash
# Run with Go
go run main.go

# Compile standalone Windows binary
go build -ldflags="-s -w" -o inventory.exe main.go

# Compile standalone Linux binary
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o inventory-linux main.go
```

## Backup
Always preserve `db.json` and the `uploads/` directory to backup your inventory.
