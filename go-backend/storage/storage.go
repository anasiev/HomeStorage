// Package storage implements a self-contained file database without external DBMS (pure Go).
// Supports concurrent access via sync.RWMutex and persistence to db.json.
package storage

import (
	"crypto/rand" 
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"home-inventory/models"
)

// Storage represents thread-safe database storage backed by a JSON file.
type Storage struct {
	mu         sync.RWMutex
	filePath   string
	uploadDir  string
	locations  []models.LocationNode
	categories []models.CategoryNode
	items      []models.InventoryItem
}

// NewStorage initializes or loads an existing database from filePath.
func NewStorage(filePath string, uploadDir string) (*Storage, error) {
	s := &Storage{
		filePath:  filePath,
		uploadDir: uploadDir,
	}

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		// Initialize with default sample seed data
		s.seedInitialData()
		if err := s.saveToFileLocked(); err != nil {
			return nil, fmt.Errorf("failed to create initial database: %w", err)
		}
	} else {
		if err := s.loadFromFile(); err != nil {
			return nil, fmt.Errorf("failed to read database file: %w", err)
		}
	}

	return s, nil
}

// loadFromFile loads the database state from the JSON snapshot file.
func (s *Storage) loadFromFile() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}

	var snapshot models.DatabaseSnapshot
	if err := json.Unmarshal(data, &snapshot); err != nil {
		return err
	}

	// Deduplicate items by ID to prevent duplicates from legacy versions
	seenItems := make(map[string]bool)
	var uniqueItems []models.InventoryItem
	for _, it := range snapshot.Items {
		if it.ID != "" && !seenItems[it.ID] {
			seenItems[it.ID] = true
			uniqueItems = append(uniqueItems, it)
		}
	}

	seenLocs := make(map[string]bool)
	var uniqueLocs []models.LocationNode
	for _, l := range snapshot.Locations {
		if l.ID != "" && !seenLocs[l.ID] {
			seenLocs[l.ID] = true
			uniqueLocs = append(uniqueLocs, l)
		}
	}

	seenCats := make(map[string]bool)
	var uniqueCats []models.CategoryNode
	for _, c := range snapshot.Categories {
		if c.ID != "" && !seenCats[c.ID] {
			seenCats[c.ID] = true
			uniqueCats = append(uniqueCats, c)
		}
	}

	// If existing db.json has no categories, seed initial catalog categories
	if len(uniqueCats) == 0 {
		pParts := "cat-parts"
		now := time.Now()
		uniqueCats = []models.CategoryNode{
			{ID: "cat-parts", Name: "Parts & Supplies", Color: "#0284c7", CreatedAt: &now, UpdatedAt: &now},
			{ID: "cat-parts-appliances", Name: "Home Appliances", ParentID: &pParts, Color: "#0284c7", CreatedAt: &now, UpdatedAt: &now},
			{ID: "cat-parts-auto", Name: "Auto Parts", ParentID: &pParts, Color: "#0284c7", CreatedAt: &now, UpdatedAt: &now},
			{ID: "cat-tools", Name: "Tools & Equipment", Color: "#d97706", CreatedAt: &now, UpdatedAt: &now},
			{ID: "cat-fasteners", Name: "Fasteners & Hardware", Color: "#4b5563", CreatedAt: &now, UpdatedAt: &now},
			{ID: "cat-collection", Name: "Collectibles & Vintage", Color: "#7c3aed", CreatedAt: &now, UpdatedAt: &now},
			{ID: "cat-cables", Name: "Electronics & Cables", Color: "#10b981", CreatedAt: &now, UpdatedAt: &now},
		}
	}

	s.locations = uniqueLocs
	s.categories = uniqueCats
	s.items = uniqueItems
	s.recalculateAllCodesLocked()
	return nil
}

// saveToFileLocked writes the current database state to the JSON file (call with lock held).
func (s *Storage) saveToFileLocked() error {
	snapshot := models.DatabaseSnapshot{
		Version:    "1.0.0",
		AppName:    "Home Inventory (Go Backend)",
		ExportedAt: time.Now(),
		Locations:  s.locations,
		Categories: s.categories,
		Items:      s.items,
	}

	data, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to serialize database snapshot: %w", err)
	}

	// Ensure parent directory exists
	dir := filepath.Dir(s.filePath)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("[ERROR] Failed to create directory %s: %v", dir, err)
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	// Clear potential read-only flag on Windows before rewriting
	if fi, err := os.Stat(s.filePath); err == nil && fi.Mode()&0200 == 0 {
		_ = os.Chmod(s.filePath, 0666)
	}

	// Write file atomically
	if err := os.WriteFile(s.filePath, data, 0644); err != nil {
		log.Printf("[ERROR WRITING db.json] %s: %v", s.filePath, err)
		return fmt.Errorf("failed to write db.json (%s): %w", s.filePath, err)
	}

	log.Printf("[DATABASE SAVED] %s: items=%d, locations=%d, categories=%d", s.filePath, len(s.items), len(s.locations), len(s.categories))
	return nil
}

// computeFullCodeLocked computes the label address in [Location]-[Furniture]-[Shelf]-[Box] format.
func (s *Storage) computeFullCodeLocked(nodeID string) string {
	var current *models.LocationNode
	for i := range s.locations {
		if s.locations[i].ID == nodeID {
			current = &s.locations[i]
			break
		}
	}
	if current == nil {
		return ""
	}

	var chain []string
	visited := make(map[string]bool)

	for current != nil && !visited[current.ID] {
		visited[current.ID] = true
		suffix := current.CodeSuffix
		if suffix == "" {
			suffix = strings.ToLower(string([]rune(current.Name)[:1]))
		}
		chain = append([]string{suffix}, chain...)

		if current.ParentID == nil {
			break
		}

		nextID := *current.ParentID
		current = nil
		for i := range s.locations {
			if s.locations[i].ID == nextID {
				current = &s.locations[i]
				break
			}
		}
	}

	return strings.Join(chain, "-")
}

// recalculateAllCodesLocked recomputes FullCode for all locations in the hierarchy.
func (s *Storage) recalculateAllCodesLocked() {
	for i := range s.locations {
		s.locations[i].FullCode = s.computeFullCodeLocked(s.locations[i].ID)
	}
}

// GetDescendantsIDsLocked returns slice of all descendant location IDs recursively.
func (s *Storage) GetDescendantsIDsLocked(parentID string) []string {
	var result []string
	queue := []string{parentID}

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]

		for _, loc := range s.locations {
			if loc.ParentID != nil && *loc.ParentID == curr {
				result = append(result, loc.ID)
				queue = append(queue, loc.ID)
			}
		}
	}
	return result
}

// --- CRUD operations for storage locations (Locations) ---

// GetLocations returns a copy of all locations.
func (s *Storage) GetLocations() []models.LocationNode {
	s.mu.RLock()
	defer s.mu.RUnlock()
	res := make([]models.LocationNode, len(s.locations))
	copy(res, s.locations)
	return res
}

// AddLocation adds a new location node to the hierarchy (or updates existing).
func (s *Storage) AddLocation(node models.LocationNode) (models.LocationNode, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for i := range s.locations {
		if s.locations[i].ID == node.ID {
			node.CreatedAt = s.locations[i].CreatedAt
			node.UpdatedAt = now
			s.locations[i] = node
			s.recalculateAllCodesLocked()
			if err := s.saveToFileLocked(); err != nil {
				return node, err
			}
			return node, nil
		}
	}

	node.CreatedAt = now
	node.UpdatedAt = now

	s.locations = append(s.locations, node)
	s.recalculateAllCodesLocked()

	for _, l := range s.locations {
		if l.ID == node.ID {
			node = l
			break
		}
	}

	if err := s.saveToFileLocked(); err != nil {
		return node, err
	}
	return node, nil
}

// UpdateLocation updates name, type or parameters of an existing location.
func (s *Storage) UpdateLocation(node models.LocationNode) (models.LocationNode, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	found := false
	now := time.Now()
	for i := range s.locations {
		if s.locations[i].ID == node.ID {
			node.CreatedAt = s.locations[i].CreatedAt
			node.UpdatedAt = now
			s.locations[i] = node
			found = true
			break
		}
	}

	if !found {
		return node, errors.New("storage location not found")
	}

	s.recalculateAllCodesLocked()
	for _, l := range s.locations {
		if l.ID == node.ID {
			node = l
			break
		}
	}

	if err := s.saveToFileLocked(); err != nil {
		return node, err
	}
	return node, nil
}

// MoveLocation relocates a storage node to a new parent (with cycle detection).
func (s *Storage) MoveLocation(locationID string, newParentID *string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if newParentID != nil {
		if *newParentID == locationID {
			return errors.New("location cannot be a parent of itself")
		}
		descendants := s.GetDescendantsIDsLocked(locationID)
		for _, d := range descendants {
			if d == *newParentID {
				return errors.New("cannot move location into its own child location")
			}
		}
	}

	found := false
	for i := range s.locations {
		if s.locations[i].ID == locationID {
			s.locations[i].ParentID = newParentID
			s.locations[i].UpdatedAt = time.Now()
			found = true
			break
		}
	}

	if !found {
		return errors.New("storage location not found")
	}

	s.recalculateAllCodesLocked()
	return s.saveToFileLocked()
}

// DeleteLocation removes a location with validation: cannot delete if items exist inside!
func (s *Storage) DeleteLocation(locationID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	descendants := s.GetDescendantsIDsLocked(locationID)
	allCheckIDs := append([]string{locationID}, descendants...)

	// Check if items are stored in this location or any sub-locations
	var foundItems []string
	for _, it := range s.items {
		for _, checkID := range allCheckIDs {
			if it.LocationID == checkID {
				foundItems = append(foundItems, it.Name)
				break
			}
		}
	}

	if len(foundItems) > 0 {
		return fmt.Errorf("cannot delete location: contains %d items (e.g.: %s)",
			len(foundItems), strings.Join(foundItems[:min(3, len(foundItems))], ", "))
	}

	// Remove node and its empty descendants
	toRemove := make(map[string]bool)
	for _, id := range allCheckIDs {
		toRemove[id] = true
	}

	var updated []models.LocationNode
	for _, loc := range s.locations {
		if !toRemove[loc.ID] {
			updated = append(updated, loc)
		}
	}
	s.locations = updated
	s.recalculateAllCodesLocked()

	return s.saveToFileLocked()
}

// --- CRUD operations for items (Items) ---

// GetItems returns all inventory items.
func (s *Storage) GetItems() []models.InventoryItem {
	s.mu.RLock()
	defer s.mu.RUnlock()
	res := make([]models.InventoryItem, len(s.items))
	copy(res, s.items)
	return res
}

// CleanFolderName creates a filesystem-safe folder name for Windows and Linux.
func CleanFolderName(name string) string {
	invalid := []string{"\\", "/", ":", "*", "?", "\"", "<", ">", "|", "\n", "\r", "\t"}
	res := name
	for _, ch := range invalid {
		res = strings.ReplaceAll(res, ch, "_")
	}
	res = strings.TrimSpace(res)
	res = strings.Trim(res, ".")
	if res == "" {
		res = "unassigned"
	}
	runes := []rune(res)
	if len(runes) > 60 {
		res = string(runes[:60])
	}
	return res
}

// GetLocationFolderName computes subfolder name under uploads/ based on code and name.
func (s *Storage) GetLocationFolderName(locationID string) string {
	for _, l := range s.locations {
		if l.ID == locationID {
			code := l.FullCode
			if code == "" {
				code = l.CodeSuffix
			}
			if code != "" && l.Name != "" {
				return CleanFolderName(fmt.Sprintf("%s_%s", code, l.Name))
			} else if l.Name != "" {
				return CleanFolderName(l.Name)
			} else if code != "" {
				return CleanFolderName(code)
			}
			return CleanFolderName(l.ID)
		}
	}
	return "unassigned"
}

// cleanEmptyDir removes an empty subfolder inside uploads if no files remain.
func cleanEmptyDir(dir string, stopDir string) {
	if dir == "" || stopDir == "" {
		return
	}
	cleanDir := filepath.Clean(dir)
	cleanStop := filepath.Clean(stopDir)
	if cleanDir == cleanStop || cleanDir == "." || len(cleanDir) <= len(cleanStop) {
		return
	}
	entries, err := os.ReadDir(cleanDir)
	if err == nil && len(entries) == 0 {
		_ = os.Remove(cleanDir)
	}
}

// DeletePhotoFile removes a photo file from disk (thread-safe).
// If itemID is specified, only files belonging to this item are deleted.
func (s *Storage) DeletePhotoFile(photoRelPath string, itemID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.DeletePhotoFileLocked(photoRelPath, itemID)
}

// DeletePhotoFileLocked removes a photo file from disk under mutex lock.
// Fast O(1) check using item ID prefix: prevents expensive iteration over entire database
// and guarantees photos of other items are never accidentally removed.
func (s *Storage) DeletePhotoFileLocked(photoRelPath string, itemID string) {
	if s.uploadDir == "" || photoRelPath == "" {
		return
	}
	cleanRel := filepath.ToSlash(filepath.Clean(strings.TrimPrefix(photoRelPath, "/")))
	if !strings.HasPrefix(cleanRel, "uploads") {
		return
	}

	fileName := filepath.Base(cleanRel)

	// Fast O(1) protection: if itemID is supplied, check file ownership
	if itemID != "" {
		cleanID := CleanFolderName(itemID)
		// If file is marked with another item's ID prefix, do not delete it
		if strings.HasPrefix(fileName, "item-") || strings.HasPrefix(fileName, "item_") {
			if !strings.HasPrefix(fileName, cleanID+"_") {
				log.Printf("[PROTECTION] Attempted to delete photo %s which does not belong to item %s. Aborted.", fileName, cleanID)
				return
			}
		}
	}

	subPath := strings.TrimPrefix(cleanRel, "uploads")
	subPath = strings.TrimPrefix(subPath, "/")
	subPath = filepath.FromSlash(subPath)

	fullPath := filepath.Join(s.uploadDir, subPath)
	if fi, err := os.Stat(fullPath); err == nil && !fi.IsDir() {
		_ = os.Remove(fullPath)
		parentDir := filepath.Dir(fullPath)
		cleanEmptyDir(parentDir, s.uploadDir)
	}
}

// moveItemPhotosLocked relocates physical photo files of an item into the target location subfolder.
// Each file is prefixed with the item ID [item_id]_[timestamp]_[rand].[ext] to prevent collisions and overwrites.
func (s *Storage) moveItemPhotosLocked(item *models.InventoryItem, targetLocationID string) {
	if s.uploadDir == "" || len(item.Photos) == 0 || targetLocationID == "" {
		return
	}
	targetFolderName := s.GetLocationFolderName(targetLocationID)
	targetDir := filepath.Join(s.uploadDir, targetFolderName)
	_ = os.MkdirAll(targetDir, 0755)

	cleanID := CleanFolderName(item.ID)

	for pIdx, photo := range item.Photos {
		clean := filepath.Clean(strings.TrimPrefix(photo, "/"))
		if !strings.HasPrefix(clean, "uploads") {
			continue
		}
		subPath := strings.TrimPrefix(clean, "uploads")
		subPath = strings.TrimPrefix(subPath, string(filepath.Separator))
		subPath = strings.TrimPrefix(subPath, "/")

		oldFullPath := filepath.Join(s.uploadDir, subPath)
		fileName := filepath.Base(oldFullPath)

		// Ensure file name contains this item's ID prefix
		if cleanID != "" && !strings.HasPrefix(fileName, cleanID+"_") {
			ext := filepath.Ext(fileName)
			base := strings.TrimSuffix(fileName, ext)
			fileName = fmt.Sprintf("%s_%s%s", cleanID, base, ext)
		}

		newFullPath := filepath.Join(targetDir, fileName)

		if oldFullPath != newFullPath {
			// Check if a file with this name already exists in target folder
			if fi, err := os.Stat(newFullPath); err == nil {
				// If target exists and is a DIFFERENT file, generate unique name
				oldFi, oldErr := os.Stat(oldFullPath)
				if oldErr == nil && !os.SameFile(fi, oldFi) {
					ext := filepath.Ext(fileName)
					fileName = fmt.Sprintf("%s_%d_%s%s", cleanID, time.Now().UnixNano(), generateRandomHex(3), ext)
					newFullPath = filepath.Join(targetDir, fileName)
				}
			}

			if _, err := os.Stat(oldFullPath); err == nil {
				if err := os.Rename(oldFullPath, newFullPath); err == nil {
					oldParent := filepath.Dir(oldFullPath)
					cleanEmptyDir(oldParent, s.uploadDir)
				}
			}
			item.Photos[pIdx] = filepath.ToSlash(filepath.Join("uploads", targetFolderName, fileName))
		}
	}
}

// AddItem creates a new inventory item card or updates if ID already exists.
func (s *Storage) AddItem(item models.InventoryItem) (models.InventoryItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()

	// Organize photos into location subfolder with item ID prefix
	if item.LocationID != "" && len(item.Photos) > 0 {
		s.moveItemPhotosLocked(&item, item.LocationID)
	}

	for i := range s.items {
		if s.items[i].ID == item.ID {
			item.CreatedAt = s.items[i].CreatedAt
			item.UpdatedAt = now
			s.items[i] = item
			if err := s.saveToFileLocked(); err != nil {
				return item, err
			}
			return item, nil
		}
	}

	item.CreatedAt = now
	item.UpdatedAt = now

	s.items = append([]models.InventoryItem{item}, s.items...)
	if err := s.saveToFileLocked(); err != nil {
		return item, err
	}
	return item, nil
}

// UpdateItem updates item fields, moves photos when location changes, and purges removed photos.
func (s *Storage) UpdateItem(item models.InventoryItem) (models.InventoryItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var oldItem *models.InventoryItem
	targetIndex := -1
	for i := range s.items {
		if s.items[i].ID == item.ID {
			oldItem = &s.items[i]
			targetIndex = i
			break
		}
	}

	if oldItem == nil {
		return item, errors.New("item not found")
	}

	// 1. Record original base file names of previous photos before moving
	oldBases := make(map[string]string)
	for _, p := range oldItem.Photos {
		base := filepath.Base(filepath.Clean(p))
		oldBases[base] = p
	}

	// 2. If storage location changed, move photos to new location subfolder
	if oldItem.LocationID != item.LocationID && item.LocationID != "" {
		s.moveItemPhotosLocked(&item, item.LocationID)
	}

	// 3. Collect updated base file names
	newBases := make(map[string]bool)
	for _, p := range item.Photos {
		base := filepath.Base(filepath.Clean(p))
		newBases[base] = true
	}

	// 4. Update the item in s.items
	item.CreatedAt = oldItem.CreatedAt
	item.UpdatedAt = time.Now()
	s.items[targetIndex] = item

	// 5. Delete removed photos from disk using fast O(1) item ID ownership verification
	for base, oldPhoto := range oldBases {
		if !newBases[base] {
			s.DeletePhotoFileLocked(oldPhoto, item.ID)
		}
	}

	if err := s.saveToFileLocked(); err != nil {
		return item, err
	}
	return item, nil
}

// DeleteItem removes an item by ID and deletes its photo files from disk.
func (s *Storage) DeleteItem(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var updated []models.InventoryItem
	found := false
	for _, it := range s.items {
		if it.ID == id {
			found = true
			// Delete attached photos from disk with item ID ownership check
			for _, photo := range it.Photos {
				s.DeletePhotoFileLocked(photo, it.ID)
			}
			continue
		}
		updated = append(updated, it)
	}

	if !found {
		return errors.New("item not found")
	}

	s.items = updated
	return s.saveToFileLocked()
}

// MoveItems moves a batch of items to a new location and relocates their photo files.
func (s *Storage) MoveItems(itemIDs []string, newLocationID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	targetExists := false
	for _, l := range s.locations {
		if l.ID == newLocationID {
			targetExists = true
			break
		}
	}
	if !targetExists {
		return errors.New("target storage location does not exist")
	}

	set := make(map[string]bool)
	for _, id := range itemIDs {
		set[id] = true
	}

	now := time.Now()
	for i := range s.items {
		if set[s.items[i].ID] {
			s.items[i].LocationID = newLocationID
			s.items[i].UpdatedAt = now
			// Relocate photo files to new location subfolder
			s.moveItemPhotosLocked(&s.items[i], newLocationID)
		}
	}

	return s.saveToFileLocked()
}

// SearchItems searches items matching query string across name, description, SKU, barcode, and location.
func (s *Storage) SearchItems(query string, locationID string) []models.InventoryItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cleanQ := strings.ToLower(strings.TrimSpace(query))
	var result []models.InventoryItem

	var allowedLocIDs map[string]bool
	if locationID != "" {
		allowedLocIDs = make(map[string]bool)
		allowedLocIDs[locationID] = true
		for _, id := range s.GetDescendantsIDsLocked(locationID) {
			allowedLocIDs[id] = true
		}
	}

	// Build map of location codes and names for fast searching
	locCodeMap := make(map[string]string)
	for _, l := range s.locations {
		locCodeMap[l.ID] = strings.ToLower(l.FullCode + " " + l.Name)
	}

	for _, item := range s.items {
		if allowedLocIDs != nil && !allowedLocIDs[item.LocationID] {
			continue
		}

		if cleanQ == "" {
			result = append(result, item)
			continue
		}

		locInfo := locCodeMap[item.LocationID]

		if strings.Contains(strings.ToLower(item.Name), cleanQ) ||
			strings.Contains(strings.ToLower(item.Description), cleanQ) ||
			strings.Contains(strings.ToLower(item.SKU), cleanQ) ||
			strings.Contains(strings.ToLower(item.Barcode), cleanQ) ||
			strings.Contains(strings.ToLower(item.Parameters.Category), cleanQ) ||
			strings.Contains(locInfo, cleanQ) {
			result = append(result, item)
		}
	}

	return result
}

// --- CRUD operations for category tree (Categories) ---

// GetCategories returns all catalog categories.
func (s *Storage) GetCategories() []models.CategoryNode {
	s.mu.RLock()
	defer s.mu.RUnlock()
	res := make([]models.CategoryNode, len(s.categories))
	copy(res, s.categories)
	return res
}

// AddCategory adds a new category or updates if existing.
func (s *Storage) AddCategory(node models.CategoryNode) (models.CategoryNode, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for i := range s.categories {
		if s.categories[i].ID == node.ID {
			node.CreatedAt = s.categories[i].CreatedAt
			node.UpdatedAt = &now
			s.categories[i] = node
			if err := s.saveToFileLocked(); err != nil {
				return node, err
			}
			return node, nil
		}
	}

	if node.CreatedAt == nil {
		node.CreatedAt = &now
	}
	node.UpdatedAt = &now

	s.categories = append(s.categories, node)
	if err := s.saveToFileLocked(); err != nil {
		return node, err
	}
	return node, nil
}

// UpdateCategory updates category name or properties.
func (s *Storage) UpdateCategory(node models.CategoryNode) (models.CategoryNode, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	found := false
	now := time.Now()
	for i := range s.categories {
		if s.categories[i].ID == node.ID {
			node.CreatedAt = s.categories[i].CreatedAt
			node.UpdatedAt = &now
			s.categories[i] = node
			found = true
			break
		}
	}

	if !found {
		return node, errors.New("category not found")
	}

	// Sync string category parameter for matching items
	for i := range s.items {
		if s.items[i].CategoryID != nil && *s.items[i].CategoryID == node.ID {
			s.items[i].Parameters.Category = node.Name
			s.items[i].UpdatedAt = now
		}
	}

	if err := s.saveToFileLocked(); err != nil {
		return node, err
	}
	return node, nil
}

// MoveCategory moves a category to a new parent.
func (s *Storage) MoveCategory(categoryID string, newParentID *string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if newParentID != nil && *newParentID == categoryID {
		return errors.New("category cannot be a parent of itself")
	}

	now := time.Now()
	found := false
	for i := range s.categories {
		if s.categories[i].ID == categoryID {
			s.categories[i].ParentID = newParentID
			s.categories[i].UpdatedAt = &now
			found = true
			break
		}
	}

	if !found {
		return errors.New("category not found")
	}

	return s.saveToFileLocked()
}

// DeleteCategory deletes a category.
func (s *Storage) DeleteCategory(categoryID string, reassignParent bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var parentID *string
	for _, c := range s.categories {
		if c.ID == categoryID {
			parentID = c.ParentID
			break
		}
	}

	// Remove node
	var remaining []models.CategoryNode
	for _, c := range s.categories {
		if c.ID != categoryID {
			remaining = append(remaining, c)
		}
	}
	s.categories = remaining

	// Update associated items
	now := time.Now()
	for i := range s.items {
		if s.items[i].CategoryID != nil && *s.items[i].CategoryID == categoryID {
			if reassignParent && parentID != nil {
				s.items[i].CategoryID = parentID
			} else {
				s.items[i].CategoryID = nil
				s.items[i].Parameters.Category = ""
			}
			s.items[i].UpdatedAt = now
		}
	}

	return s.saveToFileLocked()
}

// seedInitialData populates database with initial sample inventory.
func (s *Storage) seedInitialData() {
	pHome := "loc-home"
	pGarage := "loc-garage"
	pCloset := "furn-closet-1"
	pShelf3 := "shelf-closet-3"
	pWorkbench := "furn-workbench"
	pShelf2 := "shelf-wb-2"

	s.locations = []models.LocationNode{
		{ID: "loc-home", Name: "Дом", Type: models.TypeLocation, CodeSuffix: "д", FullCode: "д"},
		{ID: "furn-closet-1", Name: "Шкаф в коридоре", Type: models.TypeFurniture, ParentID: &pHome, CodeSuffix: "ш1", FullCode: "д-ш1"},
		{ID: "shelf-closet-3", Name: "Полка 3", Type: models.TypeShelf, ParentID: &pCloset, CodeSuffix: "п3", FullCode: "д-ш1-п3"},
		{ID: "box-cables", Name: "Коробка 1 (Кабели)", Type: models.TypeContainer, ParentID: &pShelf3, CodeSuffix: "к1", FullCode: "д-ш1-п3-к1"},

		{ID: "loc-garage", Name: "Гараж", Type: models.TypeLocation, CodeSuffix: "г", FullCode: "г"},
		{ID: "furn-workbench", Name: "Верстак", Type: models.TypeFurniture, ParentID: &pGarage, CodeSuffix: "в1", FullCode: "г-в1"},
		{ID: "shelf-wb-2", Name: "Полка 2", Type: models.TypeShelf, ParentID: &pWorkbench, CodeSuffix: "п2", FullCode: "г-в1-п2"},
		{ID: "box-auto", Name: "Ящик с запчастями", Type: models.TypeContainer, ParentID: &pShelf2, CodeSuffix: "к1", FullCode: "г-в1-п2-к1"},
	}

	pParts := "cat-parts"
	now := time.Now()
	s.categories = []models.CategoryNode{
		{ID: "cat-parts", Name: "Запчасти и расходники", Color: "#0284c7", CreatedAt: &now, UpdatedAt: &now},
		{ID: "cat-parts-appliances", Name: "Бытовая техника", ParentID: &pParts, Color: "#0284c7", CreatedAt: &now, UpdatedAt: &now},
		{ID: "cat-parts-auto", Name: "Автозапчасти", ParentID: &pParts, Color: "#0284c7", CreatedAt: &now, UpdatedAt: &now},
		{ID: "cat-tools", Name: "Инструменты", Color: "#d97706", CreatedAt: &now, UpdatedAt: &now},
		{ID: "cat-fasteners", Name: "Крепеж и метизы", Color: "#4b5563", CreatedAt: &now, UpdatedAt: &now},
		{ID: "cat-collection", Name: "Коллекционирование", Color: "#7c3aed", CreatedAt: &now, UpdatedAt: &now},
		{ID: "cat-cables", Name: "Электроника и кабели", Color: "#10b981", CreatedAt: &now, UpdatedAt: &now},
	}

	catAppliances := "cat-parts-appliances"
	catAuto := "cat-parts-auto"
	catFasteners := "cat-fasteners"
	catCollection := "cat-collection"

	weight1 := 0.15
	weight2 := 0.35
	weight3 := 0.45
	weight4 := 0.98

	s.items = []models.InventoryItem{
		{
			ID:          "item-1",
			Name:        "HEPA фильтр для пылесоса Samsung",
			Description: "Микрофильтр выходного воздуха DJ97-01670D",
			SKU:         "SAM-HEPA-0167",
			Barcode:     "4820019284011",
			LocationID:  "box-cables",
			CategoryID:  &catAppliances,
			Photos:      []string{"https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80"},
			Parameters: models.ItemParameters{
				WeightKG:     &weight1,
				DimensionsMM: &models.ItemDimensions{Length: 145, Width: 110, Height: 35},
				Category:     "Бытовая техника",
			},
		},
		{
			ID:          "item-2",
			Name:        "Свечи зажигания NGK Laser Iridium (4 шт)",
			Description: "Артикул ILKAR7B11 для бензинового двигателя 1.6-2.0L",
			SKU:         "NGK-ILKAR7B11",
			Barcode:     "4964520095123",
			LocationID:  "box-auto",
			CategoryID:  &catAuto,
			Photos:      []string{"https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80"},
			Parameters: models.ItemParameters{
				WeightKG:     &weight2,
				DimensionsMM: &models.ItemDimensions{Length: 110, Width: 85, Height: 25},
				Category:     "Автозапчасти",
			},
		},
		{
			ID:          "item-3",
			Name:        "Набор винтов с цилиндрической головкой DIN 912 (M5x16 - 100 шт)",
			Description: "Нержавеющая сталь A2, внутренний шестигранник HEX 4mm",
			SKU:         "FAST-DIN912-M5-16",
			Barcode:     "4607182901145",
			LocationID:  "box-auto",
			CategoryID:  &catFasteners,
			Photos:      []string{"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"},
			Parameters: models.ItemParameters{
				WeightKG:     &weight3,
				DimensionsMM: &models.ItemDimensions{Length: 100, Width: 60, Height: 40},
				Category:     "Крепеж и метизы",
			},
		},
		{
			ID:          "item-4",
			Name:        "Винтажный пленочный фотоаппарат Зенит-Е с объективом Гелиос-44-2",
			Description: "СССР, 1978 год, экспортная серия, зеркальный, рабочий экспонометр",
			SKU:         "ZENIT-E-78-KMZ",
			Barcode:     "7920011409218",
			LocationID:  "box-cables",
			CategoryID:  &catCollection,
			Photos:      []string{"https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80"},
			Parameters: models.ItemParameters{
				WeightKG:     &weight4,
				DimensionsMM: &models.ItemDimensions{Length: 140, Width: 100, Height: 95},
				Category:     "Коллекционирование",
			},
		},
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func generateRandomHex(n int) string {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return "rnd"
	}
	return hex.EncodeToString(bytes)
}
