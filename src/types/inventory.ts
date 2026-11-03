/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Типы уровней жесткой 4-уровневой иерархии
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
    label: 'Локация (Дом, Гараж, Дача)',
    defaultPrefix: 'д',
    level: 1,
    icon: 'Home',
    allowedParentTypes: [],
  },
  furniture: {
    type: 'furniture',
    label: 'Стеллаж / Мебель (Шкаф, Верстак, Комод)',
    defaultPrefix: 'ш',
    level: 2,
    icon: 'Warehouse',
    allowedParentTypes: ['location'],
  },
  shelf: {
    type: 'shelf',
    label: 'Полка (Полка 1, Полка 2 — снизу)',
    defaultPrefix: 'п',
    level: 3,
    icon: 'Layers',
    allowedParentTypes: ['furniture'],
  },
  container: {
    type: 'container',
    label: 'Коробка / Контейнер / Органайзер',
    defaultPrefix: 'к',
    level: 4,
    icon: 'Box',
    allowedParentTypes: ['shelf', 'furniture'],
  },
};

// Место хранения (LocationNode) с self-referencing связью parent_id
export interface LocationNode {
  id: string;
  name: string;
  type: LocationType;
  parent_id: string | null;
  code_suffix: string; // Суффикс кода, например "д", "ш1", "п3", "к1"
  full_code: string;   // Сгенерированный адрес, например "д-ш1-п3-к1"
  description?: string;
  shelf_number?: number; // Номер полки (отсчет снизу)
  color?: string;
  created_at: string;
  updated_at: string;
}

// Параметры вещи (габариты, вес)
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

// Категория каталога вещей (иерархическое дерево категорий)
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

// Карточка вещи (Item)
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  sku: string;         // Артикул
  barcode: string;     // Штрихкод (ручной ввод или автогенерация)
  location_id: string; // Связь с точкой в иерархии мест
  category_id?: string;// Связь с узлом дерева категорий
  photos: string[];    // Относительные пути или base64
  parameters: ItemParameters;
  created_at: string;
  updated_at: string;
}

// Снимок базы данных для JSON-хранилища
export interface InventoryDatabase {
  version: string;
  app_name: string;
  exported_at: string;
  last_updated?: string;
  locations: LocationNode[];
  categories?: CategoryNode[];
  items: InventoryItem[];
}
