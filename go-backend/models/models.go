// Package models defines data structures with JSON and DB tags
// for the hierarchical home inventory system.
package models

import "time"

// LocationType defines the level in the 4-level storage hierarchy:
// 1. location   - Top-level location (Home, Garage, Cottage)
// 2. furniture  - Furniture / Rack (Cabinet, Workbench, Closet)
// 3. shelf      - Shelf (Shelf 1, Shelf 2 - numbered from bottom up)
// 4. container  - Box / Container / Organizer (Box 1, Organizer A)
type LocationType string

const (
	TypeLocation  LocationType = "location"
	TypeFurniture LocationType = "furniture"
	TypeShelf     LocationType = "shelf"
	TypeContainer LocationType = "container"
)

// LocationNode represents a node in the storage location hierarchy with self-referencing parent_id.
type LocationNode struct {
	ID          string       `json:"id" db:"id"`                                // Unique location ID
	Name        string       `json:"name" db:"name"`                            // Location name (e.g., "Cabinet 1", "Shelf 3")
	Type        LocationType `json:"type" db:"type"`                            // Hierarchy level type
	ParentID    *string      `json:"parent_id" db:"parent_id"`                  // Reference to parent location (nil for root)
	CodeSuffix  string       `json:"code_suffix" db:"code_suffix"`              // Code suffix: "h", "c1", "s3", "b1"
	FullCode    string       `json:"full_code" db:"full_code"`                  // Full generated label address: "h-c1-s3-b1"
	ShelfNumber *int         `json:"shelf_number,omitempty" db:"shelf_number"`  // Shelf number (counted from bottom up)
	Description string       `json:"description,omitempty" db:"description"`    // Notes or description
	Color       string       `json:"color,omitempty" db:"color"`                // Marker color hex
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`                // Creation timestamp
	UpdatedAt   time.Time    `json:"updated_at" db:"updated_at"`                // Last update timestamp
}

// CategoryNode represents a node in the hierarchical item category tree.
type CategoryNode struct {
	ID          string     `json:"id" db:"id"`                             // Category ID
	Name        string     `json:"name" db:"name"`                         // Category name
	ParentID    *string    `json:"parent_id" db:"parent_id"`               // Reference to parent category (nil for root)
	Description string     `json:"description,omitempty" db:"description"` // Category description
	Color       string     `json:"color,omitempty" db:"color"`             // Color accent
	Icon        string     `json:"icon,omitempty" db:"icon"`               // Icon identifier
	CreatedAt   *time.Time `json:"created_at,omitempty" db:"created_at"`   // Creation timestamp
	UpdatedAt   *time.Time `json:"updated_at,omitempty" db:"updated_at"`   // Update timestamp
}

// ItemDimensions describes physical dimensions in millimeters.
type ItemDimensions struct {
	Length int `json:"length" db:"length"` // Length (mm)
	Width  int `json:"width" db:"width"`   // Width (mm)
	Height int `json:"height" db:"height"` // Height (mm)
}

// ItemParameters holds physical specifications and metadata for an item.
type ItemParameters struct {
	WeightKG     *float64        `json:"weight_kg,omitempty" db:"weight_kg"`         // Weight in kilograms
	DimensionsMM *ItemDimensions `json:"dimensions_mm,omitempty" db:"dimensions_mm"` // Dimensions: Length x Width x Height (mm)
	Category     string          `json:"category,omitempty" db:"category"`           // Category name (Parts, Tools, etc.)
	Notes        string          `json:"notes,omitempty" db:"notes"`                 // Free-form notes
}

// InventoryItem represents a physical item tracked in the inventory system.
type InventoryItem struct {
	ID          string         `json:"id" db:"id"`                             // Primary key (UUID or string ID)
	Name        string         `json:"name" db:"name"`                         // Item title (required)
	Description string         `json:"description" db:"description"`           // Detailed description and purpose
	SKU         string         `json:"sku" db:"sku"`                           // Stock Keeping Unit / Part Number
	Barcode     string         `json:"barcode" db:"barcode"`                   // Barcode / QR string
	LocationID  string         `json:"location_id" db:"location_id"`           // Assigned location ID in the hierarchy
	CategoryID  *string        `json:"category_id,omitempty" db:"category_id"` // Assigned category ID in the catalog
	Photos      []string       `json:"photos" db:"photos"`                     // Slice of relative file paths (e.g. "uploads/box1/item_123.jpg")
	Parameters  ItemParameters `json:"parameters" db:"parameters"`             // Physical parameters (weight, dimensions)
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`             // Creation timestamp
	UpdatedAt   time.Time      `json:"updated_at" db:"updated_at"`             // Modification timestamp
}

// DatabaseSnapshot describes the structure of the standalone database file (db.json).
type DatabaseSnapshot struct {
	Version     string          `json:"version"`
	AppName     string          `json:"app_name"`
	ExportedAt  time.Time       `json:"exported_at"`
	Locations   []LocationNode  `json:"locations"`
	Categories  []CategoryNode  `json:"categories,omitempty"`
	Items       []InventoryItem `json:"items"`
}
