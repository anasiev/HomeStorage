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
        setCodeSuffix('h');
      } else {
        const parent = locations.find((l) => l.id === initialParentId);
        if (parent) {
          if (parent.type === 'location') {
            setType('furniture');
            setCodeSuffix('w1');
          } else if (parent.type === 'furniture') {
            setType('shelf');
            setCodeSuffix('s1');
            setShelfNumber(1);
          } else if (parent.type === 'shelf') {
            setType('container');
            setCodeSuffix('b1');
          }
        }
      }
    }
  }, [isOpen, initialParentId, locations]);

  if (!isOpen) return null;

  // Calculate preview of the full address code
  const calculatePreviewCode = () => {
    const suffix = codeSuffix.trim().toLowerCase() || 'code';
    if (!parentId) return suffix;

    const parentNode = locations.find((l) => l.id === parentId);
    if (!parentNode) return suffix;

    return `${parentNode.full_code || parentNode.code_suffix}-${suffix}`;
  };

  const handleTypeChange = (newType: LocationType) => {
    setType(newType);
    if (newType === 'location') {
      setParentId(null);
      setCodeSuffix('h');
    } else if (newType === 'furniture') {
      setCodeSuffix('w1');
    } else if (newType === 'shelf') {
      setCodeSuffix('s1');
      setShelfNumber(1);
    } else if (newType === 'container') {
      setCodeSuffix('b1');
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
      setError(err?.message || 'Failed to add location');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Add Storage Location</h3>
              <p className="text-xs text-neutral-400">
                Create a node in the 4-tier storage hierarchy
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* 1. Hierarchy Level Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Hierarchy level and location type:
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
                  <div>1. Location</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Home, Garage, Pantry</div>
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
                  <div>2. Furniture / Rack</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Wardrobe, Workbench</div>
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
                  <div>3. Shelf</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Counted from bottom</div>
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
                  <div>4. Box / Container / Bin</div>
                  <div className="text-[10px] text-neutral-500 font-normal">Organizer, Crate, Case</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Parent Location Node */}
          {type !== 'location' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Parent Location (Where to place): <span className="text-rose-500">*</span>
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
              placeholder={
                type === 'location'
                  ? 'e.g., Garage or Country House'
                  : type === 'furniture'
                  ? 'e.g., Wardrobe 1 or Metal Rack'
                  : type === 'shelf'
                  ? 'e.g., Shelf 3 (from bottom)'
                  : 'e.g., Box with Cables'
              }
              required
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 4. Code suffix and Shelf number */}
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
                  <span className="text-[10px] text-emerald-600 font-medium">from bottom</span>
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
                  Notes / Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Location features or details..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* 5. Preview of generated address code */}
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

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
