// Package handlers contains HTTP REST API handlers using the Go standard library net/http.
package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"home-inventory/models"
	"home-inventory/storage"
)

// APIHandler coordinates access to persistent storage and file uploads.
type APIHandler struct {
	storage   *storage.Storage
	uploadDir string
}

// NewAPIHandler initializes the API handler.
func NewAPIHandler(s *storage.Storage, uploadDir string) *APIHandler {
	_ = os.MkdirAll(uploadDir, 0755)
	return &APIHandler{
		storage:   s,
		uploadDir: uploadDir,
	}
}

// writeJSON writes a JSON response with the given HTTP status code.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// writeError writes a structured JSON error response.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// HandleGetItems returns the list of inventory items or search results.
// GET /api/items?q=query&location_id=xxx
func (h *APIHandler) HandleGetItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	q := r.URL.Query().Get("q")
	locID := r.URL.Query().Get("location_id")

	items := h.storage.SearchItems(q, locID)
	writeJSON(w, http.StatusOK, items)
}

// HandleCreateItem creates a new inventory item card.
// POST /api/items
func (h *APIHandler) HandleCreateItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var item models.InventoryItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if item.Name == "" {
		writeError(w, http.StatusBadRequest, "Field 'name' is required")
		return
	}
	if item.LocationID == "" {
		writeError(w, http.StatusBadRequest, "Field 'location_id' is required")
		return
	}

	if item.ID == "" {
		item.ID = generateUUID("item")
	}

	created, err := h.storage.AddItem(item)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

// HandleUpdateItem updates existing inventory item details.
// PUT /api/items/{id}
func (h *APIHandler) HandleUpdateItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "Item ID is required")
		return
	}
	itemID := parts[2]

	var item models.InventoryItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format: "+err.Error())
		return
	}
	item.ID = itemID

	if item.Name == "" {
		writeError(w, http.StatusBadRequest, "Field 'name' is required")
		return
	}
	if item.LocationID == "" {
		writeError(w, http.StatusBadRequest, "Field 'location_id' is required")
		return
	}

	updated, err := h.storage.UpdateItem(item)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

// HandleDeleteItem removes an inventory item by ID.
// DELETE /api/items/{id}
func (h *APIHandler) HandleDeleteItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "Item ID is required")
		return
	}
	itemID := parts[2]

	if err := h.storage.DeleteItem(itemID); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": itemID})
}

// HandleMoveItems relocates a batch of items to a new location.
// POST /api/items/move
func (h *APIHandler) HandleMoveItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		ItemIDs       []string `json:"item_ids"`
		NewLocationID string   `json:"new_location_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if len(req.ItemIDs) == 0 || req.NewLocationID == "" {
		writeError(w, http.StatusBadRequest, "Fields 'item_ids' and 'new_location_id' are required")
		return
	}

	if err := h.storage.MoveItems(req.ItemIDs, req.NewLocationID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "moved"})
}

// HandleGetLocations returns all nodes in the storage hierarchy.
// GET /api/locations
func (h *APIHandler) HandleGetLocations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	locations := h.storage.GetLocations()
	writeJSON(w, http.StatusOK, locations)
}

// HandleCreateLocation creates a new location node in the hierarchy.
// POST /api/locations
func (h *APIHandler) HandleCreateLocation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var node models.LocationNode
	if err := json.NewDecoder(r.Body).Decode(&node); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if node.Name == "" {
		writeError(w, http.StatusBadRequest, "Location name is required")
		return
	}
	if node.ID == "" {
		node.ID = generateUUID("loc")
	}

	created, err := h.storage.AddLocation(node)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

// HandleUpdateLocation updates storage location properties and codes.
// PUT /api/locations/{id}
func (h *APIHandler) HandleUpdateLocation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "Location ID is required")
		return
	}
	locID := parts[2]

	var node models.LocationNode
	if err := json.NewDecoder(r.Body).Decode(&node); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format: "+err.Error())
		return
	}
	node.ID = locID

	if node.Name == "" {
		writeError(w, http.StatusBadRequest, "Location name is required")
		return
	}

	updated, err := h.storage.UpdateLocation(node)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

// HandleDeleteLocation removes a location node if and only if it contains no items (safe deletion protection).
// DELETE /api/locations/{id}
func (h *APIHandler) HandleDeleteLocation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "Location ID is required")
		return
	}
	locID := parts[2]

	if err := h.storage.DeleteLocation(locID); err != nil {
		// Contains items or error: return 400 Bad Request
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": locID})
}

// HandleMoveLocation relocates a container/shelf node to a new parent in the hierarchy.
// POST /api/locations/move
func (h *APIHandler) HandleMoveLocation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		LocationID  string  `json:"location_id"`
		NewParentID *string `json:"new_parent_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if req.LocationID == "" {
		writeError(w, http.StatusBadRequest, "Field 'location_id' is required")
		return
	}

	if err := h.storage.MoveLocation(req.LocationID, req.NewParentID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "location_moved"})
}

// HandleGetCategories returns all categories.
// GET /api/categories
func (h *APIHandler) HandleGetCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	categories := h.storage.GetCategories()
	writeJSON(w, http.StatusOK, categories)
}

// HandleCreateCategory creates a new category node.
// POST /api/categories
func (h *APIHandler) HandleCreateCategory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var node models.CategoryNode
	if err := json.NewDecoder(r.Body).Decode(&node); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}
	if node.Name == "" {
		writeError(w, http.StatusBadRequest, "Category name is required")
		return
	}
	if node.ID == "" {
		node.ID = generateUUID("cat")
	}
	created, err := h.storage.AddCategory(node)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// HandleUpdateCategory updates or renames an existing category.
// PUT /api/categories/{id}
func (h *APIHandler) HandleUpdateCategory(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "Category ID is required")
		return
	}
	var node models.CategoryNode
	if err := json.NewDecoder(r.Body).Decode(&node); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}
	node.ID = parts[2]
	updated, err := h.storage.UpdateCategory(node)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// HandleDeleteCategory deletes a category.
// DELETE /api/categories/{id}
func (h *APIHandler) HandleDeleteCategory(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		writeError(w, http.StatusBadRequest, "Category ID is required")
		return
	}
	catID := parts[2]
	if err := h.storage.DeleteCategory(catID, true); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": catID})
}

// HandleMoveCategory relocates a category under a different parent.
// POST /api/categories/move
func (h *APIHandler) HandleMoveCategory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CategoryID  string  `json:"category_id"`
		NewParentID *string `json:"new_parent_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}
	if req.CategoryID == "" {
		writeError(w, http.StatusBadRequest, "Field 'category_id' is required")
		return
	}
	if err := h.storage.MoveCategory(req.CategoryID, req.NewParentID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "category_moved"})
}

// HandleUploadPhoto saves an uploaded photo to the corresponding location subfolder and returns the relative path.
// POST /api/upload
func (h *APIHandler) HandleUploadPhoto(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// 15 MB maximum photo payload
	if err := r.ParseMultipartForm(15 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "Form parsing error: "+err.Error())
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Photo file not found: "+err.Error())
		return
	}
	defer file.Close()

	itemID := r.FormValue("item_id")
	locID := r.FormValue("location_id")
	locName := r.FormValue("location_name")

	folderName := "unassigned"
	if locID != "" {
		folderName = h.storage.GetLocationFolderName(locID)
	} else if locName != "" {
		folderName = storage.CleanFolderName(locName)
	}

	targetDir := filepath.Join(h.uploadDir, folderName)
	_ = os.MkdirAll(targetDir, 0755)

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".jpg"
	}

	// Filename incorporates item_id prefix: [item_id]_[timestamp]_[rand].[ext]
	filePrefix := "photo"
	if itemID != "" {
		filePrefix = storage.CleanFolderName(itemID)
	}
	fileName := fmt.Sprintf("%s_%d_%s%s", filePrefix, time.Now().UnixNano(), generateRandomHex(4), ext)
	dstPath := filepath.Join(targetDir, fileName)

	out, err := os.Create(dstPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create file on disk: "+err.Error())
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to write file contents: "+err.Error())
		return
	}

	// Return RELATIVE path with forward slashes: "uploads/folder/filename.jpg"
	relativePath := filepath.ToSlash(filepath.Join("uploads", folderName, fileName))
	writeJSON(w, http.StatusOK, map[string]string{
		"path":     relativePath,
		"filename": fileName,
		"folder":   folderName,
	})
}

// HandleDeletePhoto removes a photo file from the uploads directory with item_id verification.
// DELETE /api/upload
func (h *APIHandler) HandleDeletePhoto(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete && r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Path   string `json:"path"`
		ItemID string `json:"item_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	if req.Path == "" {
		req.Path = r.URL.Query().Get("path")
	}
	if req.ItemID == "" {
		req.ItemID = r.URL.Query().Get("item_id")
	}

	if req.Path == "" {
		writeError(w, http.StatusBadRequest, "Photo path is required")
		return
	}

	h.storage.DeletePhotoFile(req.Path, req.ItemID)
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "deleted",
		"path":   req.Path,
	})
}

func generateUUID(prefix string) string {
	return fmt.Sprintf("%s-%d-%s", prefix, time.Now().Unix(), generateRandomHex(3))
}

func generateRandomHex(n int) string {
	bytes := make([]byte, n)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

