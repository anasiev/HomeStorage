/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Home,
  Warehouse,
  Layers,
  Box,
  Palette,
  FolderEdit,
} from 'lucide-react';
import { LocationNode, LocationType, LOCATION_TYPE_CONFIGS } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationNode | null;
  onLocationUpdated: (loc: LocationNode) => void;
  locations: LocationNode[];
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#0284c7', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#64748b', // slate
];

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  location,
  onLocationUpdated,
  locations,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    location?.id || locations[0]?.id || ''
  );
  const [parentId, setParentId] = useState<string | null>(null);
  const [type, setType] = useState<LocationType>('container');
  const [name, setName] = useState('');
  const [codeSuffix, setCodeSuffix] = useState('');
  const [shelfNumber, setShelfNumber] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or active location changes
  useEffect(() => {
    if (isOpen) {
      const active = (location && locations.some((l) => l.id === location.id))
        ? location
        : locations.find((l) => l.id === selectedLocationId) || locations[0] || null;

      if (active) {
        setSelectedLocationId(active.id);
        setParentId(active.parent_id);
        setType(active.type);
        setName(active.name || '');
        setCodeSuffix(active.code_suffix || '');
        setShelfNumber(active.shelf_number);
        setDescription(active.description || '');
        setColor(active.color || '#10b981');
        setError(null);
      }
    }
  }, [isOpen, location, locations]);

  if (!isOpen) return null;

  const activeLocation = locations.find((l) => l.id === selectedLocationId) || location || locations[0];

  const handleSelectLocation = (id: string) => {
    setSelectedLocationId(id);
    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setParentId(loc.parent_id);
      setType(loc.type);
      setName(loc.name || '');
      setCodeSuffix(loc.code_suffix || '');
      setShelfNumber(loc.shelf_number);
      setDescription(loc.description || '');
      setColor(loc.color || '#10b981');
      setError(null);
    }
  };

  if (!activeLocation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <FolderEdit className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-neutral-900">No storage locations found</h3>
          <p className="text-xs text-neutral-500">
            There are no storage locations in the database yet. Click "Add Location" to create one.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Calculate live preview of resulting full_code
  const calculatePreviewCode = () => {
    const suffix = codeSuffix.trim().toLowerCase() || activeLocation.code_suffix;
    if (!parentId) return suffix;

    const parentNode = locations.find((l) => l.id === parentId);
    if (!parentNode) return suffix;

    return `${parentNode.full_code || parentNode.code_suffix}-${suffix}`;
  };

  // Disallowed parent IDs: the location itself and all its descendants to avoid circular hierarchy
  const invalidParentIds = new Set<string>([
    activeLocation.id,
    ...inventoryManager.getDescendantLocationIds(activeLocation.id),
  ]);

  const handleTypeChange = (newType: LocationType) => {
    setType(newType);
    if (newType === 'location') {
      setParentId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter storage location name');
      return;
    }
    if (type !== 'location' && !parentId) {
      setError('Parent location is required for this level');
      return;
    }

    try {
      const updated = inventoryManager.updateLocation(activeLocation.id, {
        name: name.trim(),
        type,
        parent_id: type === 'location' ? null : parentId,
        code_suffix: codeSuffix.trim().toLowerCase() || activeLocation.code_suffix,
        description: description.trim() || undefined,
        shelf_number: type === 'shelf' ? Number(shelfNumber) || 1 : undefined,
        color,
      });

      onLocationUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update storage location');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center transition-colors"
              style={{ backgroundColor: color || '#10b981' }}
            >
              {type === 'location' ? (
                <Home className="w-5 h-5" />
              ) : type === 'furniture' ? (
                <Warehouse className="w-5 h-5" />
              ) : type === 'shelf' ? (
                <Layers className="w-5 h-5" />
              ) : (
                <Box className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">Edit Storage Location</h3>
              <p className="text-xs text-neutral-400">
                Location code: <span className="font-mono text-emerald-400">{activeLocation.full_code}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* 0. Location Selector Dropdown */}
          <div className="p-3.5 bg-neutral-100 rounded-xl border border-neutral-200">
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center justify-between">
              <span>Select location to edit:</span>
              <span className="text-[10px] text-neutral-500 font-normal">
                Total locations: {locations.length}
              </span>
            </label>
            <select
              value={activeLocation.id}
              onChange={(e) => handleSelectLocation(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  [{loc.full_code || loc.code_suffix}] {inventoryManager.getLocationPathString(loc.id)}
                </option>
              ))}
            </select>
          </div>

          {/* 1. Hierarchy Level / Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Hierarchy level and type:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTypeChange('location')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  type === 'location'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div>1. Location</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Home, Garage, Pantry</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('furniture')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  type === 'furniture'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Warehouse className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div>2. Furniture / Rack</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Wardrobe, Workbench</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('shelf')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  type === 'shelf'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div>3. Shelf</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Counted from bottom</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('container')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  type === 'container'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <Box className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div>4. Box / Container / Bin</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Organizer, Crate, Case</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Parent Location */}
          {type !== 'location' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Parent location (placement): <span className="text-rose-500">*</span>
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                required
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="" disabled>
                  -- Select Parent Location --
                </option>
                {locations
                  .filter((loc) => {
                    if (invalidParentIds.has(loc.id)) return false;
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

          {/* 3. Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Location Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* 4. Code suffix and shelf number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                <span>Address Code Suffix</span>
                <span className="text-[10px] text-neutral-400">h, w1, s3, b1</span>
              </label>
              <input
                type="text"
                value={codeSuffix}
                onChange={(e) => setCodeSuffix(e.target.value.toLowerCase())}
                placeholder="b1"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {type === 'shelf' ? (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                  <span>Shelf Number</span>
                  <span className="text-[10px] text-emerald-600 font-medium">from bottom to top</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={shelfNumber || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setShelfNumber(isNaN(val) ? undefined : val);
                    if (!isNaN(val)) setCodeSuffix(`s${val}`);
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Marker Color
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        color === c ? 'scale-110 border-neutral-900 shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Location details, purpose, capacity..."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 6. Live preview of resulting address code */}
          <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                Generated Label Address:
              </span>
              <span className="font-mono text-base font-extrabold text-emerald-700">
                {calculatePreviewCode()}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 max-w-[200px] text-right font-medium">
              Format: [Location]-[Furniture]-[Shelf]-[Box]
            </div>
          </div>

          {/* Actions */}
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
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
