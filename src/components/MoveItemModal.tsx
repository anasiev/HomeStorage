/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  Package,
  Layers,
  MapPin,
  Check,
} from 'lucide-react';
import { InventoryItem, LocationNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface MoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsMoved: () => void;
  selectedItems: InventoryItem[];
  locations: LocationNode[];
  initialNewLocationId?: string;
}

export const MoveItemModal: React.FC<MoveItemModalProps> = ({
  isOpen,
  onClose,
  onItemsMoved,
  selectedItems,
  locations,
  initialNewLocationId,
}) => {
  const [targetLocationId, setTargetLocationId] = useState(
    initialNewLocationId || (locations[0]?.id ?? '')
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || selectedItems.length === 0) return null;

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLocationId) {
      setError('Выберите целевое место хранения');
      return;
    }

    try {
      const ids = selectedItems.map((i) => i.id);
      await inventoryManager.moveItems(ids, targetLocationId);
      onItemsMoved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка при перемещении вещей');
    }
  };

  const targetNode = locations.find((l) => l.id === targetLocationId);
  const targetPath = targetNode ? inventoryManager.getLocationPathString(targetNode.id) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Шапка */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Переместить {selectedItems.length === 1 ? 'вещь' : `${selectedItems.length} вещей`}
              </h3>
              <p className="text-xs text-neutral-400">
                Быстрая смена места хранения (location_id)
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

        {/* Форма */}
        <form onSubmit={handleMove} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Список перемещаемых вещей */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Перемещаемые вещи ({selectedItems.length}):
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
              {selectedItems.map((item) => {
                const currentLoc = locations.find((l) => l.id === item.location_id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-neutral-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-neutral-800 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 shrink-0 ml-2">
                      сейчас: {currentLoc?.full_code || '---'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Выбор нового места */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
              <span>Целевое место назначения <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-neutral-500">Куда положить</span>
            </label>
            <select
              value={targetLocationId}
              onChange={(e) => setTargetLocationId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  [{loc.full_code}] {inventoryManager.getLocationPathString(loc.id)} (
                  {loc.type === 'container'
                    ? 'Коробка'
                    : loc.type === 'shelf'
                    ? 'Полка'
                    : loc.type === 'furniture'
                    ? 'Мебель'
                    : 'Локация'}
                  )
                </option>
              ))}
            </select>
          </div>

          {/* Информационный бейдж нового адреса */}
          {targetNode && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950 font-mono">
                  Новый адрес: {targetNode.full_code}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  {targetPath}
                </div>
              </div>
            </div>
          )}

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
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Подтвердить перемещение
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
