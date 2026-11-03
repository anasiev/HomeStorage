/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Edit2,
  Trash2,
  FolderSync,
  GripVertical,
  Plus,
  Tag,
} from 'lucide-react';
import { CategoryNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface CategoriesTreeViewProps {
  categories: CategoryNode[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onAddSubCategory: (parentId: string) => void;
  onEditCategory: (category: CategoryNode) => void;
  onDeleteCategory: (category: CategoryNode) => void;
  onCategoriesChanged: () => void;
}

export const CategoriesTreeView: React.FC<CategoriesTreeViewProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddSubCategory,
  onEditCategory,
  onDeleteCategory,
  onCategoriesChanged,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'cat-parts': true,
    'cat-hardware': true,
    'cat-electronics': true,
  });

  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, cat: CategoryNode) => {
    e.stopPropagation();
    setDraggedCatId(cat.id);
    e.dataTransfer.setData('text/plain', cat.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, cat: CategoryNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCatId && draggedCatId !== cat.id) {
      const descendants = inventoryManager.getDescendantCategoryIds(draggedCatId);
      if (!descendants.includes(cat.id)) {
        setDropTargetId(cat.id);
        e.dataTransfer.dropEffect = 'move';
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetCat: CategoryNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    if (draggedCatId && draggedCatId !== targetCat.id) {
      const descendants = inventoryManager.getDescendantCategoryIds(draggedCatId);
      if (!descendants.includes(targetCat.id)) {
        try {
          inventoryManager.moveCategory(draggedCatId, targetCat.id);
          onCategoriesChanged();
        } catch (err: any) {
          alert(err?.message || 'Не удалось переместить категорию');
        }
      }
    }
    setDraggedCatId(null);
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

  const renderTree = (parentId: string | null, depth = 0) => {
    const children = getCategoryChildren(parentId);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-1 ${depth > 0 ? 'ml-3 sm:ml-4 border-l border-neutral-200/80 pl-2' : ''}`}>
        {children.map((cat) => {
          const catChildren = getCategoryChildren(cat.id);
          const hasChildren = catChildren.length > 0;
          const isExpanded = !!expandedNodes[cat.id];
          const isSelected = selectedCategoryId === cat.id;
          const isDropTarget = dropTargetId === cat.id;
          const isDragging = draggedCatId === cat.id;

          const itemsInCat = inventoryManager.getItemsForCategory(cat.id, true);

          return (
            <div key={cat.id} className="select-none">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, cat)}
                onDragOver={(e) => handleDragOver(e, cat)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cat)}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className={`group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-950 font-semibold shadow-2xs'
                    : isDropTarget
                    ? 'bg-blue-100 border-blue-500 scale-[1.01]'
                    : isDragging
                    ? 'opacity-40 border-dashed border-neutral-400 bg-neutral-100'
                    : 'border-transparent hover:bg-neutral-100 text-neutral-800'
                }`}
              >
                {/* Левая часть */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div
                    className="cursor-grab active:cursor-grabbing text-neutral-300 group-hover:text-neutral-500"
                    title="Перетащите для перемещения в другую категорию"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(cat.id, e)}
                      className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4.5" />
                  )}

                  {/* Цветная иконка или точка */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#0284c7' }}
                  />

                  {/* Название */}
                  <span className="text-xs truncate font-medium">
                    {cat.name}
                  </span>

                  {/* Счетчик вещей в категории */}
                  {itemsInCat.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold shrink-0 ml-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-200/80 text-neutral-700'
                      }`}
                      title={`${itemsInCat.length} вещей в этой категории и подкатегориях`}
                    >
                      {itemsInCat.length}
                    </span>
                  )}
                </div>

                {/* Правая часть: действия при наведении */}
                <div
                  className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onAddSubCategory(cat.id)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-blue-700 hover:bg-white"
                    title="Добавить подкатегорию"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditCategory(cat)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-amber-700 hover:bg-white"
                    title="Редактировать / Переименовать / Переместить"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(cat)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-rose-700 hover:bg-white"
                    title="Удалить категорию"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {hasChildren && isExpanded && renderTree(cat.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-3.5 shadow-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
        <div className="flex items-center gap-1.5">
          <FolderTree className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Дерево категорий каталога
          </h4>
        </div>
        {selectedCategoryId && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-[11px] text-blue-600 hover:underline font-medium"
          >
            Сбросить фильтр
          </button>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-1">
        {getCategoryChildren(null).length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">
            Категорий пока нет. Нажмите «Создать категорию».
          </div>
        ) : (
          renderTree(null, 0)
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Перетаскивайте для смены родителя</span>
        <span className="font-mono text-blue-700 font-semibold">
          Категорий: {categories.length}
        </span>
      </div>
    </div>
  );
};
