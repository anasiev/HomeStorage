/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Barcode,
  Layers,
  Trash2,
  PackagePlus,
  Scale,
  Maximize2,
} from 'lucide-react';
import { InventoryItem, LocationNode, CategoryNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: InventoryItem) => void;
  locations: LocationNode[];
  initialLocationId?: string;
  initialItem?: InventoryItem | null; // Для режима редактирования
  onOpenCreateCategory?: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
  locations,
  initialLocationId,
  initialItem,
  onOpenCreateCategory,
}) => {
  const isEdit = !!initialItem;

  const [activeItemId, setActiveItemId] = useState<string>(
    initialItem?.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  );

  const [name, setName] = useState(initialItem?.name || '');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [sku, setSku] = useState(initialItem?.sku || '');
  const [barcode, setBarcode] = useState(initialItem?.barcode || '');
  const [locationId, setLocationId] = useState(
    initialItem?.location_id || initialLocationId || (locations[0]?.id ?? '')
  );
  const [categoryId, setCategoryId] = useState(initialItem?.category_id || '');
  const [photos, setPhotos] = useState<string[]>(initialItem?.photos || []);
  const [weightKg, setWeightKg] = useState<string>(
    initialItem?.parameters?.weight_kg !== undefined
      ? String(initialItem.parameters.weight_kg)
      : ''
  );
  const [lengthMm, setLengthMm] = useState<string>(
    initialItem?.parameters?.dimensions_mm?.length !== undefined
      ? String(initialItem.parameters.dimensions_mm.length)
      : ''
  );
  const [widthMm, setWidthMm] = useState<string>(
    initialItem?.parameters?.dimensions_mm?.width !== undefined
      ? String(initialItem.parameters.dimensions_mm.width)
      : ''
  );
  const [heightMm, setHeightMm] = useState<string>(
    initialItem?.parameters?.dimensions_mm?.height !== undefined
      ? String(initialItem.parameters.dimensions_mm.height)
      : ''
  );
  const [category, setCategory] = useState(initialItem?.parameters?.category || '');
  const [notes, setNotes] = useState(initialItem?.parameters?.notes || '');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  // Отслеживаем фото, загруженные в текущей сессии (до сохранения)
  const newlyUploadedPhotosRef = useRef<Set<string>>(new Set());

  // Синхронизация полей формы при открытии модального окна или смене редактируемой вещи
  useEffect(() => {
    if (isOpen) {
      newlyUploadedPhotosRef.current.clear();
      if (initialItem) {
        setActiveItemId(initialItem.id);
        setName(initialItem.name || '');
        setDescription(initialItem.description || '');
        setSku(initialItem.sku || '');
        setBarcode(initialItem.barcode || '');
        setLocationId(initialItem.location_id || initialLocationId || (locations[0]?.id ?? ''));
        setCategoryId(initialItem.category_id || '');
        setPhotos(initialItem.photos ? [...initialItem.photos] : []);
        setWeightKg(
          initialItem.parameters?.weight_kg !== undefined && initialItem.parameters?.weight_kg !== null
            ? String(initialItem.parameters.weight_kg)
            : ''
        );
        setLengthMm(
          initialItem.parameters?.dimensions_mm?.length !== undefined && initialItem.parameters?.dimensions_mm?.length !== null
            ? String(initialItem.parameters.dimensions_mm.length)
            : ''
        );
        setWidthMm(
          initialItem.parameters?.dimensions_mm?.width !== undefined && initialItem.parameters?.dimensions_mm?.width !== null
            ? String(initialItem.parameters.dimensions_mm.width)
            : ''
        );
        setHeightMm(
          initialItem.parameters?.dimensions_mm?.height !== undefined && initialItem.parameters?.dimensions_mm?.height !== null
            ? String(initialItem.parameters.dimensions_mm.height)
            : ''
        );
        setCategory(initialItem.parameters?.category || '');
        setNotes(initialItem.parameters?.notes || '');
      } else {
        setActiveItemId(`item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
        setName('');
        setDescription('');
        setSku('');
        setBarcode('');
        setLocationId(initialLocationId || (locations[0]?.id ?? ''));
        setCategoryId('');
        setPhotos([]);
        setWeightKg('');
        setLengthMm('');
        setWidthMm('');
        setHeightMm('');
        setCategory('');
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, initialItem, initialLocationId, locations]);

  // Очистка при закрытии модального окна без сохранения
  const handleCancel = () => {
    if (newlyUploadedPhotosRef.current.size > 0) {
      newlyUploadedPhotosRef.current.forEach((path) => {
        fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, item_id: activeItemId }),
        }).catch(() => {});
      });
      newlyUploadedPhotosRef.current.clear();
    }
    onClose();
  };

  if (!isOpen) return null;

  // Автогенерация штрихкода
  const handleGenerateBarcode = () => {
    setBarcode(inventoryManager.generateBarcode());
  };

  // Автогенерация артикула
  const handleGenerateSku = () => {
    setSku(inventoryManager.generateSKU());
  };

  // Загрузка фото на локальный Go-сервер (в папку uploads/подпапка_места/) или Data URL
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setIsUploadingPhoto(true);

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) continue;

      let uploadedPath: string | null = null;
      try {
        const formData = new FormData();
        formData.append('photo', file);
        if (activeItemId) {
          formData.append('item_id', activeItemId);
        }
        if (locationId) {
          formData.append('location_id', locationId);
          const locNode = locations.find((l) => l.id === locationId);
          if (locNode) {
            formData.append('location_name', locNode.name);
          }
        }
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.path) {
            uploadedPath = data.path; // Относительный путь: "uploads/место/photo_...jpg"
          }
        }
      } catch {
        // Сервер недоступен (например режим preview), используем Data URL
      }

      if (uploadedPath) {
        newlyUploadedPhotosRef.current.add(uploadedPath);
        setPhotos((prev) => [...prev, uploadedPath!]);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPhotos((prev) => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    setIsUploadingPhoto(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Удаление фото из карточки и с диска сервера
  const removePhoto = (index: number) => {
    const photoToRemove = photos[index];
    if (photoToRemove) {
      if (photoToRemove.startsWith('uploads/') || photoToRemove.startsWith('/uploads/')) {
        fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: photoToRemove, item_id: activeItemId }),
        }).catch(() => {});
      }
      newlyUploadedPhotosRef.current.delete(photoToRemove);
    }
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Укажите название вещи');
      return;
    }
    if (!locationId) {
      setError('Выберите место хранения');
      return;
    }

    const finalItemId = isEdit && initialItem ? initialItem.id : activeItemId;

    const itemData = {
      id: finalItemId,
      name: name.trim(),
      description: description.trim(),
      sku: sku.trim() || inventoryManager.generateSKU(),
      barcode: barcode.trim() || inventoryManager.generateBarcode(),
      location_id: locationId,
      category_id: categoryId || undefined,
      photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80'],
      parameters: {
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        dimensions_mm:
          lengthMm || widthMm || heightMm
            ? {
                length: lengthMm ? parseFloat(lengthMm) : 0,
                width: widthMm ? parseFloat(widthMm) : 0,
                height: heightMm ? parseFloat(heightMm) : 0,
              }
            : undefined,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
      },
    };

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && initialItem) {
        const updated = await inventoryManager.updateItemAsync(initialItem.id, itemData);
        newlyUploadedPhotosRef.current.clear();
        onItemAdded(updated);
      } else {
        const created = await inventoryManager.addItemAsync(itemData);
        newlyUploadedPhotosRef.current.clear();
        onItemAdded(created);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения вещи на сервере');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Шапка */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isEdit ? 'Редактировать вещь' : 'Добавить новую вещь'}
              </h3>
              <p className="text-xs text-neutral-400">
                Заполните карточку для быстрого поиска и инвентаризации
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)] space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {/* 1. Название и Категория */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Название вещи <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Фильтр для пылесоса Samsung DJ97"
                required
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Категория каталога
                </label>
                {onOpenCreateCategory && (
                  <button
                    type="button"
                    onClick={onOpenCreateCategory}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    + Новая
                  </button>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  const catId = e.target.value;
                  setCategoryId(catId);
                  const found = inventoryManager.getCategory(catId);
                  if (found) {
                    setCategory(found.name);
                  } else {
                    setCategory('');
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
              >
                <option value="">-- Без категории --</option>
                {inventoryManager.getCategories().map((c) => (
                  <option key={c.id} value={c.id}>
                    {inventoryManager.getCategoryPathString(c.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Место хранения (Иерархический выбор) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
              <span>Место хранения в иерархии <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-neutral-500">
                (Полка, Коробка, Шкаф или Верстак)
              </span>
            </label>
            <div className="relative">
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
              >
                <option value="" disabled>
                  -- Выберите полку или коробку --
                </option>
                {locations.map((loc) => {
                  const path = inventoryManager.getLocationPathString(loc.id);
                  const isContainerOrShelf = loc.type === 'container' || loc.type === 'shelf';
                  return (
                    <option key={loc.id} value={loc.id}>
                      {loc.full_code ? `[${loc.full_code}] ` : ''}
                      {path} ({loc.type === 'container' ? 'Коробка' : loc.type === 'shelf' ? 'Полка' : loc.type === 'furniture' ? 'Мебель' : 'Локация'})
                    </option>
                  );
                })}
              </select>
            </div>
            {locationId && (
              <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1 font-mono">
                <Layers className="w-3.5 h-3.5" />
                Код адреса: <strong>{inventoryManager.getLocation(locationId)?.full_code || '---'}</strong>
                <span className="text-neutral-500 font-sans ml-1">
                  ({inventoryManager.getLocationPathString(locationId)})
                </span>
              </p>
            )}
          </div>

          {/* 3. Артикул (SKU) и Штрихкод */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Артикул (SKU)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Сгенерировать
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Например: SAM-HEPA-0167"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Штрихкод (Barcode)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <Barcode className="w-3 h-3" /> Сгенерировать
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="EAN-13 или ручной код"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* 4. Загрузка фото (Мобильная камера + Десктоп Drag & Drop по ТЗ) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center justify-between">
              <span>Фотографии вещи ({photos.length})</span>
              <span className="text-[11px] text-neutral-500">
                Поддержка нескольких фото
              </span>
            </label>

            {/* Зона загрузки и кнопка камеры */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 transition-all text-center flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Кнопка нативной камеры смартфона (capture="environment") */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Снять на камеру смартфона
                </button>

                {/* Выбор из галереи / файлов */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-neutral-500" />
                  Выбрать файл(ы)
                </button>
              </div>

              <p className="text-[11px] text-neutral-500">
                Или перетащите фото сюда с компьютера (drag-and-drop)
              </p>

              {/* Скрытые инпуты */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Галерея загруженных миниатюр */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mt-3">
                {photos.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group bg-neutral-100 shadow-xs"
                  >
                    <img
                      src={src.startsWith('http') || src.startsWith('data:') || src.startsWith('/') ? src : `/${src}`}
                      alt={`Фото ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                      title="Удалить фото"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-neutral-900/70 text-white text-[9px] text-center py-0.5 font-medium">
                        Главное
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Габариты и масса (Parameters JSONB) */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-neutral-500" />
              Параметры вещи (Масса и Габариты)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">
                  Масса (кг)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="0.25"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">
                  Длина (мм)
                </label>
                <input
                  type="number"
                  min="0"
                  value={lengthMm}
                  onChange={(e) => setLengthMm(e.target.value)}
                  placeholder="150"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">
                  Ширина (мм)
                </label>
                <input
                  type="number"
                  min="0"
                  value={widthMm}
                  onChange={(e) => setWidthMm(e.target.value)}
                  placeholder="80"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-600 mb-1">
                  Высота (мм)
                </label>
                <input
                  type="number"
                  min="0"
                  value={heightMm}
                  onChange={(e) => setHeightMm(e.target.value)}
                  placeholder="45"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* 6. Описание и Заметки */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Подробное описание и назначение
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите состояние, совместимость с техникой, номер партии или комплектность..."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Дополнительные заметки
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Срок годности, особенности монтажа, контакты мастера..."
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Кнопки действий */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Сохранение в db.json...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" />
                  <span>{isEdit ? 'Сохранить изменения' : 'Добавить вещь на склад'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
