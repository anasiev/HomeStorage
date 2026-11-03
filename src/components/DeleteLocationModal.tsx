/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  Trash2,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  FolderMinus,
} from 'lucide-react';
import { LocationNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface DeleteLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationDeleted: () => void;
  location: LocationNode | null;
  locations?: LocationNode[];
  onTriggerMoveItems?: (locationId: string) => void;
}

export const DeleteLocationModal: React.FC<DeleteLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationDeleted,
  location,
  locations = [],
  onTriggerMoveItems,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    location?.id || locations[0]?.id || ''
  );
  const [error, setError] = useState<string | null>(null);

  // Synchronize active selection on open or props change
  useEffect(() => {
    if (isOpen) {
      const active = (location && locations.some((l) => l.id === location.id))
        ? location.id
        : (locations.find((l) => l.id === selectedLocationId)?.id || locations[0]?.id || '');
      setSelectedLocationId(active);
      setError(null);
    }
  }, [isOpen, location, locations]);

  if (!isOpen) return null;

  const targetLocation = locations.find((l) => l.id === selectedLocationId) || location || locations[0];

  if (!targetLocation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto">
            <FolderMinus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-neutral-900">No locations to delete</h3>
          <p className="text-xs text-neutral-500">
            There are no storage locations created in your database yet.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const check = inventoryManager.canDeleteLocation(targetLocation.id);
  const locationPath = inventoryManager.getLocationPathString(targetLocation.id);

  const handleDelete = () => {
    try {
      inventoryManager.deleteLocation(targetLocation.id);
      onLocationDeleted();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete location');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${
          check.canDelete ? 'bg-neutral-900' : 'bg-amber-950'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              check.canDelete ? 'bg-neutral-800 text-rose-400' : 'bg-amber-900 text-amber-300'
            }`}>
              {check.canDelete ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {check.canDelete ? 'Delete Storage Location' : 'Deletion Blocked'}
              </h3>
              <p className="text-xs text-neutral-300">
                Protection against accidental item loss
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Location Selector */}
          {locations.length > 0 && (
            <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200">
              <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center justify-between">
                <span>Select location to delete:</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  Total locations: {locations.length}
                </span>
              </label>
              <select
                value={targetLocation.id}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-2xs"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    [{loc.full_code || loc.code_suffix}] {inventoryManager.getLocationPathString(loc.id)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current location card */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
              Location in hierarchy:
            </div>
            <div className="text-sm font-bold text-neutral-900 mt-0.5 flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-neutral-200 rounded text-neutral-800 font-extrabold">
                {targetLocation.full_code}
              </span>
              <span>{targetLocation.name}</span>
            </div>
            <div className="text-xs text-neutral-600 mt-1 font-medium">
              {locationPath}
            </div>
          </div>

          {/* Block warning if items present */}
          {!check.canDelete ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Cannot delete: location contains items!
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    According to storage rules, a location cannot be deleted while items are stored in it or its child shelves/boxes.
                  </p>
                </div>
              </div>

              <div className="bg-white/90 rounded-xl p-3 border border-amber-200 text-xs space-y-2">
                <div className="font-semibold text-neutral-800 flex items-center justify-between">
                  <span>Items detected:</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold">
                    {check.totalItemCount} pcs
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {check.items.slice(0, 10).map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px]"
                    >
                      <Package className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="font-medium text-neutral-800 truncate">{it.name}</span>
                      <span className="text-neutral-400 ml-auto shrink-0 font-mono text-[10px]">
                        {it.sku || it.barcode}
                      </span>
                    </div>
                  ))}
                  {check.items.length > 10 && (
                    <div className="text-[11px] text-center text-neutral-500 pt-1 font-medium">
                      ...and {check.items.length - 10} more items
                    </div>
                  )}
                </div>
              </div>

              {onTriggerMoveItems && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerMoveItems(targetLocation.id);
                  }}
                  className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Move these items to another location
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 text-sm font-semibold">
                <Layers className="w-4 h-4 text-emerald-600" />
                Check passed: location is empty
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                There are no items inside this location or its sub-sections. Deletion is safe and will not result in item loss.
                {check.childLocationCount > 0 && (
                  <span className="block mt-1 font-medium text-neutral-700">
                    Note: empty sub-locations will also be deleted ({check.childLocationCount} pcs).
                  </span>
                )}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {check.canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Confirm Deletion
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
