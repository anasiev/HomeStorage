/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  FolderTree,
  Tag,
  Package,
} from 'lucide-react';
import { CategoryNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryDeleted: () => void;
  category: CategoryNode | null;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryDeleted,
  category,
}) => {
  const [actionType, setActionType] = useState<'reassign_parent' | 'remove_category'>('reassign_parent');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const affectedItems = inventoryManager.getItemsForCategory(category.id, true);
  const descendants = inventoryManager.getDescendantCategoryIds(category.id);
  const parentCategory = category.parent_id
    ? inventoryManager.getCategory(category.parent_id)
    : null;

  const handleDelete = () => {
    try {
      inventoryManager.deleteCategory(category.id, {
        reassignParent: actionType === 'reassign_parent',
      });
      onCategoryDeleted();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-800 rounded-xl text-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Delete Category</h3>
              <p className="text-xs text-rose-200">
                Remove category node from catalog tree
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-neutral-100 rounded-xl border border-neutral-200">
            <span className="text-neutral-500 uppercase tracking-wider text-[10px] font-bold block">
              Category to delete:
            </span>
            <span className="text-sm font-bold text-neutral-900 block mt-0.5">
              {category.name}
            </span>
            <span className="text-neutral-500 text-[11px] block mt-0.5">
              {inventoryManager.getCategoryPathString(category.id)}
            </span>
          </div>

          {descendants.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Note: all nested subcategories ({descendants.length} pcs) will also be deleted.
              </div>
            </div>
          )}

          {/* Question about linked items */}
          <div className="space-y-2">
            <div className="font-semibold text-neutral-800 flex items-center justify-between">
              <span>Items linked in this category:</span>
              <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded-full font-bold">
                {affectedItems.length} pcs
              </span>
            </div>

            {affectedItems.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-neutral-600">What to do with linked items?</span>

                {parentCategory ? (
                  <label className="flex items-start gap-2 p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cat_action"
                      checked={actionType === 'reassign_parent'}
                      onChange={() => setActionType('reassign_parent')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-semibold text-neutral-800">
                        Move to parent category "{parentCategory.name}"
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Items stay in catalog one level higher
                      </div>
                    </div>
                  </label>
                ) : null}

                <label className="flex items-start gap-2 p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cat_action"
                    checked={actionType === 'remove_category'}
                    onChange={() => setActionType('remove_category')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="font-semibold text-neutral-800">
                      Leave items uncategorized
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Items will not be deleted, but category will be cleared
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Confirm Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
