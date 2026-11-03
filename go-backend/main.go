// Main entry point for standalone local inventory web server in pure Go.
// Stack: Go (Golang) net/http, no external DBMS, storage in db.json file, photos in uploads/ folder.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"home-inventory/handlers"
	"home-inventory/storage"
)

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

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	baseDir := determineBaseDir()

	// Automatic detection of web frontend directory
	webDir := filepath.Join(baseDir, "web")
	if _, err := os.Stat(webDir); os.IsNotExist(err) {
		altWeb := filepath.Join(baseDir, "go-backend", "web")
		if _, err := os.Stat(altWeb); err == nil {
			webDir = altWeb
		}
	}

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
	log.Printf("Frontend directory: %s", webDir)
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

	// Serve uploaded images from uploads directory
	fsUploads := http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir)))
	mux.Handle("/uploads/", fsUploads)

	// 5. Serve static web frontend from web/ directory
	if _, err := os.Stat(webDir); err == nil {
		fsWeb := http.FileServer(http.Dir(webDir))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}
			cleanPath := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
			targetFile := filepath.Join(webDir, cleanPath)
			if info, err := os.Stat(targetFile); err != nil || info.IsDir() {
				indexPath := filepath.Join(webDir, "index.html")
				if _, err := os.Stat(indexPath); err == nil {
					http.ServeFile(w, r, indexPath)
					return
				}
			}
			fsWeb.ServeHTTP(w, r)
		})
	} else {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			fmt.Fprintf(w, `<!DOCTYPE html>
<html>
<head><title>Home Inventory (Go Server)</title></head>
<body style="font-family:sans-serif;padding:40px;line-height:1.6;max-width:800px;margin:auto;">
  <h2>Home Inventory Server Running</h2>
  <p>Backend on pure <code>net/http</code> is active. Available endpoints:</p>
  <ul>
    <li><code>GET /api/items</code> — Items list & live search (?q=...)</li>
    <li><code>GET /api/locations</code> — Location hierarchy tree</li>
    <li><code>POST /api/upload</code> — Photo upload</li>
  </ul>
</body>
</html>`)
		})
	}

	addr := ":" + port
	log.Printf("Server listening on http://0.0.0.0%s", addr)
	log.Printf("Local network access: http://<your_local_ip>%s", addr)

	if err := http.ListenAndServe(addr, corsMiddleware(mux)); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}

