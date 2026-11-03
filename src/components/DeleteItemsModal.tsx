/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, X, AlertTriangle, Package } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface DeleteItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsDeleted: () => void;
  itemsToDelete: InventoryItem[];
}

export const DeleteItemsModal: React.FC<DeleteItemsModalProps> = ({
  isOpen,
  onClose,
  onItemsDeleted,
  itemsToDelete,
}) => {
  if (!isOpen || itemsToDelete.length === 0) return null;

  const handleConfirm = () => {
    const ids = itemsToDelete.map((i) => i.id);
    inventoryManager.deleteItems(ids);
    onItemsDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Шапка */}
        <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-800 rounded-xl text-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Удаление {itemsToDelete.length === 1 ? 'вещи' : `${itemsToDelete.length} вещей`}
              </h3>
              <p className="text-xs text-rose-200">
                Подтверждение безвозвратного удаления из инвентаря
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

        {/* Тело */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              Вы уверены, что хотите удалить следующие позиции? Фотографии и карточки вещей будут удалены из базы.
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
            {itemsToDelete.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-neutral-200"
              >
                <div className="flex items-center gap-2 truncate">
                  <Package className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-semibold text-neutral-800 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 shrink-0 ml-2">
                  {item.sku || item.barcode}
                </span>
              </div>
            ))}
          </div>

          {/* Кнопки */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Да, удалить навсегда
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
