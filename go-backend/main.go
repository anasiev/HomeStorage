// Main entry point for standalone local inventory web server in pure Go.
// Stack: Go (Golang) net/http, no external DBMS, storage in db.json file, photos in uploads/ folder.
package main

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"home-inventory/handlers"
	"home-inventory/storage"
)

//go:embed all:web
var embeddedWebFS embed.FS

// corsMiddleware adds CORS headers for seamless operation across local networks.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func determineBaseDir() string {
	// If running compiled executable on Windows / Linux
	execPath, err := os.Executable()
	if err == nil {
		execDir := filepath.Dir(execPath)
		// Check that this is not a temporary go run build directory (go-build)
		isTemp := strings.Contains(execPath, "go-build") ||
			strings.Contains(execPath, "AppData\\Local\\Temp") ||
			strings.Contains(execPath, "AppData/Local/Temp") ||
			strings.Contains(execPath, "/tmp/")
		if !isTemp {
			// If web folder or db.json exists next to the binary, use binary directory
			if _, err := os.Stat(filepath.Join(execDir, "web")); err == nil {
				return execDir
			}
			if _, err := os.Stat(filepath.Join(execDir, "db.json")); err == nil {
				return execDir
			}
			return execDir
		}
	}

	workDir, err := os.Getwd()
	if err != nil {
		return "."
	}
	return workDir
}

func findWebDir(baseDir string) (string, []string, bool) {
	candidates := []string{
		filepath.Join(baseDir, "web"),
		filepath.Join(baseDir, "go-backend", "web"),
		filepath.Join(".", "web"),
		filepath.Join(".", "go-backend", "web"),
		filepath.Join(baseDir, "dist"),
		filepath.Join(".", "dist"),
	}

	for _, cand := range candidates {
		indexPath := filepath.Join(cand, "index.html")
		if st, err := os.Stat(indexPath); err == nil && !st.IsDir() {
			abs, _ := filepath.Abs(cand)
			return abs, candidates, true
		}
	}

	primaryWeb, _ := filepath.Abs(filepath.Join(baseDir, "web"))
	return primaryWeb, candidates, false
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	baseDir := determineBaseDir()

	// Automatic multi-path detection of web frontend directory
	webDir, searchedPaths, webFound := findWebDir(baseDir)

	// Directory for uploaded photos
	uploadsDir := filepath.Join(baseDir, "uploads")
	if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
		altUploads := filepath.Join(baseDir, "go-backend", "uploads")
		if _, err := os.Stat(altUploads); err == nil {
			uploadsDir = altUploads
		}
	}
	_ = os.MkdirAll(uploadsDir, 0755)

	// Database snapshot file db.json
	dbPath := filepath.Join(baseDir, "db.json")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		altDb := filepath.Join(baseDir, "go-backend", "db.json")
		if _, err := os.Stat(altDb); err == nil {
			dbPath = altDb
		}
	}

	absDbPath, _ := filepath.Abs(dbPath)
	absUploadsDir, _ := filepath.Abs(uploadsDir)

	log.Printf("======================================================")
	log.Printf("Home Inventory & Hierarchical Storage System")
	log.Printf("Stack: Go (Golang), net/http standard library, local db.json")
	log.Printf("Working directory:  %s", baseDir)
	log.Printf("Database file:      %s", absDbPath)
	log.Printf("Uploads directory:  %s", absUploadsDir)
	if webFound {
		log.Printf("Frontend directory: %s [FOUND ON DISK]", webDir)
	} else {
		log.Printf("Frontend directory: %s [NOT FOUND ON DISK]", webDir)
	}
	log.Printf("======================================================")

	// Initialize database storage
	store, err := storage.NewStorage(dbPath, uploadsDir)
	if err != nil {
		log.Fatalf("Database initialization error (%s): %v. Ensure the process has write permissions for this directory!", absDbPath, err)
	}

	api := handlers.NewAPIHandler(store, uploadsDir)

	mux := http.NewServeMux()

	// 1. Items endpoints
	mux.HandleFunc("/api/items", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			api.HandleGetItems(w, r)
		case http.MethodPost:
			api.HandleCreateItem(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/items/move", api.HandleMoveItems)

	mux.HandleFunc("/api/items/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			api.HandleUpdateItem(w, r)
		case http.MethodDelete:
			api.HandleDeleteItem(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// 2. Storage locations endpoints
	mux.HandleFunc("/api/locations", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			api.HandleGetLocations(w, r)
		case http.MethodPost:
			api.HandleCreateLocation(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/locations/move", api.HandleMoveLocation)

	mux.HandleFunc("/api/locations/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			api.HandleUpdateLocation(w, r)
		case http.MethodDelete:
			api.HandleDeleteLocation(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// 3. Category tree endpoints
	mux.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			api.HandleGetCategories(w, r)
		case http.MethodPost:
			api.HandleCreateCategory(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/categories/move", api.HandleMoveCategory)

	mux.HandleFunc("/api/categories/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			api.HandleUpdateCategory(w, r)
		case http.MethodDelete:
			api.HandleDeleteCategory(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// 4. Photo upload and deletion
	mux.HandleFunc("/api/upload", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			api.HandleUploadPhoto(w, r)
		case http.MethodDelete:
			api.HandleDeletePhoto(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	// 5. Database import and export
	mux.HandleFunc("/api/database/import", api.HandleImportDatabase)
	mux.HandleFunc("/api/database/export", api.HandleExportDatabase)

	// Serve uploaded images from uploads directory
	fsUploads := http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir)))
	mux.Handle("/uploads/", fsUploads)

	// 6. Serve static web frontend (External web/ folder OR embedded assets inside binary)
	setupStaticFrontend(mux, webDir, searchedPaths, embeddedWebFS)

	addr := ":" + port
	log.Printf("Server listening on http://0.0.0.0%s", addr)
	log.Printf("Local network access: http://<your_local_ip>%s", addr)

	if err := http.ListenAndServe(addr, corsMiddleware(mux)); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}

// setupStaticFrontend configures static web file serving with SPA client-side routing fallback.
// Priority 1: External web/ directory on disk (if it exists alongside binary or in working dir)
// Priority 2: Embedded filesystem inside executable via go:embed (enables single-file distribution)
// Priority 3: Clear visual guide explaining how to copy the web/ folder
func setupStaticFrontend(mux *http.ServeMux, externalWebDir string, searchedPaths []string, embeddedFS embed.FS) {
	var fileSystem http.FileSystem
	var fileExists func(path string) bool
	var readIndexHTML func() ([]byte, error)
	sourceDesc := "none"

	// 1. Check if external web directory exists and contains index.html
	if info, err := os.Stat(externalWebDir); err == nil && info.IsDir() {
		indexPath := filepath.Join(externalWebDir, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			sourceDesc = fmt.Sprintf("External directory on disk (%s)", externalWebDir)
			fileSystem = http.Dir(externalWebDir)
			fileExists = func(p string) bool {
				full := filepath.Join(externalWebDir, filepath.FromSlash(p))
				st, err := os.Stat(full)
				return err == nil && !st.IsDir()
			}
			readIndexHTML = func() ([]byte, error) {
				return os.ReadFile(indexPath)
			}
		}
	}

	// 2. Fallback to embedded web assets compiled directly into the binary
	if fileSystem == nil {
		subFS, err := fs.Sub(embeddedFS, "web")
		if err == nil {
			if f, err := subFS.Open("index.html"); err == nil {
				_ = f.Close()
				sourceDesc = "Embedded inside binary (100% standalone distribution)"
				fileSystem = http.FS(subFS)
				fileExists = func(p string) bool {
					clean := filepath.ToSlash(filepath.Clean(p))
					f, err := subFS.Open(clean)
					if err != nil {
						return false
					}
					st, err := f.Stat()
					_ = f.Close()
					return err == nil && !st.IsDir()
				}
				readIndexHTML = func() ([]byte, error) {
					f, err := subFS.Open("index.html")
					if err != nil {
						return nil, err
					}
					defer f.Close()
					return io.ReadAll(f)
				}
			}
		}
	}

	log.Printf("Frontend UI source: %s", sourceDesc)

	if fileSystem != nil {
		fileServer := http.FileServer(fileSystem)
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}

			cleanPath := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
			if cleanPath == "" || cleanPath == "." {
				cleanPath = "index.html"
			}

			// If the requested static file exists (e.g., .js, .css, .jpg), serve it directly
			if fileExists(cleanPath) {
				fileServer.ServeHTTP(w, r)
				return
			}

			// SPA client-side routing fallback: serve index.html for virtual routes
			data, err := readIndexHTML()
			if err == nil {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(data)
				return
			}

			fileServer.ServeHTTP(w, r)
		})
	} else {
		// Helpful visual instruction page if web/ folder is missing
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			pathListHTML := ""
			for _, p := range searchedPaths {
				pathListHTML += fmt.Sprintf("<li><code>%s</code></li>", p)
			}

			fmt.Fprintf(w, `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Требуется папка web / Web Folder Required</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
    .card { max-width: 720px; width: 100%; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #f59e0b; font-size: 20px; margin-top: 0; display: flex; align-items: center; gap: 10px; }
    p { line-height: 1.6; color: #cbd5e1; font-size: 14px; }
    .tree { background: #090d16; padding: 18px; border-radius: 10px; font-family: monospace; font-size: 13px; color: #38bdf8; border: 1px solid #334155; margin: 16px 0; line-height: 1.5; }
    .badge { display: inline-block; background: #059669; color: white; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
    .warn { color: #fbbf24; font-weight: bold; }
    .btn { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; margin-top: 15px; font-size: 14px; cursor: pointer; }
    .btn:hover { background: #2563eb; }
    ul { margin: 8px 0; padding-left: 20px; color: #94a3b8; font-size: 12px; }
    code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚠️ Не найдена папка с веб-интерфейсом (web)</h1>
    <p>Go-сервер <strong>inventory.exe</strong> успешно запущен и работает на порту <strong>:8080</strong>, но для отображения графического интерфейса рядом с <code>inventory.exe</code> необходимо перенести папку <strong>web</strong>.</p>
    
    <p class="warn">📁 Требуемая структура папки для работы:</p>
    <div class="tree">
      Ваша_папка_склада/<br>
      ├── <strong>inventory.exe</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#94a3b8;">(сервер)</span><br>
      ├── <strong>web/</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#4ade80; font-weight:bold;">&lt;-- СКОПИРУЙТЕ СЮДА ЭТУ ПАПКУ ИЗ go-backend/web!</span><br>
      │&nbsp;&nbsp; ├── index.html<br>
      │&nbsp;&nbsp; ├── assets/<br>
      │&nbsp;&nbsp; └── sample-photos/<br>
      ├── db.json &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#94a3b8;">(база данных, создается автоматически)</span><br>
      └── uploads/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#94a3b8;">(фотографии вещей, создается автоматически)</span>
    </div>

    <p><strong>Что сделать прямо сейчас:</strong></p>
    <ol style="font-size: 14px; color: #e2e8f0; line-height: 1.8;">
      <li>Скопируйте папку <code>go-backend/web</code> (переименовав в <code>web</code> или оставив <code>go-backend/web</code>) в ту же папку, где запущен <code>inventory.exe</code>.</li>
      <li>Обновите эту страницу в браузере (нажмите <strong>F5</strong>).</li>
    </ol>
    
    <hr style="border:0; border-top:1px solid #334155; margin: 24px 0;">
    
    <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Проверенные серверные пути:</p>
    <ul>%s</ul>
    <p style="font-size: 12px; color: #64748b;">
      Статус REST API: <span class="badge">ONLINE (200 OK)</span>
    </p>
  </div>
</body>
</html>`, pathListHTML)
		})
	}
}


