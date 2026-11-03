/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Printer, X, Tag, Copy, Check, Eye } from 'lucide-react';
import { LocationNode, InventoryItem } from '../types/inventory';
import { BarcodeSvg, QrCodeCanvas } from './BarcodeCanvas';
import { inventoryManager } from '../utils/inventoryStorage';

interface LabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLocation?: LocationNode | null;
  targetItem?: InventoryItem | null;
}

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({
  isOpen,
  onClose,
  targetLocation,
  targetItem,
}) => {
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'large'>('standard');
  const [includeQr, setIncludeQr] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen || (!targetLocation && !targetItem)) return null;

  const isItem = !!targetItem;
  const title = isItem ? targetItem.name : targetLocation!.name;
  const code = isItem
    ? targetItem.barcode || targetItem.sku
    : targetLocation!.full_code || targetLocation!.code_suffix;

  const locationPath = isItem
    ? inventoryManager.getLocationPathString(targetItem.location_id)
    : inventoryManager.getLocationPathString(targetLocation!.id);

  const locNode = isItem
    ? inventoryManager.getLocation(targetItem.location_id)
    : targetLocation;

  const locCode = locNode ? locNode.full_code : '';

  const handlePrint = () => {
    window.print();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-neutral-200 print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Modal header (hidden during printing) */}
        <div className="px-5 py-4 bg-neutral-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                Print {isItem ? 'Item Label' : 'Location Label'}
              </h3>
              <p className="text-xs text-neutral-400">
                Barcode label for shelves, boxes, bins, and parts
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

        {/* Label options (hidden during printing) */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center gap-4 text-xs print:hidden">
          <div>
            <label className="block text-neutral-500 mb-1 font-medium">Label size:</label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="compact">Compact (40 × 25 mm)</option>
              <option value="standard">Standard (58 × 40 mm)</option>
              <option value="large">Large (75 × 50 mm)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-700">
              <input
                type="checkbox"
                checked={includeQr}
                onChange={(e) => setIncludeQr(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              QR Code
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-700">
              <input
                type="checkbox"
                checked={includeBarcode}
                onChange={(e) => setIncludeBarcode(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Barcode
            </label>
          </div>
        </div>

        {/* Preview and print zone */}
        <div className="p-6 flex flex-col items-center justify-center bg-neutral-100 print:bg-white print:p-0">
          <div className="text-xs text-neutral-500 mb-2 flex items-center gap-1 print:hidden">
            <Eye className="w-3.5 h-3.5" />
            Sticker Preview:
          </div>

          {/* Sticker container */}
          <div
            id="printable-label"
            className={`bg-white border-2 border-dashed border-neutral-400 print:border print:border-black rounded-lg p-3 text-neutral-900 shadow-sm flex flex-col justify-between ${
              labelSize === 'compact'
                ? 'w-[240px] min-h-[140px]'
                : labelSize === 'large'
                ? 'w-[360px] min-h-[220px]'
                : 'w-[300px] min-h-[180px]'
            }`}
          >
            {/* Top row: Code */}
            <div className="flex items-start justify-between border-b border-neutral-300 pb-1.5 mb-1.5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  {isItem ? 'SKU / BARCODE' : 'STORAGE ADDRESS'}
                </span>
                <span className="font-mono text-base font-extrabold text-neutral-900 tracking-wide">
                  {code}
                </span>
              </div>
              {!isItem && (
                <div className="text-right">
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-200 font-semibold text-neutral-700">
                    {targetLocation?.type === 'container'
                      ? 'CONTAINER'
                      : targetLocation?.type === 'shelf'
                      ? 'SHELF'
                      : targetLocation?.type === 'furniture'
                      ? 'FURNITURE'
                      : 'LOCATION'}
                  </span>
                </div>
              )}
            </div>

            {/* Title and hierarchy */}
            <div className="my-1">
              <h4 className="font-bold text-xs leading-snug line-clamp-2 text-neutral-900">
                {title}
              </h4>
              <p className="text-[10px] text-neutral-600 line-clamp-1 mt-0.5 font-medium">
                {locationPath}
              </p>
              {isItem && locCode && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded w-fit">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  <span>Loc: {locCode}</span>
                </div>
              )}
            </div>

            {/* Graphics (QR / Barcode) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200 mt-auto">
              {includeQr && (
                <div className="shrink-0">
                  <QrCodeCanvas value={code} size={labelSize === 'compact' ? 52 : 68} />
                </div>
              )}
              {includeBarcode && (
                <div className="grow flex justify-center overflow-hidden">
                  <BarcodeSvg
                    value={code}
                    height={labelSize === 'compact' ? 36 : 44}
                    showText={false}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 print:hidden">
            <button
              onClick={copyCode}
              className="px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Action buttons (hidden during printing) */}
        <div className="p-4 bg-white border-t border-neutral-200 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
};
