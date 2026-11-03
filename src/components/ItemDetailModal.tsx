/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit3,
  Trash2,
  ArrowRightLeft,
  MapPin,
  Tag,
  Scale,
  Maximize2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Barcode as BarcodeIcon,
  QrCode,
  Box,
} from 'lucide-react';
import { InventoryItem, LocationNode, CategoryNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';
import { BarcodeSvg, QrCodeCanvas } from './BarcodeCanvas';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onMove: (item: InventoryItem) => void;
  onPrintLabel: (item: InventoryItem) => void;
  onSelectLocation?: (locationId: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
  onMove,
  onPrintLabel,
  onSelectLocation,
  onSelectCategory,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const loc = inventoryManager.getLocation(item.location_id);
  const locPath = inventoryManager.getLocationPathString(item.location_id);
  const fullCode = loc?.full_code || '---';

  const cat = item.category_id ? inventoryManager.getCategory(item.category_id) : undefined;
  const categoryPath = item.category_id
    ? inventoryManager.getCategoryPathString(item.category_id)
    : item.parameters?.category;

  const photos = item.photos && item.photos.length > 0
    ? item.photos
    : ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80'];

  const rawPhoto = photos[activePhotoIdx] || photos[0] || '';
  const currentPhoto = rawPhoto && (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') || rawPhoto.startsWith('data:') || rawPhoto.startsWith('/'))
    ? rawPhoto
    : (rawPhoto ? `/${rawPhoto}` : '');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const dims = item.parameters?.dimensions_mm;
  const volumeLiters =
    dims && dims.length && dims.width && dims.height
      ? ((dims.length * dims.width * dims.height) / 1000000).toFixed(2)
      : null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '---';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-neutral-800 text-emerald-400">
                  {fullCode}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  ID: {item.id}
                </span>
              </div>
              <h3 className="text-base font-bold text-white truncate mt-0.5">
                {item.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0 ml-3 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(88vh-140px)] space-y-6">
          {/* Top section: Photo Gallery & Key Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-4/3 w-full bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 group shadow-2xs">
                <img
                  src={currentPhoto}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />

                {/* Slider nav */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActivePhotoIdx((prev) =>
                          prev > 0 ? prev - 1 : photos.length - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setActivePhotoIdx((prev) =>
                          prev < photos.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5">
                      {photos.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === activePhotoIdx ? 'bg-white scale-125' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {photos.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        idx === activePhotoIdx
                          ? 'border-emerald-600 scale-105 shadow-xs'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location, category, sku, barcode */}
            <div className="space-y-4 text-xs">
              {/* Storage location */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center justify-between">
                  <span>Storage Location</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    {fullCode}
                  </span>
                </div>
                <div className="text-sm font-bold text-neutral-900 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{loc?.name || 'Unnamed'}</span>
                </div>
                <p className="text-neutral-600 font-medium leading-relaxed">
                  {locPath}
                </p>
                {onSelectLocation && loc && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc.id);
                      onClose();
                    }}
                    className="text-emerald-700 hover:underline font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Show all items in this location
                  </button>
                )}
              </div>

              {/* Category */}
              {categoryPath && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                    Catalog Category
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-900 font-semibold text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || '#0284c7' }}
                    />
                    <span>{categoryPath}</span>
                  </div>
                  {onSelectCategory && cat && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id);
                        onClose();
                      }}
                      className="text-blue-700 hover:underline font-semibold flex items-center gap-1 pt-0.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Show items in this category
                    </button>
                  )}
                </div>
              )}

              {/* SKU and Barcode with copy */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                    SKU (Part Number)
                  </span>
                  <div className="font-mono text-xs font-bold text-neutral-900 flex items-center justify-between">
                    <span className="truncate">{item.sku || '---'}</span>
                    {item.sku && (
                      <button
                        onClick={() => copyToClipboard(item.sku, 'sku')}
                        className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                        title="Copy SKU"
                      >
                        {copiedField === 'sku' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                    Barcode
                  </span>
                  <div className="font-mono text-xs font-bold text-neutral-900 flex items-center justify-between">
                    <span className="truncate">{item.barcode || '---'}</span>
                    {item.barcode && (
                      <button
                        onClick={() => copyToClipboard(item.barcode, 'barcode')}
                        className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                        title="Copy Barcode"
                      >
                        {copiedField === 'barcode' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Barcode & QR visualization */}
              {(item.barcode || item.sku) && (
                <div className="p-3 bg-white border border-neutral-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex-1 overflow-hidden">
                    <BarcodeSvg
                      value={item.barcode || item.sku}
                      height={42}
                      showText={true}
                    />
                  </div>
                  <div className="shrink-0">
                    <QrCodeCanvas
                      value={item.barcode || item.sku}
                      size={58}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Physical specs & dimensions */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 text-xs">
            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-neutral-500" />
              Physical Specifications & Dimensions
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">Weight</span>
                <span className="font-mono font-bold text-neutral-800 text-sm">
                  {item.parameters?.weight_kg !== undefined
                    ? `${item.parameters.weight_kg} kg`
                    : 'Not specified'}
                </span>
                {item.parameters?.weight_kg !== undefined && (
                  <span className="text-[10px] text-neutral-500 block">
                    ({Math.round(item.parameters.weight_kg * 1000)} g)
                  </span>
                )}
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">Length</span>
                <span className="font-mono font-bold text-neutral-800 text-sm">
                  {dims?.length ? `${dims.length} mm` : '---'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">Width</span>
                <span className="font-mono font-bold text-neutral-800 text-sm">
                  {dims?.width ? `${dims.width} mm` : '---'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">Height</span>
                <span className="font-mono font-bold text-neutral-800 text-sm">
                  {dims?.height ? `${dims.height} mm` : '---'}
                </span>
                {volumeLiters && (
                  <span className="text-[10px] text-neutral-500 block">
                    Volume: ~{volumeLiters} L
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description and notes */}
          {item.description && (
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-neutral-900">
                Description & Purpose:
              </h4>
              <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 whitespace-pre-line">
                {item.description}
              </p>
            </div>
          )}

          {item.parameters?.notes && (
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-neutral-900">
                Additional Notes:
              </h4>
              <p className="text-neutral-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 leading-relaxed">
                {item.parameters.notes}
              </p>
            </div>
          )}

          {/* Creation & modification dates */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
            <span>Added: {formatDate(item.created_at)}</span>
            <span>Updated: {formatDate(item.updated_at)}</span>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDelete(item);
              }}
              className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onMove(item);
              }}
              className="px-3.5 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>Move</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onPrintLabel(item);
              }}
              className="px-3.5 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Print Label</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
