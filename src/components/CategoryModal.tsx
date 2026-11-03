/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FolderTree,
  FolderPlus,
  Edit2,
  FolderSync,
  Check,
  Tag,
  Palette,
} from 'lucide-react';
import { CategoryNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySaved: (category: CategoryNode) => void;
  categories: CategoryNode[];
  initialCategory?: CategoryNode | null; // Если передано - режим редактирования/переименования
  initialParentId?: string | null;      // Если создаем подкатегорию
}

const CATEGORY_COLORS = [
  '#0284c7', // Синий
  '#0ea5e9', // Небесный
  '#10b981', // Изумрудный
  '#059669', // Зеленый
  '#f59e0b', // Янтарный
  '#ea580c', // Оранжевый
  '#8b5cf6', // Фиолетовый
  '#ec4899', // Розовый
  '#64748b', // Серый
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategorySaved,
  categories,
  initialCategory,
  initialParentId = null,
}) => {
  const isEdit = !!initialCategory;

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setParentId(initialCategory.parent_id);
      setDescription(initialCategory.description || '');
      setColor(initialCategory.color || '#0284c7');
    } else {
      setName('');
      setParentId(initialParentId);
      setDescription('');
      setColor('#0284c7');
    }
    setError(null);
  }, [initialCategory, initialParentId, isOpen]);

  if (!isOpen) return null;

  // Исключаем текущую категорию и её потомков из списка возможных родителей
  const invalidParentIds = initialCategory
    ? new Set([initialCategory.id, ...inventoryManager.getDescendantCategoryIds(initialCategory.id)])
    : new Set<string>();

  const allowedParents = categories.filter((c) => !invalidParentIds.has(c.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter category name');
      return;
    }

    try {
      const normalizedParentId = parentId && parentId.trim() ? parentId.trim() : null;

      if (isEdit && initialCategory) {
        if (normalizedParentId !== (initialCategory.parent_id || null)) {
          inventoryManager.moveCategory(initialCategory.id, normalizedParentId);
        }
        const updated = inventoryManager.updateCategory(initialCategory.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          parent_id: normalizedParentId,
        });
        onCategorySaved(updated);
      } else {
        const created = inventoryManager.addCategory({
          name: name.trim(),
          parent_id: normalizedParentId,
          description: description.trim() || undefined,
          color,
        });
        onCategorySaved(created);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save category');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400">
              {isEdit ? <Edit2 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isEdit ? 'Edit Category' : 'Create Category'}
              </h3>
              <p className="text-xs text-neutral-400">
                {isEdit ? 'Rename and relocate within tree' : 'Add a new catalog category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* 1. Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Appliance Spare Parts or Hand Tools"
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 2. Parent Category */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
              <span>Parent Category:</span>
              <span className="text-[11px] text-neutral-500 font-normal">
                {parentId ? 'Nested Subcategory' : 'Root Category'}
              </span>
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Root Category (Top Level) --</option>
              {allowedParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {inventoryManager.getCategoryPathString(cat.id)}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Color accent */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-neutral-500" />
              <span>Color accent:</span>
            </label>
            <div className="flex items-center gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-neutral-900 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 4. Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Items and equipment included in this category..."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
