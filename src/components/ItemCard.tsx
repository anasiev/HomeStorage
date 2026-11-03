/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Printer,
  Edit3,
  Trash2,
  ArrowRightLeft,
  Tag,
  Scale,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  Eye,
} from 'lucide-react';
import { InventoryItem, LocationNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface ItemCardProps {
  item: InventoryItem;
  location?: LocationNode;
  isSelected?: boolean;
  onToggleSelect?: (itemId: string) => void;
  onView?: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onMove: (item: InventoryItem) => void;
  onPrintLabel: (item: InventoryItem) => void;
  onImageClick?: (url: string) => void;
  viewMode?: 'grid' | 'list';
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  location,
  isSelected = false,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onMove,
  onPrintLabel,
  onImageClick,
  viewMode = 'grid',
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const loc = location || inventoryManager.getLocation(item.location_id);
  const locationPath = inventoryManager.getLocationPathString(item.location_id);
  const fullCode = loc?.full_code || '---';

  const cat = item.category_id ? inventoryManager.getCategory(item.category_id) : undefined;
  const categoryDisplayName = cat ? cat.name : item.parameters?.category;
  const categoryPath = item.category_id ? inventoryManager.getCategoryPathString(item.category_id) : categoryDisplayName;
  const categoryColor = cat?.color || '#0284c7';

  const photos = item.photos && item.photos.length > 0
    ? item.photos
    : ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80'];

  const rawPhoto = photos[photoIndex] || photos[0] || '';
  const currentPhoto = rawPhoto && (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') || rawPhoto.startsWith('data:') || rawPhoto.startsWith('/'))
    ? rawPhoto
    : (rawPhoto ? `/${rawPhoto}` : '');

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`bg-white rounded-2xl border transition-all p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${
          isSelected
            ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
            />
          )}

          <div
            onClick={() => onImageClick && onImageClick(currentPhoto)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 cursor-pointer relative"
          >
            <img
              src={currentPhoto}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <span className="absolute bottom-0 right-0 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded-tl font-mono">
                +{photos.length - 1}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                {fullCode}
              </span>
              <span className="text-xs sm:text-sm text-neutral-600 font-mono">
                {item.sku || item.barcode}
              </span>
              {categoryDisplayName && (
                <span
                  className="text-xs sm:text-sm bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1.5"
                  title={categoryPath}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColor }} />
                  {categoryDisplayName}
                </span>
              )}
            </div>

            <h4
              onClick={() => (onView ? onView(item) : onEdit(item))}
              className="text-base sm:text-lg font-bold text-neutral-900 truncate cursor-pointer hover:text-emerald-600 transition-colors"
              title="Open item details"
            >
              {item.name}
            </h4>
            <p className="text-xs sm:text-sm text-neutral-500 truncate mt-0.5">
              {locationPath}
            </p>
          </div>
        </div>

        {/* Right metrics and buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0">
          {(item.parameters?.weight_kg || item.parameters?.dimensions_mm) && (
            <div className="text-xs text-neutral-600 font-mono hidden md:block text-right pr-2 border-r border-neutral-200">
              {item.parameters?.weight_kg && <div>{item.parameters.weight_kg} kg</div>}
              {item.parameters?.dimensions_mm && (
                <div>
                  {item.parameters.dimensions_mm.length}×{item.parameters.dimensions_mm.width}×
                  {item.parameters.dimensions_mm.height} mm
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => onPrintLabel(item)}
            className="p-2 sm:p-2.5 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
            title="Print label"
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onMove(item)}
            className="p-2 sm:p-2.5 text-neutral-600 hover:text-emerald-600 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
            title="Move item"
          >
            <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => (onView ? onView(item) : onEdit(item))}
            className="p-2 sm:p-2.5 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
            title="View item details"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-2 sm:p-2.5 text-neutral-600 hover:text-amber-600 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
            title="Edit item"
          >
            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-2 sm:p-2.5 text-neutral-600 hover:text-rose-600 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border transition-all flex flex-col overflow-hidden shadow-2xs hover:shadow-md ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {/* Фото и карусель */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden group">
        <img
          src={currentPhoto}
          alt={item.name}
          onClick={() => onImageClick && onImageClick(currentPhoto)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
        />

        {/* Чекбокс выбора для пакетных действий */}
        {onToggleSelect && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <button
              type="button"
              onClick={() => onToggleSelect(item.id)}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white/90 backdrop-blur-xs text-transparent hover:text-neutral-400 border border-black/10'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Бейдж полного адреса по ТЗ: д-ш1-п3-к1 */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-xl bg-neutral-900/85 backdrop-blur-xs text-emerald-400 shadow-sm border border-white/10 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{fullCode}</span>
          </div>
        </div>

        {/* Навигация карусели при нескольких фото */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === photoIndex ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Контент карточки */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Путь в иерархии */}
          <div className="text-xs text-neutral-500 font-medium truncate mb-1" title={locationPath}>
            {locationPath}
          </div>

          {/* Name */}
          <h3
            onClick={() => (onView ? onView(item) : onEdit(item))}
            className="font-bold text-neutral-900 text-base leading-snug line-clamp-2 cursor-pointer hover:text-emerald-600 transition-colors"
            title="Open item details"
          >
            {item.name}
          </h3>

          {/* SKU, Barcode, Category */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {item.sku && (
              <span className="font-mono text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-lg font-semibold">
                SKU: {item.sku}
              </span>
            )}
            {item.barcode && (
              <span className="font-mono text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-lg">
                Barcode: {item.barcode}
              </span>
            )}
            {categoryDisplayName && (
              <span
                className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg font-medium flex items-center gap-1.5"
                title={categoryPath}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColor }} />
                {categoryDisplayName}
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 mt-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Parameters: weight and dimensions */}
          {(item.parameters?.weight_kg !== undefined || item.parameters?.dimensions_mm) && (
            <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-mono">
              {item.parameters.weight_kg !== undefined && (
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-neutral-400" />
                  {item.parameters.weight_kg} kg
                </span>
              )}
              {item.parameters.dimensions_mm && (
                <span>
                  {item.parameters.dimensions_mm.length}×{item.parameters.dimensions_mm.width}×
                  {item.parameters.dimensions_mm.height} mm
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom toolbar buttons */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-1.5">
          <button
            onClick={() => onPrintLabel(item)}
            className="flex-1 py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Print barcode & QR label"
          >
            <Printer className="w-4 h-4 text-neutral-600" />
            <span>Label</span>
          </button>

          <button
            onClick={() => onMove(item)}
            className="p-2 text-neutral-600 hover:text-emerald-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            title="Move to another location"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => (onView ? onView(item) : onEdit(item))}
            className="p-2 text-neutral-600 hover:text-blue-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            title="View item details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(item)}
            className="p-2 text-neutral-600 hover:text-amber-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            title="Edit item"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(item)}
            className="p-2 text-neutral-600 hover:text-rose-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
