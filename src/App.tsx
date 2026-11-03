/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  PackagePlus,
  ArrowRightLeft,
  Trash2,
  Printer,
  Layers,
  MapPin,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  Image as ImageIcon,
  FolderPlus,
  FolderTree,
  FolderSync,
  Edit2,
  Plus,
} from 'lucide-react';
import { InventoryItem, LocationNode, CategoryNode } from './types/inventory';
import { inventoryManager } from './utils/inventoryStorage';
import { Sidebar } from './components/Sidebar';
import { GlobalSearch } from './components/GlobalSearch';
import { ItemCard } from './components/ItemCard';
import { LocationsTreeView } from './components/LocationsTreeView';
import { CategoriesTreeView } from './components/CategoriesTreeView';
import { AddItemModal } from './components/AddItemModal';
import { AddLocationModal } from './components/AddLocationModal';
import { EditLocationModal } from './components/EditLocationModal';
import { DeleteLocationModal } from './components/DeleteLocationModal';
import { MoveLocationModal } from './components/MoveLocationModal';
import { MoveItemModal } from './components/MoveItemModal';
import { DeleteItemsModal } from './components/DeleteItemsModal';
import { LabelPrintModal } from './components/LabelPrintModal';
import { CategoryModal } from './components/CategoryModal';
import { DeleteCategoryModal } from './components/DeleteCategoryModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { GoBackendModal } from './components/GoBackendModal';

export default function App() {
  // Состояние данных
  const [locations, setLocations] = useState<LocationNode[]>(() =>
    inventoryManager.getLocations()
  );
  const [categories, setCategories] = useState<CategoryNode[]>(() =>
    inventoryManager.getCategories()
  );
  const [items, setItems] = useState<InventoryItem[]>(() =>
    inventoryManager.getItems()
  );

  // Навигация и фильтры
  const [activeView, setActiveView] = useState<'items' | 'tree' | 'categories'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Состояние модальных окон
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [targetParentLocationId, setTargetParentLocationId] = useState<string | null>(null);
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationNode | null>(null);
  const [isDeleteLocationOpen, setIsDeleteLocationOpen] = useState(false);
  const [targetDeleteLocation, setTargetDeleteLocation] = useState<LocationNode | null>(null);
  const [isMoveLocationOpen, setIsMoveLocationOpen] = useState(false);
  const [targetMoveLocationId, setTargetMoveLocationId] = useState<string | undefined>(undefined);
  const [isMoveItemOpen, setIsMoveItemOpen] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<InventoryItem[]>([]);
  const [isDeleteItemsOpen, setIsDeleteItemsOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<InventoryItem[]>([]);
  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
  const [printTargetLocation, setPrintTargetLocation] = useState<LocationNode | null>(null);
  const [printTargetItem, setPrintTargetItem] = useState<InventoryItem | null>(null);
  const [isGoDocsOpen, setIsGoDocsOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Модальные окна категорий
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  const [parentCategoryIdForNew, setParentCategoryIdForNew] = useState<string | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [targetDeleteCategory, setTargetDeleteCategory] = useState<CategoryNode | null>(null);

  // Модальное окно детального просмотра карточки товара
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Обновление состояния из менеджера
  const refreshData = () => {
    setLocations(inventoryManager.getLocations());
    setCategories(inventoryManager.getCategories());
    setItems(inventoryManager.getItems());
  };

  // Автоматическая синхронизация с автономным Go-сервером (при запуске на http://localhost:8080)
  useEffect(() => {
    inventoryManager.syncWithServer().then((synced) => {
      if (synced) {
        refreshData();
      }
    });
  }, []);

  // Фильтрация вещей по глобальному поиску, локации и категории
  const filteredItems = useMemo(() => {
    let result = inventoryManager.searchItems(
      searchQuery,
      selectedLocationId || undefined,
      selectedCategoryId || undefined
    );

    if (selectedCategoryName && !selectedCategoryId) {
      result = result.filter(
        (it) => it.parameters?.category?.toLowerCase() === selectedCategoryName.toLowerCase()
      );
    }

    return result;
  }, [searchQuery, selectedLocationId, selectedCategoryId, selectedCategoryName, items, locations, categories]);

  // Выбор элемента чекбоксом
  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Быстрые обработчики из карточки
  const handleViewItem = (item: InventoryItem) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddItemOpen(true);
  };

  const handleDeleteSingleItem = (item: InventoryItem) => {
    setItemsToDelete([item]);
    setIsDeleteItemsOpen(true);
  };

  const handleMoveSingleItem = (item: InventoryItem) => {
    setItemsToMove([item]);
    setIsMoveItemOpen(true);
  };

  const handlePrintItemLabel = (item: InventoryItem) => {
    setPrintTargetItem(item);
    setPrintTargetLocation(null);
    setIsPrintLabelOpen(true);
  };

  const handlePrintLocationLabel = (loc: LocationNode) => {
    setPrintTargetLocation(loc);
    setPrintTargetItem(null);
    setIsPrintLabelOpen(true);
  };

  // Действия из левого меню
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsAddItemOpen(true);
  };

  const handleOpenDeleteItems = () => {
    if (selectedItemIds.length > 0) {
      const selected = items.filter((i) => selectedItemIds.includes(i.id));
      setItemsToDelete(selected);
      setIsDeleteItemsOpen(true);
    } else {
      alert('Сначала отметьте галочками одну или несколько вещей в каталоге для удаления.');
    }
  };

  const handleOpenMoveItems = () => {
    if (selectedItemIds.length > 0) {
      const selected = items.filter((i) => selectedItemIds.includes(i.id));
      setItemsToMove(selected);
      setIsMoveItemOpen(true);
    } else {
      alert('Сначала отметьте галочками одну или несколько вещей для перемещения.');
    }
  };

  const handleOpenAddLocation = (parentId?: string) => {
    setTargetParentLocationId(parentId !== undefined ? parentId : selectedLocationId);
    setIsAddLocationOpen(true);
  };

  const handleOpenEditLocation = (loc?: LocationNode) => {
    const target = loc || (selectedLocationId ? inventoryManager.getLocation(selectedLocationId) : null) || locations[0] || null;
    if (!target && locations.length === 0) {
      alert('В базе еще нет мест хранения. Сначала создайте место через кнопку «Добавить место».');
      return;
    }
    setEditingLocation(target);
    setIsEditLocationOpen(true);
  };

  const handleOpenDeleteLocation = (loc?: LocationNode) => {
    const target = loc || (selectedLocationId ? inventoryManager.getLocation(selectedLocationId) : null) || locations[0] || null;
    if (!target && locations.length === 0) {
      alert('В базе еще нет мест хранения для удаления.');
      return;
    }
    setTargetDeleteLocation(target);
    setIsDeleteLocationOpen(true);
  };

  const handleOpenMoveLocation = (loc?: LocationNode) => {
    if (locations.length === 0) {
      alert('В базе еще нет мест хранения для перемещения.');
      return;
    }
    setTargetMoveLocationId(loc ? loc.id : (selectedLocationId || locations[0]?.id));
    setIsMoveLocationOpen(true);
  };

  // Действия для категорий
  const handleOpenAddCategory = (parentId?: string | null) => {
    setEditingCategory(null);
    setParentCategoryIdForNew(parentId !== undefined ? parentId : null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryNode) => {
    setEditingCategory(cat);
    setParentCategoryIdForNew(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenDeleteCategory = (cat: CategoryNode) => {
    setTargetDeleteCategory(cat);
    setIsDeleteCategoryModalOpen(true);
  };

  // Экспорт и импорт db.json
  const handleExportDb = () => {
    const jsonStr = inventoryManager.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'db.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && inventoryManager.importDatabaseJSON(content)) {
        refreshData();
        alert('База данных успешно импортирована из db.json!');
      } else {
        alert('Ошибка при импорте. Убедитесь, что файл имеет корректный формат db.json.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (confirm('Сбросить базу данных и вернуть демонстрационные примеры?')) {
      inventoryManager.resetToSampleData();
      refreshData();
      setSelectedLocationId(null);
      setSelectedCategoryId(null);
      setSelectedCategoryName('');
      setSelectedItemIds([]);
    }
  };

  const selectedLocation = selectedLocationId
    ? inventoryManager.getLocation(selectedLocationId)
    : null;

  const selectedCategoryNode = selectedCategoryId
    ? inventoryManager.getCategory(selectedCategoryId)
    : null;

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Скрытый инпут для импорта db.json */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Левая боковая панель с функциями */}
      <Sidebar
        onOpenAddItem={handleOpenAddItem}
        onOpenDeleteItems={handleOpenDeleteItems}
        onOpenMoveItems={handleOpenMoveItems}
        onOpenAddLocation={() => handleOpenAddLocation()}
        onOpenEditLocation={() => handleOpenEditLocation()}
        onOpenDeleteLocation={() => handleOpenDeleteLocation()}
        onOpenMoveLocation={() => handleOpenMoveLocation()}
        onOpenShowLocations={() => {
          setActiveView('tree');
        }}
        onOpenAddCategory={() => handleOpenAddCategory(null)}
        onOpenShowCategories={() => {
          setActiveView('categories');
        }}
        selectedItemsCount={selectedItemIds.length}
        totalItems={items.length}
        totalLocations={locations.length}
        totalCategories={categories.length}
        activeView={activeView}
        setActiveView={setActiveView}
        onExportDb={handleExportDb}
        onImportDbClick={() => importFileInputRef.current?.click()}
        onOpenGoDocs={() => setIsGoDocsOpen(true)}
        onResetData={handleResetData}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Основная рабочая область справа от сайдбара */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Мобильный верхний бар */}
        <header className="lg:hidden sticky top-0 z-30 bg-neutral-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <span>Домашний Склад</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 font-normal">
                v1.1
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenAddItem}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Добавить</span>
          </button>
        </header>

        {/* Главная часть */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {/* Центрированный глобальный живой поиск */}
          <div className="pt-2 pb-1">
            <div className="text-center mb-3">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Быстрый поиск вещей и деталей
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Иерархия мест (Дом &rarr; Шкаф &rarr; Полка &rarr; Коробка) и дерево категорий
              </p>
            </div>

            <GlobalSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLocationFilter={selectedLocationId}
              onClearLocationFilter={() => setSelectedLocationId(null)}
              selectedCategoryId={selectedCategoryId}
              onClearCategoryFilter={() => {
                setSelectedCategoryId(null);
                setSelectedCategoryName('');
              }}
              selectedCategoryName={selectedCategoryName}
              onSelectCategoryName={(name) => {
                setSelectedCategoryName(name);
                setSelectedCategoryId(null);
              }}
              categories={categories}
              viewMode={viewMode}
              onToggleViewMode={setViewMode}
              totalResults={filteredItems.length}
            />
          </div>

          {/* Плавающий бар пакетных действий при выборе нескольких вещей */}
          {selectedItemIds.length > 0 && (
            <div className="sticky top-4 z-20 bg-neutral-900 text-white p-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>
                  Выбрано позиций: <strong className="text-emerald-400 font-mono">{selectedItemIds.length}</strong>
                </span>
                <button
                  onClick={() => setSelectedItemIds([])}
                  className="text-neutral-400 hover:text-white underline ml-2 font-normal"
                >
                  Снять выбор
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenMoveItems}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Переместить выбранные
                </button>
                <button
                  onClick={handleOpenDeleteItems}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить ({selectedItemIds.length})
                </button>
              </div>
            </div>
          )}

          {/* РЕЖИМ 1: Дерево категорий каталога */}
          {activeView === 'categories' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1 space-y-4">
                <CategoriesTreeView
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={(id) => setSelectedCategoryId(id)}
                  onAddSubCategory={(parentId) => handleOpenAddCategory(parentId)}
                  onEditCategory={(cat) => handleOpenEditCategory(cat)}
                  onDeleteCategory={(cat) => handleOpenDeleteCategory(cat)}
                  onCategoriesChanged={refreshData}
                />

                <button
                  onClick={() => handleOpenAddCategory(null)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  <span>Создать корневую категорию</span>
                </button>
              </div>

              {/* Список вещей внутри выбранной категории */}
              <div className="lg:col-span-2 space-y-4">
                {selectedCategoryNode ? (
                  <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: selectedCategoryNode.color || '#0284c7' }}
                        />
                        <h3 className="font-bold text-base text-neutral-900">
                          {selectedCategoryNode.name}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {inventoryManager.getCategoryPathString(selectedCategoryNode.id)}
                      </p>
                      {selectedCategoryNode.description && (
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                          {selectedCategoryNode.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditCategory(selectedCategoryNode)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleOpenAddCategory(selectedCategoryNode.id)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Подкатегория
                      </button>
                      <button
                        onClick={handleOpenAddItem}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        Добавить вещь
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Кликните на любую категорию в дереве слева, чтобы отфильтровать хранящиеся там вещи.
                    </span>
                  </div>
                )}

                {/* Вывод списка карточек для категорий */}
                {filteredItems.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center space-y-3">
                    <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto">
                      <FolderTree className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-neutral-800">
                      В этой категории пока нет вещей
                    </h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Нажмите «Добавить вещь» или назначьте эту категорию при редактировании карточек.
                    </p>
                    <button
                      onClick={handleOpenAddItem}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Добавить вещь
                    </button>
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                        : 'space-y-2.5'
                    }
                  >
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItemIds.includes(item.id)}
                        onToggleSelect={handleToggleSelect}
                        onView={handleViewItem}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteSingleItem}
                        onMove={handleMoveSingleItem}
                        onPrintLabel={handlePrintItemLabel}
                        onImageClick={(url) => setPreviewImageUrl(url)}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeView === 'tree' ? (
            /* РЕЖИМ 2: Дерево мест хранения (4 уровня) */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1 space-y-4">
                <LocationsTreeView
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  onSelectLocation={(id) => setSelectedLocationId(id)}
                  onAddSubLocation={(parentId) => handleOpenAddLocation(parentId)}
                  onEditLocation={(loc) => handleOpenEditLocation(loc)}
                  onPrintLocationLabel={handlePrintLocationLabel}
                  onDeleteLocation={(loc) => handleOpenDeleteLocation(loc)}
                  onMoveLocation={(loc) => handleOpenMoveLocation(loc)}
                  onLocationMoved={refreshData}
                />
              </div>

              {/* Список вещей внутри выбранного места дерева */}
              <div className="lg:col-span-2 space-y-4">
                {selectedLocation ? (
                  <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold px-2 py-0.5 rounded-lg bg-neutral-900 text-emerald-400">
                          {selectedLocation.full_code}
                        </span>
                        <h3 className="font-bold text-base text-neutral-900">
                          {selectedLocation.name}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {inventoryManager.getLocationPathString(selectedLocation.id)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleOpenMoveLocation(selectedLocation)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Переместить это место"
                      >
                        <FolderSync className="w-3.5 h-3.5 text-purple-600" />
                        Переместить
                      </button>
                      <button
                        onClick={() => handleOpenEditLocation(selectedLocation)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleOpenDeleteLocation(selectedLocation)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Удалить это место"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        Удалить
                      </button>
                      <button
                        onClick={() => handlePrintLocationLabel(selectedLocation)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-neutral-500" />
                        Печать этикетки места
                      </button>
                      <button
                        onClick={handleOpenAddItem}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        Положить вещь сюда
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Кликните на любую полку или коробку в дереве слева, чтобы отфильтровать хранящиеся там вещи.
                    </span>
                  </div>
                )}

                {/* Вывод списка карточек */}
                {filteredItems.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center space-y-3">
                    <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-neutral-800">
                      В этом месте пока нет вещей
                    </h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Нажмите кнопку «Добавить вещь», чтобы зарегистрировать новую деталь или перенесите существующую.
                    </p>
                    <button
                      onClick={handleOpenAddItem}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Добавить вещь
                    </button>
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                        : 'space-y-2.5'
                    }
                  >
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItemIds.includes(item.id)}
                        onToggleSelect={handleToggleSelect}
                        onView={handleViewItem}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteSingleItem}
                        onMove={handleMoveSingleItem}
                        onPrintLabel={handlePrintItemLabel}
                        onImageClick={(url) => setPreviewImageUrl(url)}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* РЕЖИМ 3: Каталог вещей (Основной режим) */
            <div className="space-y-4">
              {/* Подсказка если активен фильтр места */}
              {selectedLocation && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded">
                      [{selectedLocation.full_code}]
                    </span>
                    <span className="text-neutral-700">
                      Отображаются вещи в:{' '}
                      <strong className="text-neutral-900">
                        {inventoryManager.getLocationPathString(selectedLocation.id)}
                      </strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedLocationId(null)}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Показать все места
                  </button>
                </div>
              )}

              {/* Результаты живого поиска */}
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto">
                    <PackagePlus className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-base text-neutral-800">
                    {searchQuery ? 'Ничего не найдено по запросу' : 'Склад пуст'}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    {searchQuery
                      ? `По запросу «${searchQuery}» совпадений не обнаружено. Проверьте артикул, категорию или адрес.`
                      : 'Добавьте первую вещь или импортируйте базу данных db.json.'}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Очистить поиск
                      </button>
                    )}
                    <button
                      onClick={handleOpenAddItem}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Добавить новую вещь
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'space-y-2.5'
                  }
                >
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItemIds.includes(item.id)}
                      onToggleSelect={handleToggleSelect}
                      onView={handleViewItem}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteSingleItem}
                      onMove={handleMoveSingleItem}
                      onPrintLabel={handlePrintItemLabel}
                      onImageClick={(url) => setPreviewImageUrl(url)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Модальные окна */}
      <AddItemModal
        key={editingItem ? `edit-${editingItem.id}` : 'new-item'}
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setEditingItem(null);
        }}
        onItemAdded={() => {
          refreshData();
        }}
        locations={locations}
        initialLocationId={selectedLocationId || undefined}
        initialItem={editingItem}
        onOpenCreateCategory={() => handleOpenAddCategory(null)}
      />

      <AddLocationModal
        isOpen={isAddLocationOpen}
        onClose={() => setIsAddLocationOpen(false)}
        onLocationAdded={() => {
          refreshData();
        }}
        locations={locations}
        initialParentId={targetParentLocationId}
      />

      <EditLocationModal
        isOpen={isEditLocationOpen}
        onClose={() => {
          setIsEditLocationOpen(false);
          setEditingLocation(null);
        }}
        onLocationUpdated={() => {
          refreshData();
        }}
        location={editingLocation}
        locations={locations}
      />

      <DeleteLocationModal
        isOpen={isDeleteLocationOpen}
        onClose={() => {
          setIsDeleteLocationOpen(false);
          setTargetDeleteLocation(null);
        }}
        onLocationDeleted={() => {
          refreshData();
          setSelectedLocationId(null);
        }}
        location={targetDeleteLocation}
        locations={locations}
        onTriggerMoveItems={(locationId) => {
          const itemsInside = items.filter((i) => i.location_id === locationId);
          setItemsToMove(itemsInside);
          setIsMoveItemOpen(true);
        }}
      />

      <MoveLocationModal
        key={targetMoveLocationId ? `move-${targetMoveLocationId}` : 'move-loc-modal'}
        isOpen={isMoveLocationOpen}
        onClose={() => {
          setIsMoveLocationOpen(false);
          setTargetMoveLocationId(undefined);
        }}
        onLocationMoved={() => {
          refreshData();
        }}
        locations={locations}
        initialLocationId={targetMoveLocationId}
      />

      <MoveItemModal
        isOpen={isMoveItemOpen}
        onClose={() => {
          setIsMoveItemOpen(false);
          setItemsToMove([]);
        }}
        onItemsMoved={() => {
          refreshData();
          setSelectedItemIds([]);
        }}
        selectedItems={itemsToMove}
        locations={locations}
      />

      <DeleteItemsModal
        isOpen={isDeleteItemsOpen}
        onClose={() => {
          setIsDeleteItemsOpen(false);
          setItemsToDelete([]);
        }}
        onItemsDeleted={() => {
          refreshData();
          setSelectedItemIds([]);
        }}
        itemsToDelete={itemsToDelete}
      />

      <LabelPrintModal
        isOpen={isPrintLabelOpen}
        onClose={() => {
          setIsPrintLabelOpen(false);
          setPrintTargetLocation(null);
          setPrintTargetItem(null);
        }}
        targetLocation={printTargetLocation}
        targetItem={printTargetItem}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setParentCategoryIdForNew(null);
        }}
        onCategorySaved={() => {
          refreshData();
        }}
        categories={categories}
        initialCategory={editingCategory}
        initialParentId={parentCategoryIdForNew}
      />

      <DeleteCategoryModal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => {
          setIsDeleteCategoryModalOpen(false);
          setTargetDeleteCategory(null);
        }}
        onCategoryDeleted={() => {
          refreshData();
          setSelectedCategoryId(null);
        }}
        category={targetDeleteCategory}
      />

      <GoBackendModal
        isOpen={isGoDocsOpen}
        onClose={() => setIsGoDocsOpen(false)}
      />

      <ItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingItem(null);
        }}
        item={viewingItem}
        onEdit={(item) => {
          setIsDetailModalOpen(false);
          handleEditItem(item);
        }}
        onDelete={(item) => {
          setIsDetailModalOpen(false);
          handleDeleteSingleItem(item);
        }}
        onMove={(item) => {
          setIsDetailModalOpen(false);
          handleMoveSingleItem(item);
        }}
        onPrintLabel={(item) => {
          handlePrintItemLabel(item);
        }}
        onSelectLocation={(locId) => {
          setSelectedLocationId(locId);
          setActiveView('tree');
          setIsDetailModalOpen(false);
        }}
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
          setActiveView('categories');
          setIsDetailModalOpen(false);
        }}
      />

      {/* Полноэкранный просмотр изображения */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-white/20">
            <img
              src={previewImageUrl}
              alt="Увеличенное фото"
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
