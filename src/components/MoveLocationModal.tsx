/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FolderSync,
  Box,
  Layers,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { LocationNode } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface MoveLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationMoved: () => void;
  locations: LocationNode[];
  initialLocationId?: string;
}

export const MoveLocationModal: React.FC<MoveLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationMoved,
  locations,
  initialLocationId,
}) => {
  const [sourceId, setSourceId] = useState<string>(
    initialLocationId || (locations[0]?.id ?? '')
  );
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Синхронизация при открытии окна или смене initialLocationId
  useEffect(() => {
    if (isOpen) {
      const active =
        initialLocationId && locations.some((l) => l.id === initialLocationId)
          ? initialLocationId
          : (locations[0]?.id ?? '');
      setSourceId(active);
      setNewParentId(null);
      setError(null);
    }
  }, [isOpen, initialLocationId, locations]);

  if (!isOpen) return null;

  const sourceNode = locations.find((l) => l.id === sourceId);
  const currentPath = sourceNode ? inventoryManager.getLocationPathString(sourceNode.id) : '';

  // Фильтруем возможные целевые родители (исключая саму локацию и всех ее потомков, чтобы избежать циклов)
  const descendants = sourceNode ? inventoryManager.getDescendantLocationIds(sourceNode.id) : [];
  const invalidParentIds = new Set([sourceId, ...descendants]);

  const validParents = locations.filter((l) => !invalidParentIds.has(l.id));

  // Подсчет вещей внутри перемещаемого места
  const itemsCheck = sourceNode ? inventoryManager.canDeleteLocation(sourceNode.id) : null;
  const itemsCount = itemsCheck ? itemsCheck.totalItemCount : 0;

  const handleMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId) {
      setError('Please select a location to move');
      return;
    }

    if (sourceNode && (sourceNode.parent_id ?? null) === (newParentId ?? null)) {
      setError('Location is already here. Select a different target location.');
      return;
    }

    try {
      inventoryManager.moveLocation(sourceId, newParentId);
      onLocationMoved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to move location');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Move Storage Location</h3>
              <p className="text-xs text-neutral-400">
                Relocate a box or shelf together with all items inside
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
        <form onSubmit={handleMove} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* 1. Select location to move */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Select location to move: <span className="text-rose-500">*</span>
            </label>
            <select
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
                setNewParentId(null);
                setError(null);
              }}
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  [{loc.full_code}] {loc.name} ({inventoryManager.getLocationPathString(loc.id)})
                </option>
              ))}
            </select>
          </div>

          {/* Location details card */}
          {sourceNode && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Current address code:</span>
                <span className="font-mono font-bold text-neutral-800">
                  {sourceNode.full_code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Current path:</span>
                <span className="font-medium text-neutral-800 truncate max-w-[280px]" title={currentPath}>
                  {currentPath}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Items inside (will move together):</span>
                <span className="font-bold text-emerald-700">{itemsCount} pcs</span>
              </div>
            </div>
          )}

          {/* 2. Destination selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
              <span>Destination (new parent location):</span>
              <span className="text-[11px] text-neutral-400">
                or to root for top level
              </span>
            </label>
            <select
              value={newParentId || ''}
              onChange={(e) => {
                setNewParentId(e.target.value || null);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">
                -- To Root (Make Top-Level Location){sourceNode?.parent_id === null ? ' [Current]' : ''} --
              </option>
              {validParents.map((loc) => {
                const isCurrentParent = sourceNode?.parent_id === loc.id;
                return (
                  <option key={loc.id} value={loc.id}>
                    [{loc.full_code}] {inventoryManager.getLocationPathString(loc.id)}
                    {isCurrentParent ? ' (Current Parent)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              All sub-locations, child boxes, and label codes will automatically update to the [Location]-[Furniture]-[Shelf]-[Box] format.
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Move Location & Items
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
