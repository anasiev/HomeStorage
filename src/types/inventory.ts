/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Types of the strict 4-level storage hierarchy
export type LocationType = 'location' | 'furniture' | 'shelf' | 'container';

export interface LocationTypeConfig {
  type: LocationType;
  label: string;
  defaultPrefix: string;
  level: number;
  icon: string;
  allowedParentTypes: LocationType[];
}

export const LOCATION_TYPE_CONFIGS: Record<LocationType, LocationTypeConfig> = {
  location: {
    type: 'location',
    label: 'Location (Home, Garage, Pantry)',
    defaultPrefix: 'h',
    level: 1,
    icon: 'Home',
    allowedParentTypes: [],
  },
  furniture: {
    type: 'furniture',
    label: 'Furniture / Rack (Closet, Workbench, Shelving)',
    defaultPrefix: 'w',
    level: 2,
    icon: 'Warehouse',
    allowedParentTypes: ['location'],
  },
  shelf: {
    type: 'shelf',
    label: 'Shelf (Shelf 1, Shelf 2 - from bottom)',
    defaultPrefix: 's',
    level: 3,
    icon: 'Layers',
    allowedParentTypes: ['furniture'],
  },
  container: {
    type: 'container',
    label: 'Box / Container / Bin',
    defaultPrefix: 'b',
    level: 4,
    icon: 'Box',
    allowedParentTypes: ['shelf', 'furniture'],
  },
};

// Storage location node with self-referencing parent_id
export interface LocationNode {
  id: string;
  name: string;
  type: LocationType;
  parent_id: string | null;
  code_suffix: string; // Suffix code, e.g., "h", "w1", "s3", "b1"
  full_code: string;   // Generated address code, e.g., "h-w1-s3-b1"
  description?: string;
  shelf_number?: number; // Shelf number (counting from bottom)
  color?: string;
  created_at: string;
  updated_at: string;
}

// Item physical parameters (dimensions, weight)
export interface ItemParameters {
  weight_kg?: number;
  dimensions_mm?: {
    length: number;
    width: number;
    height: number;
  };
  category?: string;
  notes?: string;
}

// Catalog category node (hierarchical category tree)
export interface CategoryNode {
  id: string;
  name: string;
  parent_id: string | null;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Inventory Item record
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  sku: string;         // Stock Keeping Unit
  barcode: string;     // Barcode (manual or auto-generated)
  location_id: string; // Relation to node in storage hierarchy
  category_id?: string;// Relation to node in category tree
  photos: string[];    // Relative paths or data URLs
  parameters: ItemParameters;
  created_at: string;
  updated_at: string;
}

// Database snapshot for JSON persistence
export interface InventoryDatabase {
  version: string;
  app_name: string;
  exported_at: string;
  last_updated?: string;
  locations: LocationNode[];
  categories?: CategoryNode[];
  items: InventoryItem[];
}
