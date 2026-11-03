/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CategoryNode,
  InventoryDatabase,
  InventoryItem,
  LocationNode,
  LocationType,
} from '../types/inventory';

const DB_STORAGE_KEY = 'home_inventory_db_v1';

// Реалистичные начальные данные мест хранения
const INITIAL_LOCATIONS: LocationNode[] = [
  // 1. Дом (Локация верхнего уровня)
  {
    id: 'loc-home',
    name: 'Дом',
    type: 'location',
    parent_id: null,
    code_suffix: 'д',
    full_code: 'д',
    description: 'Основной жилой дом, кладовка и гардеробная',
    color: '#3b82f6',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  // 2. Мебель в доме
  {
    id: 'furn-closet-1',
    name: 'Шкаф-купе в коридоре',
    type: 'furniture',
    parent_id: 'loc-home',
    code_suffix: 'ш1',
    full_code: 'д-ш1',
    description: 'Большой зеркальный шкаф для сезонных вещей и техники',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  // 3. Полки в шкафу
  {
    id: 'shelf-closet-1',
    name: 'Полка 1 (Нижняя)',
    type: 'shelf',
    parent_id: 'furn-closet-1',
    code_suffix: 'п1',
    full_code: 'д-ш1-п1',
    shelf_number: 1,
    description: 'Нижняя полка под обувь и тяжелые ящики',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'shelf-closet-3',
    name: 'Полка 3 (Средняя)',
    type: 'shelf',
    parent_id: 'furn-closet-1',
    code_suffix: 'п3',
    full_code: 'д-ш1-п3',
    shelf_number: 3,
    description: 'Средняя полка для мелкой бытовой техники и документов',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  // 4. Коробки на полке
  {
    id: 'box-cables-1',
    name: 'Коробка 1 (Кабели и зарядки)',
    type: 'container',
    parent_id: 'shelf-closet-3',
    code_suffix: 'к1',
    full_code: 'д-ш1-п3-к1',
    description: 'Пластиковый органайзер с проводами USB, HDMI, удлинителями',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'box-appliances-2',
    name: 'Органайзер А (Запчасти для бытовой техники)',
    type: 'container',
    parent_id: 'shelf-closet-3',
    code_suffix: 'оа',
    full_code: 'д-ш1-п3-оа',
    description: 'Фильтры для пылесоса, насадки, прокладки для кофемашины',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },

  // 1. Гараж (Локация верхнего уровня)
  {
    id: 'loc-garage',
    name: 'Гараж',
    type: 'location',
    parent_id: null,
    code_suffix: 'г',
    full_code: 'г',
    description: 'Гараж с мастерской и автозапчастями',
    color: '#10b981',
    created_at: new Date('2026-01-11').toISOString(),
    updated_at: new Date('2026-01-11').toISOString(),
  },
  // 2. Верстак в гараже
  {
    id: 'furn-workbench',
    name: 'Верстак слесарный',
    type: 'furniture',
    parent_id: 'loc-garage',
    code_suffix: 'в1',
    full_code: 'г-в1',
    description: 'Стальной верстак с тумбами и тисками',
    created_at: new Date('2026-01-11').toISOString(),
    updated_at: new Date('2026-01-11').toISOString(),
  },
  // 3. Полки на верстаке
  {
    id: 'shelf-wb-2',
    name: 'Полка 2',
    type: 'shelf',
    parent_id: 'furn-workbench',
    code_suffix: 'п2',
    full_code: 'г-в1-п2',
    shelf_number: 2,
    description: 'Полка над рабочей зоной',
    created_at: new Date('2026-01-11').toISOString(),
    updated_at: new Date('2026-01-11').toISOString(),
  },
  // 4. Коробки в гараже
  {
    id: 'box-auto-parts',
    name: 'Ящик 1 (Автозапчасти и расходники)',
    type: 'container',
    parent_id: 'shelf-wb-2',
    code_suffix: 'к1',
    full_code: 'г-в1-п2-к1',
    description: 'Свечи зажигания, ремни, масляные фильтры, колодки',
    created_at: new Date('2026-01-11').toISOString(),
    updated_at: new Date('2026-01-11').toISOString(),
  },
  {
    id: 'box-fasteners',
    name: 'Органайзер с крепежом (Винты, гайки M4-M8)',
    type: 'container',
    parent_id: 'shelf-wb-2',
    code_suffix: 'к2',
    full_code: 'г-в1-п2-к2',
    description: 'Многосекционный чемоданчик с метрическим крепежом',
    created_at: new Date('2026-01-11').toISOString(),
    updated_at: new Date('2026-01-11').toISOString(),
  },

  // 1. Кладовка
  {
    id: 'loc-pantry',
    name: 'Кладовка',
    type: 'location',
    parent_id: null,
    code_suffix: 'кл',
    full_code: 'кл',
    description: 'Встроенная темная комната для консервации и инструментов',
    color: '#f59e0b',
    created_at: new Date('2026-01-12').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'furn-rack-metal',
    name: 'Стеллаж оцинкованный',
    type: 'furniture',
    parent_id: 'loc-pantry',
    code_suffix: 'ст1',
    full_code: 'кл-ст1',
    description: '5 полок, нагрузка до 150 кг на полку',
    created_at: new Date('2026-01-12').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'shelf-rack-4',
    name: 'Полка 4 (Верхняя)',
    type: 'shelf',
    parent_id: 'furn-rack-metal',
    code_suffix: 'п4',
    full_code: 'кл-ст1-п4',
    shelf_number: 4,
    description: 'Полка для архивов и редких вещей',
    created_at: new Date('2026-01-12').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'box-collection',
    name: 'Коробка 1 (Коллекционирование и памятные вещи)',
    type: 'container',
    parent_id: 'shelf-rack-4',
    code_suffix: 'к1',
    full_code: 'кл-ст1-п4-к1',
    description: 'Винтажные фотоаппараты, монеты, значки и альбомы',
    created_at: new Date('2026-01-12').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
  },
];

// Начальное дерево категорий каталога вещей
export const INITIAL_CATEGORIES: CategoryNode[] = [
  // 1. Запчасти и расходники
  {
    id: 'cat-parts',
    name: 'Запчасти и расходники',
    parent_id: null,
    description: 'Комплектующие для бытовой техники, автомобилей и инструментов',
    color: '#0284c7',
    icon: 'Wrench',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'cat-parts-appliance',
    name: 'Запчасти бытовой техники',
    parent_id: 'cat-parts',
    description: 'Фильтры, прокладки, ремни, насадки',
    color: '#0ea5e9',
    icon: 'Cpu',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'cat-parts-auto',
    name: 'Автозапчасти',
    parent_id: 'cat-parts',
    description: 'Свечи, колодки, фильтры, ремни ГРМ',
    color: '#38bdf8',
    icon: 'Wrench',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },

  // 2. Крепеж и метизы
  {
    id: 'cat-hardware',
    name: 'Крепеж и метизы',
    parent_id: null,
    description: 'Метрический крепеж, саморезы, дюбели, анкеры',
    color: '#64748b',
    icon: 'Hammer',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'cat-hw-screws',
    name: 'Винты, болты и гайки',
    parent_id: 'cat-hardware',
    description: 'DIN 912, DIN 933, метрика M3-M12',
    color: '#94a3b8',
    icon: 'Hammer',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },

  // 3. Электроника и кабели
  {
    id: 'cat-electronics',
    name: 'Кабели и аксессуары',
    parent_id: null,
    description: 'Провода, адаптеры, зарядки, коммутация',
    color: '#8b5cf6',
    icon: 'Zap',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },

  // 4. Домашняя техника
  {
    id: 'cat-home',
    name: 'Домашняя техника',
    parent_id: null,
    description: 'Приборы, утюги, мелкая кухонная техника',
    color: '#f59e0b',
    icon: 'Tv',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },

  // 5. Коллекционирование
  {
    id: 'cat-collection',
    name: 'Коллекционирование',
    parent_id: null,
    description: 'Винтажная фототехника, монеты, антиквариат',
    color: '#ec4899',
    icon: 'Sparkles',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
];

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item-101',
    name: 'HEPA фильтр для пылесоса Samsung',
    description: 'Оригинальный выходной микрофильтр DJ97-01670D, в заводской упаковке',
    sku: 'SAM-HEPA-0167',
    barcode: '4820019284011',
    location_id: 'box-appliances-2',
    category_id: 'cat-parts-appliance',
    photos: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.15,
      dimensions_mm: { length: 145, width: 110, height: 35 },
      category: 'Запчасти бытовой техники',
      notes: 'Срок службы 1 год, замена при снижении тяги',
    },
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'item-102',
    name: 'Силиконовые уплотнители для кофемашины DeLonghi',
    description: 'Комплект прокладок варочной группы (2 шт красные, 1 шт черная O-ring)',
    sku: 'DL-GSK-328',
    barcode: '8004399328102',
    location_id: 'box-appliances-2',
    category_id: 'cat-parts-appliance',
    photos: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.05,
      dimensions_mm: { length: 50, width: 50, height: 10 },
      category: 'Запчасти бытовой техники',
      notes: 'Перед установкой смазать пищевой силиконовой смазкой',
    },
    created_at: new Date('2026-01-16').toISOString(),
    updated_at: new Date('2026-01-16').toISOString(),
  },
  {
    id: 'item-103',
    name: 'Кабель HDMI 2.1 8K Ultra High Speed (3 метра)',
    description: 'Плетеный в нейлоновой оплетке, позолоченные разъемы, 48 Гбит/с',
    sku: 'CAB-HDMI-8K3M',
    barcode: '6941289100213',
    location_id: 'box-cables-1',
    category_id: 'cat-electronics',
    photos: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.32,
      dimensions_mm: { length: 200, width: 150, height: 40 },
      category: 'Кабели и аксессуары',
      notes: 'Подходит для PS5 / ПК 4K 120Hz',
    },
    created_at: new Date('2026-01-17').toISOString(),
    updated_at: new Date('2026-01-17').toISOString(),
  },
  {
    id: 'item-104',
    name: 'Запасной утюг дорожный Tefal',
    description: 'Складная ручка, резервуар 100 мл, лежит на полке без коробки',
    sku: 'TEF-IRON-TR10',
    barcode: '3121040082194',
    location_id: 'shelf-closet-3',
    category_id: 'cat-home',
    photos: [
      'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.85,
      dimensions_mm: { length: 220, width: 95, height: 110 },
      category: 'Домашняя техника',
      notes: 'Рабочий, проверен 10.01.2026',
    },
    created_at: new Date('2026-01-18').toISOString(),
    updated_at: new Date('2026-01-18').toISOString(),
  },
  {
    id: 'item-105',
    name: 'Комплект иридиевых свечей зажигания NGK Laser Iridium (4 шт)',
    description: 'Артикул ILKAR7B11, подходят для бензиновых двигателей 1.6-2.0L',
    sku: 'NGK-ILKAR7B11',
    barcode: '4964520095123',
    location_id: 'box-auto-parts',
    category_id: 'cat-parts-auto',
    photos: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.28,
      dimensions_mm: { length: 110, width: 85, height: 25 },
      category: 'Автозапчасти',
      notes: 'Зазор 1.1 мм, для планового ТО 60 000 км',
    },
    created_at: new Date('2026-01-20').toISOString(),
    updated_at: new Date('2026-01-20').toISOString(),
  },
  {
    id: 'item-106',
    name: 'Масляный фильтр MANN W712/94',
    description: 'Оригинальный немецкий масляный фильтр с уплотнительным кольцом',
    sku: 'MANN-W712-94',
    barcode: '4011558742801',
    location_id: 'box-auto-parts',
    category_id: 'cat-parts-auto',
    photos: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.35,
      dimensions_mm: { length: 80, width: 80, height: 95 },
      category: 'Автозапчасти',
    },
    created_at: new Date('2026-01-21').toISOString(),
    updated_at: new Date('2026-01-21').toISOString(),
  },
  {
    id: 'item-107',
    name: 'Набор винтов с цилиндрической головкой DIN 912 (M5x16 - 100 шт)',
    description: 'Нержавеющая сталь A2, внутренний шестигранник HEX 4mm',
    sku: 'FAST-DIN912-M5-16',
    barcode: '4607182901145',
    location_id: 'box-fasteners',
    category_id: 'cat-hw-screws',
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.45,
      dimensions_mm: { length: 100, width: 60, height: 40 },
      category: 'Крепеж и метизы',
    },
    created_at: new Date('2026-01-22').toISOString(),
    updated_at: new Date('2026-01-22').toISOString(),
  },
  {
    id: 'item-108',
    name: 'Винтажный пленочный фотоаппарат Зенит-Е с объективом Гелиос-44-2',
    description: 'СССР, 1978 год, экспортная серия, зеркальный, рабочий селеновый экспонометр',
    sku: 'ZENIT-E-78-KMZ',
    barcode: '7920011409218',
    location_id: 'box-collection',
    category_id: 'cat-collection',
    photos: [
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    ],
    parameters: {
      weight_kg: 0.98,
      dimensions_mm: { length: 140, width: 100, height: 95 },
      category: 'Коллекционирование',
      notes: 'В кожаном футляре, беречь от влаги',
    },
    created_at: new Date('2026-01-25').toISOString(),
    updated_at: new Date('2026-01-25').toISOString(),
  },
];

function deduplicateById<T extends { id: string }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

class InventoryStorageManager {
  private db: InventoryDatabase;

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): InventoryDatabase {
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.locations) && Array.isArray(parsed.items)) {
          // Если категорий не было в старом хранилище, добавляем начальные
          if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
            parsed.categories = INITIAL_CATEGORIES;
          }
          parsed.items = deduplicateById<InventoryItem>(parsed.items);
          parsed.locations = deduplicateById<LocationNode>(parsed.locations);
          parsed.categories = deduplicateById<CategoryNode>(parsed.categories || []).map((c) => ({
            ...c,
            parent_id: c.parent_id ? c.parent_id : null,
          }));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial seed data', e);
    }

    const initialDb: InventoryDatabase = {
      version: '1.0.0',
      app_name: 'Домашний Склад & Инвентаризация',
      exported_at: new Date().toISOString(),
      locations: deduplicateById(INITIAL_LOCATIONS),
      categories: deduplicateById(INITIAL_CATEGORIES).map((c) => ({
        ...c,
        parent_id: c.parent_id ? c.parent_id : null,
      })),
      items: deduplicateById(INITIAL_ITEMS),
    };
    this.saveToStorage(initialDb);
    return initialDb;
  }

  private saveToStorage(db: InventoryDatabase = this.db) {
    try {
      db.items = deduplicateById(db.items || []);
      db.locations = deduplicateById(db.locations || []);
      db.categories = deduplicateById((db.categories || []).map((c) => ({
        ...c,
        parent_id: c.parent_id ? c.parent_id : null,
      })));
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Отправка запросов на автономный локальный Go-сервер (http://localhost:8080) для синхронизации db.json
  public async sendToServer(url: string, method: string, payload?: any): Promise<any> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (payload !== undefined && method !== 'GET') {
        options.body = JSON.stringify(payload);
      }
      const res = await fetch(url, options);
      if (res.ok) {
        try {
          return await res.json();
        } catch {
          return { status: 'ok' };
        }
      } else {
        const text = await res.text();
        console.warn(`[API ${method} ${url}] Ошибка сервера:`, text);
      }
    } catch {
      // Бэкенд недоступен (работаем локально через localStorage)
    }
    return null;
  }

  // Синхронизация с автономным Go-сервером (при запуске на http://localhost:8080)
  public async syncWithServer(): Promise<boolean> {
    try {
      const [itemsRes, locsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/locations'),
      ]);

      if (!itemsRes.ok || !locsRes.ok) return false;

      const items = await itemsRes.json();
      const locations = await locsRes.json();

      let serverCats: CategoryNode[] = [];
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const cats = await catRes.json();
          if (Array.isArray(cats)) {
            serverCats = cats.map((c: any) => ({
              ...c,
              parent_id: c.parent_id ? c.parent_id : null,
            }));
          }
        }
      } catch {
        // Категории останутся локальными, если эндпоинт недоступен
      }

      if (Array.isArray(items) && Array.isArray(locations) && (items.length > 0 || locations.length > 0)) {
        // Объединяем категории: не перезаписываем локальные категории, сохраняем все созданные
        const catMap = new Map<string, CategoryNode>();
        for (const c of (this.db.categories || [])) {
          if (c && c.id) {
            catMap.set(c.id, {
              ...c,
              parent_id: c.parent_id ? c.parent_id : null,
            });
          }
        }
        for (const c of serverCats) {
          if (c && c.id) {
            catMap.set(c.id, {
              ...c,
              parent_id: c.parent_id ? c.parent_id : null,
            });
          }
        }

        // Если в локальной базе были категории, которых еще нет на сервере, синхронизируем их на сервер
        const serverCatIds = new Set(serverCats.map((c) => c.id));
        for (const [id, c] of catMap.entries()) {
          if (!serverCatIds.has(id)) {
            this.sendToServer('/api/categories', 'POST', c);
          }
        }

        const mergedCats = deduplicateById(Array.from(catMap.values()));
        const uniqueItems = deduplicateById(items);
        const uniqueLocs = deduplicateById(locations);

        this.db = {
          ...this.db,
          items: uniqueItems,
          locations: this.recomputeAllCodes(uniqueLocs),
          categories: mergedCats.length > 0 ? mergedCats : deduplicateById(INITIAL_CATEGORIES),
          last_updated: new Date().toISOString(),
        };
        this.saveToStorage(this.db);
        return true;
      }
    } catch {
      // Автономный/демо режим (сервер недоступен) — используем локальные данные
    }
    return false;
  }

  // Расчет полного кода иерархии: [Локация]-[Стеллаж]-[Полка]-[Коробка]
  public computeFullCode(nodeId: string, locations = this.db.locations): string {
    const node = locations.find((l) => l.id === nodeId);
    if (!node) return '';

    const chain: LocationNode[] = [];
    let current: LocationNode | undefined = node;
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.unshift(current);
      if (!current.parent_id) break;
      current = locations.find((l) => l.id === current!.parent_id);
    }

    return chain.map((n) => n.code_suffix || n.name.charAt(0).toLowerCase()).join('-');
  }

  // Пересчитать full_code для всех узлов дерева
  public recomputeAllCodes(locations: LocationNode[]): LocationNode[] {
    return locations.map((loc) => ({
      ...loc,
      full_code: this.computeFullCode(loc.id, locations),
    }));
  }

  // Получить путь в иерархии мест (хлебные крошки)
  public getLocationPath(locationId: string): LocationNode[] {
    const path: LocationNode[] = [];
    let current = this.db.locations.find((l) => l.id === locationId);
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      if (!current.parent_id) break;
      current = this.db.locations.find((l) => l.id === current!.parent_id);
    }

    return path;
  }

  public getLocationPathString(locationId: string): string {
    const path = this.getLocationPath(locationId);
    if (path.length === 0) return 'Без места';
    return path.map((p) => p.name).join(' › ');
  }

  public getDescendantLocationIds(locationId: string): string[] {
    const result: string[] = [];
    const queue = [locationId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = this.db.locations.filter((l) => l.parent_id === currentId);
      for (const child of children) {
        result.push(child.id);
        queue.push(child.id);
      }
    }

    return result;
  }

  public canDeleteLocation(locationId: string): {
    canDelete: boolean;
    reason?: string;
    directItemCount: number;
    totalItemCount: number;
    childLocationCount: number;
    items: InventoryItem[];
  } {
    const descendantIds = this.getDescendantLocationIds(locationId);
    const allIds = [locationId, ...descendantIds];

    const directItems = this.db.items.filter((i) => i.location_id === locationId);
    const allItems = this.db.items.filter((i) => allIds.includes(i.location_id));

    if (allItems.length > 0) {
      return {
        canDelete: false,
        reason: `Нельзя удалить место: в нем или его подразделах находится ${allItems.length} ${allItems.length === 1 ? 'вещь' : 'вещей'}. Сначала переместите или удалите вещи.`,
        directItemCount: directItems.length,
        totalItemCount: allItems.length,
        childLocationCount: descendantIds.length,
        items: allItems,
      };
    }

    return {
      canDelete: true,
      directItemCount: 0,
      totalItemCount: 0,
      childLocationCount: descendantIds.length,
      items: [],
    };
  }

  // --- Методы для локаций ---
  public getLocations(): LocationNode[] {
    return [...this.db.locations];
  }

  public getLocation(id: string): LocationNode | undefined {
    return this.db.locations.find((l) => l.id === id);
  }

  public addLocation(newNode: Omit<LocationNode, 'id' | 'full_code' | 'created_at' | 'updated_at'> & { id?: string }): LocationNode {
    const id = newNode.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const created: LocationNode = {
      ...newNode,
      id,
      code_suffix: newNode.code_suffix || newNode.name.substring(0, 2).toLowerCase(),
      full_code: '',
      created_at: now,
      updated_at: now,
    };

    let updatedLocations = [...this.db.locations, created];
    updatedLocations = this.recomputeAllCodes(updatedLocations);
    const saved = updatedLocations.find((l) => l.id === id)!;

    this.db = {
      ...this.db,
      locations: updatedLocations,
      last_updated: now,
    };
    this.saveToStorage(this.db);
    this.sendToServer('/api/locations', 'POST', saved);
    return saved;
  }

  public updateLocation(id: string, updates: Partial<LocationNode>): LocationNode {
    const now = new Date().toISOString();
    let updatedLocations = this.db.locations.map((loc) => {
      if (loc.id === id) {
        return {
          ...loc,
          ...updates,
          updated_at: now,
        };
      }
      return loc;
    });

    updatedLocations = this.recomputeAllCodes(updatedLocations);
    const result = updatedLocations.find((l) => l.id === id)!;

    this.db = {
      ...this.db,
      locations: updatedLocations,
      last_updated: now,
    };
    this.saveToStorage(this.db);
    this.sendToServer(`/api/locations/${encodeURIComponent(id)}`, 'PUT', result);
    return result;
  }

  public moveLocation(locationId: string, newParentId: string | null): LocationNode {
    if (newParentId) {
      if (locationId === newParentId) {
        throw new Error('Место не может быть родителем самого себя');
      }
      const descendants = this.getDescendantLocationIds(locationId);
      if (descendants.includes(newParentId)) {
        throw new Error('Нельзя переместить место внутрь его собственного подраздела');
      }
    }

    const res = this.updateLocation(locationId, { parent_id: newParentId });
    this.sendToServer('/api/locations/move', 'POST', {
      location_id: locationId,
      new_parent_id: newParentId,
    });
    return res;
  }

  public deleteLocation(locationId: string): void {
    const check = this.canDeleteLocation(locationId);
    if (!check.canDelete) {
      throw new Error(check.reason);
    }

    const descendantIds = this.getDescendantLocationIds(locationId);
    const removeIds = new Set([locationId, ...descendantIds]);

    const filtered = this.db.locations.filter((l) => !removeIds.has(l.id));
    this.db = {
      ...this.db,
      locations: filtered,
      last_updated: new Date().toISOString(),
    };
    this.saveToStorage(this.db);
    this.sendToServer(`/api/locations/${encodeURIComponent(locationId)}`, 'DELETE');
  }

  // ==========================================
  // --- МЕТОДЫ ДЕРЕВА КАТЕГОРИЙ (CATEGORIES) ---
  // ==========================================

  public getCategories(): CategoryNode[] {
    const cats = this.db.categories && this.db.categories.length > 0
      ? this.db.categories
      : INITIAL_CATEGORIES;
    return deduplicateById(cats).map((c) => ({
      ...c,
      parent_id: c.parent_id ? c.parent_id : null,
    }));
  }

  public getCategory(id: string): CategoryNode | undefined {
    const cat = this.getCategories().find((c) => c.id === id);
    if (!cat) return undefined;
    return {
      ...cat,
      parent_id: cat.parent_id ? cat.parent_id : null,
    };
  }

  // Получить цепочку родителей категории: Главная › Подкатегория › Деталь
  public getCategoryPath(categoryId: string): CategoryNode[] {
    const categories = this.getCategories();
    const path: CategoryNode[] = [];
    let current = categories.find((c) => c.id === categoryId);
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      if (!current.parent_id) break;
      const parentId = current.parent_id;
      current = categories.find((c) => c.id === parentId);
    }

    return path;
  }

  public getCategoryPathString(categoryId: string): string {
    const path = this.getCategoryPath(categoryId);
    if (path.length === 0) return 'Без категории';
    return path.map((p) => p.name).join(' › ');
  }

  // Все дочерние ID категорий (рекурсивно)
  public getDescendantCategoryIds(categoryId: string): string[] {
    const categories = this.getCategories();
    const result: string[] = [];
    const queue = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = categories.filter((c) => c.parent_id === currentId);
      for (const child of children) {
        result.push(child.id);
        queue.push(child.id);
      }
    }

    return result;
  }

  // Добавить новую категорию
  public addCategory(newCat: Omit<CategoryNode, 'id' | 'created_at' | 'updated_at'> & { id?: string }): CategoryNode {
    const id = newCat.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const created: CategoryNode = {
      ...newCat,
      id,
      parent_id: newCat.parent_id ? newCat.parent_id : null,
      created_at: now,
      updated_at: now,
    };

    const currentCategories = this.getCategories();
    const updatedCategories = deduplicateById([...currentCategories, created]);

    this.db = {
      ...this.db,
      categories: updatedCategories,
      last_updated: now,
    };
    this.saveToStorage(this.db);
    this.sendToServer('/api/categories', 'POST', created);
    return created;
  }

  // Обновить / Переименовать категорию
  public updateCategory(id: string, updates: Partial<CategoryNode>): CategoryNode {
    const now = new Date().toISOString();
    const currentCategories = this.getCategories();
    let updatedCat: CategoryNode | null = null;

    const updatedCategories = currentCategories.map((cat) => {
      if (cat.id === id) {
        updatedCat = {
          ...cat,
          ...updates,
          parent_id: updates.parent_id !== undefined
            ? (updates.parent_id ? updates.parent_id : null)
            : (cat.parent_id ? cat.parent_id : null),
          updated_at: now,
        };
        return updatedCat;
      }
      return cat;
    });

    if (!updatedCat) throw new Error('Категория не найдена');

    // Если изменилось имя, также синхронизируем поле parameters.category у привязанных вещей
    let updatedItems = this.db.items;
    if (updates.name) {
      const newName = updates.name;
      updatedItems = this.db.items.map((it) => {
        if (it.category_id === id) {
          return {
            ...it,
            parameters: {
              ...it.parameters,
              category: newName,
            },
            updated_at: now,
          };
        }
        return it;
      });
    }

    this.db = {
      ...this.db,
      categories: deduplicateById(updatedCategories),
      items: updatedItems,
      last_updated: now,
    };
    this.saveToStorage(this.db);
    this.sendToServer(`/api/categories/${encodeURIComponent(id)}`, 'PUT', updatedCat);
    return updatedCat;
  }

  // Переместить категорию (сменить parent_id, защита от циклических зависимостей)
  public moveCategory(categoryId: string, newParentId: string | null): CategoryNode {
    if (newParentId) {
      if (categoryId === newParentId) {
        throw new Error('Категория не может быть родителем самой себя');
      }
      const descendants = this.getDescendantCategoryIds(categoryId);
      if (descendants.includes(newParentId)) {
        throw new Error('Нельзя переместить категорию внутрь её собственного подраздела');
      }
    }

    const updated = this.updateCategory(categoryId, { parent_id: newParentId });
    this.sendToServer('/api/categories/move', 'POST', {
      category_id: categoryId,
      new_parent_id: newParentId,
    });
    return updated;
  }

  // Удаление категории с обработкой связанных вещей
  public deleteCategory(
    categoryId: string,
    options?: { reassignParent?: boolean; targetCategoryId?: string | null }
  ): { deletedCount: number; affectedItems: number } {
    const descendants = this.getDescendantCategoryIds(categoryId);
    const toDeleteIds = new Set([categoryId, ...descendants]);

    const targetCategory = options?.targetCategoryId
      ? this.getCategory(options.targetCategoryId)
      : null;

    const parentCat = this.getCategory(categoryId)?.parent_id;

    const now = new Date().toISOString();
    let affectedCount = 0;

    // Обновляем вещи
    const updatedItems = this.db.items.map((it) => {
      if (it.category_id && toDeleteIds.has(it.category_id)) {
        affectedCount++;
        let newCatId: string | undefined = undefined;
        let newCatName: string | undefined = undefined;

        if (targetCategory) {
          newCatId = targetCategory.id;
          newCatName = targetCategory.name;
        } else if (options?.reassignParent && parentCat) {
          const p = this.getCategory(parentCat);
          if (p) {
            newCatId = p.id;
            newCatName = p.name;
          }
        }

        return {
          ...it,
          category_id: newCatId,
          parameters: {
            ...it.parameters,
            category: newCatName,
          },
          updated_at: now,
        };
      }
      return it;
    });

    const remainingCategories = this.getCategories().filter((c) => !toDeleteIds.has(c.id));

    this.db = {
      ...this.db,
      categories: remainingCategories,
      items: updatedItems,
      last_updated: now,
    };
    this.saveToStorage(this.db);
    this.sendToServer(`/api/categories/${encodeURIComponent(categoryId)}`, 'DELETE');

    return {
      deletedCount: toDeleteIds.size,
      affectedItems: affectedCount,
    };
  }

  // Получить вещи для категории (включая или исключая подкатегории)
  public getItemsForCategory(categoryId: string, includeSubcategories = true): InventoryItem[] {
    const targetIds = includeSubcategories
      ? [categoryId, ...this.getDescendantCategoryIds(categoryId)]
      : [categoryId];

    const targetCat = this.getCategory(categoryId);
    const catName = targetCat ? targetCat.name.toLowerCase() : '';

    return this.db.items.filter((it) => {
      if (it.category_id && targetIds.includes(it.category_id)) {
        return true;
      }
      // Фоллбек на старое строковое поле category
      if (catName && it.parameters?.category && it.parameters.category.toLowerCase() === catName) {
        return true;
      }
      return false;
    });
  }

  // --- Методы для вещей (Items) ---
  public getItems(): InventoryItem[] {
    return deduplicateById([...this.db.items]);
  }

  public getItem(id: string): InventoryItem | undefined {
    return this.db.items.find((i) => i.id === id);
  }

  public addItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }): InventoryItem {
    const id = item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Если указан category_id, синхронизируем parameters.category
    let catName = item.parameters?.category;
    if (item.category_id) {
      const cat = this.getCategory(item.category_id);
      if (cat) catName = cat.name;
    }

    const created: InventoryItem = {
      ...item,
      id,
      parameters: {
        ...item.parameters,
        category: catName,
      },
      created_at: now,
      updated_at: now,
    };

    // Если вещь с таким ID уже есть, обновляем её на месте (не создаем дубль)
    const existingIndex = this.db.items.findIndex((i) => i.id === id);
    let updatedList: InventoryItem[];
    if (existingIndex >= 0) {
      updatedList = [...this.db.items];
      updatedList[existingIndex] = created;
    } else {
      updatedList = [created, ...this.db.items];
    }

    this.db = {
      ...this.db,
      items: deduplicateById(updatedList),
      last_updated: now,
    };
    this.saveToStorage(this.db);
    return created;
  }

  public async addItemAsync(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<InventoryItem> {
    const created = this.addItem(item);
    // Отправляем на Go-сервер ровно один раз!
    const serverItem = await this.sendToServer('/api/items', 'POST', created);
    if (serverItem && serverItem.id) {
      // Обновляем локальный кэш без дублирования
      const index = this.db.items.findIndex((i) => i.id === serverItem.id);
      if (index >= 0) {
        this.db.items[index] = serverItem;
      }
      this.saveToStorage(this.db);
      return serverItem;
    }
    return created;
  }

  public updateItem(id: string, updates: Partial<InventoryItem>): InventoryItem {
    const now = new Date().toISOString();
    let updatedItem: InventoryItem | null = null;

    let catName = updates.parameters?.category;
    if (updates.category_id) {
      const cat = this.getCategory(updates.category_id);
      if (cat) catName = cat.name;
    }

    const items = this.db.items.map((i) => {
      if (i.id === id) {
        updatedItem = {
          ...i,
          ...updates,
          parameters: {
            ...i.parameters,
            ...updates.parameters,
            category: catName !== undefined ? catName : i.parameters?.category,
          },
          updated_at: now,
        };
        return updatedItem;
      }
      return i;
    });

    if (!updatedItem) throw new Error('Вещь не найдена');

    this.db = {
      ...this.db,
      items: deduplicateById(items),
      last_updated: now,
    };
    this.saveToStorage(this.db);
    return updatedItem;
  }

  public async updateItemAsync(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const updated = this.updateItem(id, updates);
    // Отправляем ровно один PUT запрос
    const serverItem = await this.sendToServer(`/api/items/${encodeURIComponent(id)}`, 'PUT', updated);
    if (serverItem && serverItem.id) {
      return serverItem;
    }
    return updated;
  }

  public deleteItem(id: string): void {
    const item = this.getItem(id);
    this.db = {
      ...this.db,
      items: deduplicateById(this.db.items.filter((i) => i.id !== id)),
      last_updated: new Date().toISOString(),
    };
    this.saveToStorage(this.db);
    this.sendToServer(`/api/items/${encodeURIComponent(id)}`, 'DELETE');

    // Удаляем связанные фото из папки uploads
    if (item && item.photos) {
      item.photos.forEach((photo) => {
        if (photo.startsWith('uploads/') || photo.startsWith('/uploads/')) {
          this.sendToServer('/api/upload', 'DELETE', { path: photo, item_id: id });
        }
      });
    }
  }

  public deleteItems(ids: string[]): void {
    const set = new Set(ids);
    const toDelete = this.db.items.filter((i) => set.has(i.id));

    this.db = {
      ...this.db,
      items: deduplicateById(this.db.items.filter((i) => !set.has(i.id))),
      last_updated: new Date().toISOString(),
    };
    this.saveToStorage(this.db);

    ids.forEach((id) => {
      this.sendToServer(`/api/items/${encodeURIComponent(id)}`, 'DELETE');
    });

    // Удаляем связанные фото всех удаленных вещей
    toDelete.forEach((item) => {
      if (item && item.photos) {
        item.photos.forEach((photo) => {
          if (photo.startsWith('uploads/') || photo.startsWith('/uploads/')) {
            this.sendToServer('/api/upload', 'DELETE', { path: photo, item_id: item.id });
          }
        });
      }
    });
  }

  public async moveItems(itemIds: string[], newLocationId: string): Promise<void> {
    const loc = this.getLocation(newLocationId);
    if (!loc) throw new Error('Целевое место не найдено');

    const set = new Set(itemIds);
    const now = new Date().toISOString();

    this.db = {
      ...this.db,
      items: deduplicateById(
        this.db.items.map((item) => {
          if (set.has(item.id)) {
            return {
              ...item,
              location_id: newLocationId,
              updated_at: now,
            };
          }
          return item;
        })
      ),
      last_updated: now,
    };
    this.saveToStorage(this.db);
    try {
      const res = await this.sendToServer('/api/items/move', 'POST', {
        item_ids: itemIds,
        new_location_id: newLocationId,
      });
      if (res) {
        // Синхронизируем обновленные пути фото из новых подпапок сервера
        await this.syncWithServer();
      }
    } catch (e) {
      console.warn('moveItems server sync error:', e);
    }
  }

  // Поиск по вхождению (LIKE/ILIKE) в названии, описании, артикуле, штрихкоде, коде места и категории
  public searchItems(
    query: string,
    locationFilterId?: string,
    categoryFilterId?: string
  ): InventoryItem[] {
    const cleanQuery = query.trim().toLowerCase();
    let pool = deduplicateById(this.db.items);

    // Фильтр по локации
    if (locationFilterId) {
      const allSubLocationIds = [locationFilterId, ...this.getDescendantLocationIds(locationFilterId)];
      pool = pool.filter((item) => allSubLocationIds.includes(item.location_id));
    }

    // Фильтр по категории (включая дочерние категории)
    if (categoryFilterId) {
      const allSubCategoryIds = [categoryFilterId, ...this.getDescendantCategoryIds(categoryFilterId)];
      const targetCat = this.getCategory(categoryFilterId);
      const catName = targetCat ? targetCat.name.toLowerCase() : '';

      pool = pool.filter((item) => {
        if (item.category_id && allSubCategoryIds.includes(item.category_id)) {
          return true;
        }
        if (catName && item.parameters?.category && item.parameters.category.toLowerCase() === catName) {
          return true;
        }
        return false;
      });
    }

    if (!cleanQuery) return pool;

    return pool.filter((item) => {
      const loc = this.getLocation(item.location_id);
      const locCode = loc ? loc.full_code.toLowerCase() : '';
      const locName = loc ? loc.name.toLowerCase() : '';

      const cat = item.category_id ? this.getCategory(item.category_id) : undefined;
      const catName = cat ? cat.name.toLowerCase() : '';

      return (
        item.name.toLowerCase().includes(cleanQuery) ||
        (item.description && item.description.toLowerCase().includes(cleanQuery)) ||
        (item.sku && item.sku.toLowerCase().includes(cleanQuery)) ||
        (item.barcode && item.barcode.toLowerCase().includes(cleanQuery)) ||
        (item.parameters?.category && item.parameters.category.toLowerCase().includes(cleanQuery)) ||
        (item.parameters?.notes && item.parameters.notes.toLowerCase().includes(cleanQuery)) ||
        catName.includes(cleanQuery) ||
        locCode.includes(cleanQuery) ||
        locName.includes(cleanQuery)
      );
    });
  }

  // Генерация артикула и штрихкода
  public generateBarcode(): string {
    const prefix = '792';
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const full12 = `${prefix}${randomDigits.slice(0, 9)}`;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(full12[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return `${full12}${checksum}`;
  }

  public generateSKU(prefix = 'INV'): string {
    const randomHex = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${randomHex}`;
  }

  // Экспорт базы данных в JSON для сервера Go
  public exportDatabaseJSON(): string {
    const exportData: InventoryDatabase = {
      ...this.db,
      categories: this.getCategories(),
      exported_at: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Импорт базы данных из JSON
  public importDatabaseJSON(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || !Array.isArray(parsed.locations) || !Array.isArray(parsed.items)) {
        throw new Error('Некорректная структура файла JSON базы данных');
      }

      const recomputed = this.recomputeAllCodes(deduplicateById(parsed.locations));
      this.db = {
        version: parsed.version || '1.0.0',
        app_name: parsed.app_name || 'Домашний Склад',
        exported_at: new Date().toISOString(),
        locations: recomputed,
        categories: deduplicateById(Array.isArray(parsed.categories) ? parsed.categories : INITIAL_CATEGORIES),
        items: deduplicateById(parsed.items),
      };
      this.saveToStorage(this.db);
      return true;
    } catch (e) {
      console.error('Ошибка импорта базы данных:', e);
      return false;
    }
  }

  public resetToSampleData(): void {
    this.db = {
      version: '1.0.0',
      app_name: 'Домашний Склад & Инвентаризация',
      exported_at: new Date().toISOString(),
      locations: deduplicateById(INITIAL_LOCATIONS),
      categories: deduplicateById(INITIAL_CATEGORIES),
      items: deduplicateById(INITIAL_ITEMS),
    };
    this.saveToStorage(this.db);
  }
}

export const inventoryManager = new InventoryStorageManager();
