/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Filter,
  Layers,
  MapPin,
  Tag,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Check,
} from 'lucide-react';
import { LocationNode, CategoryNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface GlobalSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocationFilter: string | null;
  onClearLocationFilter: () => void;
  selectedCategoryId: string | null;
  onClearCategoryFilter: () => void;
  selectedCategoryName: string;
  onSelectCategoryName: (categoryName: string) => void;
  categories: CategoryNode[];
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  totalResults: number;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedLocationFilter,
  onClearLocationFilter,
  selectedCategoryId,
  onClearCategoryFilter,
  selectedCategoryName,
  onSelectCategoryName,
  categories,
  viewMode,
  onToggleViewMode,
  totalResults,
}) => {
  const [isCategoryTreeOpen, setIsCategoryTreeOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'cat-parts': true,
    'cat-hardware': true,
    'cat-electronics': true,
  });

  const filterLocation = selectedLocationFilter
    ? inventoryManager.getLocation(selectedLocationFilter)
    : null;

  const filterCategory = selectedCategoryId
    ? inventoryManager.getCategory(selectedCategoryId)
    : null;

  const categoryPath = selectedCategoryId
    ? inventoryManager.getCategoryPathString(selectedCategoryId)
    : selectedCategoryName;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectCategory = (cat: CategoryNode | null) => {
    if (!cat) {
      onClearCategoryFilter();
      onSelectCategoryName('');
    } else {
      if (selectedCategoryId === cat.id || selectedCategoryName === cat.name) {
        onClearCategoryFilter();
        onSelectCategoryName('');
      } else {
        onSelectCategoryName(cat.name);
      }
    }
  };

  // Надежное получение дочерних категорий с нормализацией parent_id (null, undefined, '')
  const getCategoryChildren = (parentId: string | null): CategoryNode[] => {
    if (!categories || categories.length === 0) return [];
    const allCatIds = new Set(categories.map((c) => c.id));

    if (parentId === null) {
      // Корневые категории: parent_id равен null, undefined, '', либо ссылается на отсутствующего родителя
      return categories.filter((c) => !c.parent_id || !allCatIds.has(c.parent_id));
    }
    return categories.filter((c) => c.parent_id === parentId);
  };

  // Рекурсивный рендер раскрывающегося дерева категорий для мобильных и десктопа
  const renderCategoryNodes = (parentId: string | null, depth = 0): React.ReactNode => {
    const children = getCategoryChildren(parentId);
    if (children.length === 0) return null;

    return (
      <div
        className={`space-y-1 ${
          depth > 0 ? 'ml-3 sm:ml-4 pl-2 border-l-2 border-neutral-200' : ''
        }`}
      >
        {children.map((cat) => {
          const catChildren = getCategoryChildren(cat.id);
          const hasChildren = catChildren.length > 0;
          const isExpanded = !!expandedNodes[cat.id];
          const isSelected =
            selectedCategoryId === cat.id ||
            selectedCategoryName.toLowerCase() === cat.name.toLowerCase();
          const itemsInCat = inventoryManager.getItemsForCategory(cat.id, true);

          return (
            <div key={cat.id} className="select-none">
              <div
                onClick={() => handleSelectCategory(isSelected ? null : cat)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all border text-sm sm:text-base ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(cat.id, e)}
                      className={`p-1 rounded-lg transition-colors shrink-0 ${
                        isSelected
                          ? 'hover:bg-blue-700 text-white'
                          : 'hover:bg-neutral-200 text-neutral-500'
                      }`}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  ) : (
                    <span className="w-6 shrink-0" />
                  )}

                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: cat.color || '#0284c7' }}
                  />

                  <span className="truncate font-medium">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {itemsInCat.length > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200/80 text-neutral-700'
                      }`}
                    >
                      {itemsInCat.length}
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {hasChildren && isExpanded && (
                <div className="mt-1">
                  {renderCategoryNodes(cat.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const hasActiveCategory = !!selectedCategoryId || !!selectedCategoryName;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Centered main live search */}
      <div className="relative flex items-center shadow-lg rounded-2xl bg-white border border-neutral-300/80 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all overflow-hidden">
        <div className="pl-4 text-neutral-400 flex items-center justify-center">
          <Search className="w-5 h-5 text-emerald-600" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Live search by name, SKU, barcode, category, address code (h-w1-s3-b1)..."
          className="w-full py-3.5 pl-3 pr-10 text-base text-neutral-900 placeholder-neutral-400 focus:outline-hidden bg-transparent"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="p-2 mr-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Filter buttons & active tags */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category tree button */}
          <button
            type="button"
            onClick={() => setIsCategoryTreeOpen((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              isCategoryTreeOpen
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                : hasActiveCategory
                ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs'
                : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-300 shadow-2xs'
            }`}
          >
            <FolderTree className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {hasActiveCategory
                ? `Category: ${categoryPath || selectedCategoryName}`
                : `Category Tree (${categories.length})`}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isCategoryTreeOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Active location tag */}
          {filterLocation && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[200px]">
                [{filterLocation.full_code}] {filterLocation.name}
              </span>
              <button
                onClick={onClearLocationFilter}
                className="p-1 hover:bg-emerald-200 rounded-full transition-colors ml-1 text-emerald-800 cursor-pointer"
                title="Clear location filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active category tag */}
          {hasActiveCategory && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs">
              <Tag className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="truncate max-w-[200px]">{categoryPath}</span>
              <button
                onClick={() => {
                  onClearCategoryFilter();
                  onSelectCategoryName('');
                }}
                className="p-1 hover:bg-blue-200 rounded-full transition-colors ml-1 text-blue-800 cursor-pointer"
                title="Clear category filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right side: results count and grid/list view switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-sm text-neutral-600 font-medium">
            Found:{' '}
            <strong className="text-neutral-900 font-bold text-sm sm:text-base">
              {totalResults}
            </strong>
          </span>

          <div className="flex items-center bg-white border border-neutral-300 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('list')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Category Tree */}
      {isCategoryTreeOpen && (
        <div className="w-full max-w-full bg-white rounded-2xl border border-neutral-200 p-3 sm:p-4 shadow-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-700">
                Catalog Category Tree
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveCategory && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCategory(null);
                  }}
                  className="text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCategoryTreeOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                title="Collapse tree"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Option: "All categories" */}
          <div
            onClick={() => handleSelectCategory(null)}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all border text-sm sm:text-base ${
              !hasActiveCategory
                ? 'bg-neutral-900 text-white font-semibold shadow-xs border-neutral-900'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>All categories (no filter)</span>
            </div>
            {!hasActiveCategory && <Check className="w-4 h-4 stroke-[3]" />}
          </div>

          {/* Иерархическое дерево с раскрывающимися подпунктами */}
          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
            {renderCategoryNodes(null)}
          </div>
        </div>
      )}
    </div>
  );
};
