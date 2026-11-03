/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Layers,
  FolderPlus,
  Home,
  Warehouse,
  Box,
  Hash,
} from 'lucide-react';
import { LocationNode, LocationType, LOCATION_TYPE_CONFIGS } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationAdded: (loc: LocationNode) => void;
  locations: LocationNode[];
  initialParentId?: string | null;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationAdded,
  locations,
  initialParentId = null,
}) => {
  const [parentId, setParentId] = useState<string | null>(initialParentId);
  const [type, setType] = useState<LocationType>('container');
  const [name, setName] = useState('');
  const [codeSuffix, setCodeSuffix] = useState('');
  const [shelfNumber, setShelfNumber] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setParentId(initialParentId);
      setName('');
      setDescription('');
      setError(null);
      if (!initialParentId) {
        setType('location');
        setCodeSuffix('д');
      } else {
        const parent = locations.find((l) => l.id === initialParentId);
        if (parent) {
          if (parent.type === 'location') {
            setType('furniture');
            setCodeSuffix('ш1');
          } else if (parent.type === 'furniture') {
            setType('shelf');
            setCodeSuffix('п1');
            setShelfNumber(1);
          } else if (parent.type === 'shelf') {
            setType('container');
            setCodeSuffix('к1');
          }
        }
      }
    }
  }, [isOpen, initialParentId, locations]);

  if (!isOpen) return null;

  // Рассчитываем превью полного кода
  const calculatePreviewCode = () => {
    const suffix = codeSuffix.trim().toLowerCase() || 'код';
    if (!parentId) return suffix;

    const parentNode = locations.find((l) => l.id === parentId);
    if (!parentNode) return suffix;

    return `${parentNode.full_code || parentNode.code_suffix}-${suffix}`;
  };

  const handleTypeChange = (newType: LocationType) => {
    setType(newType);
    if (newType === 'location') {
      setParentId(null);
      setCodeSuffix('д');
    } else if (newType === 'furniture') {
      setCodeSuffix('ш1');
    } else if (newType === 'shelf') {
      setCodeSuffix('п1');
      setShelfNumber(1);
    } else if (newType === 'container') {
      setCodeSuffix('к1');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Укажите название места хранения');
      return;
    }
    if (type !== 'location' && !parentId) {
      setError('Для данного типа необходимо выбрать родительское место');
      return;
    }

    try {
      const created = inventoryManager.addLocation({
        name: name.trim(),
        type,
        parent_id: type === 'location' ? null : parentId,
        code_suffix: codeSuffix.trim().toLowerCase() || name.substring(0, 2).toLowerCase(),
        description: description.trim() || undefined,
        shelf_number: type === 'shelf' ? Number(shelfNumber) || 1 : undefined,
      });

      onLocationAdded(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Не удалось добавить место');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Шапка */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Добавить место хранения</h3>
              <p className="text-xs text-neutral-400">
                Создание узла в 4-уровневой иерархии склада
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* 1. Выбор уровня иерархии */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Уровень и тип элемента в иерархии:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTypeChange('location')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  type === 'location'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div>1. Локация</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Дом, Гараж, Дача</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('furniture')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  type === 'furniture'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Warehouse className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div>2. Мебель / Стеллаж</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Шкаф, Верстак</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('shelf')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  type === 'shelf'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div>3. Полка</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Отсчет снизу</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('container')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  type === 'container'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Box className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div>4. Коробка / Ящик</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Органайзер, кейс</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Родительский узел (если не корневая локация) */}
          {type !== 'location' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Родительское место (куда поместить): <span className="text-rose-500">*</span>
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                required
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="" disabled>
                  -- Выберите родительское место --
                </option>
                {locations
                  .filter((loc) => {
                    const cfg = LOCATION_TYPE_CONFIGS[type];
                    return cfg.allowedParentTypes.includes(loc.type);
                  })
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      [{loc.full_code || loc.code_suffix}] {inventoryManager.getLocationPathString(loc.id)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 3. Название */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Название места <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'location'
                  ? 'Например: Гараж или Дача'
                  : type === 'furniture'
                  ? 'Например: Шкаф-купе 1'
                  : type === 'shelf'
                  ? 'Например: Полка 3 (отсчет снизу)'
                  : 'Например: Коробка с проводами'
              }
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 4. Код суффикса и Номер полки */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                <span>Код-суффикс маркировки</span>
                <span className="text-[10px] text-neutral-400">д, ш1, п3, к1</span>
              </label>
              <input
                type="text"
                value={codeSuffix}
                onChange={(e) => setCodeSuffix(e.target.value.toLowerCase())}
                placeholder="к1"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {type === 'shelf' ? (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                  <span>Номер полки</span>
                  <span className="text-[10px] text-emerald-600 font-medium">снизу вверх</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={shelfNumber || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setShelfNumber(isNaN(val) ? undefined : val);
                    if (!isNaN(val)) setCodeSuffix(`п${val}`);
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Примечание / Описание
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Особенности места..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* 5. Превью генерируемого адреса этикетки */}
          <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                Сгенерированный адрес этикетки:
              </span>
              <span className="font-mono text-base font-extrabold text-emerald-700">
                {calculatePreviewCode()}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 max-w-[200px] text-right font-medium">
              Формат: [Локация]-[Стеллаж]-[Полка]-[Коробка]
            </div>
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
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Создать место
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
