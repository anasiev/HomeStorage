/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Home,
  Warehouse,
  Layers,
  Box,
  Plus,
  Printer,
  Trash2,
  FolderSync,
  Package,
  GripVertical,
  Edit2,
} from 'lucide-react';
import { LocationNode, LocationType } from '../types/inventory';
import { inventoryManager } from '../utils/inventoryStorage';

interface LocationsTreeViewProps {
  locations: LocationNode[];
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string | null) => void;
  onAddSubLocation: (parentId: string) => void;
  onEditLocation: (loc: LocationNode) => void;
  onPrintLocationLabel: (loc: LocationNode) => void;
  onDeleteLocation: (loc: LocationNode) => void;
  onMoveLocation: (loc: LocationNode) => void;
  onLocationMoved: () => void;
}

export const LocationsTreeView: React.FC<LocationsTreeViewProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onAddSubLocation,
  onEditLocation,
  onPrintLocationLabel,
  onDeleteLocation,
  onMoveLocation,
  onLocationMoved,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'loc-home': true,
    'furn-closet-1': true,
    'shelf-closet-3': true,
    'loc-garage': true,
    'furn-workbench': true,
    'shelf-wb-2': true,
    'loc-pantry': true,
  });

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getNodeIcon = (type: LocationType) => {
    switch (type) {
      case 'location':
        return <Home className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'furniture':
        return <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'shelf':
        return <Layers className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'container':
        return <Box className="w-4 h-4 text-purple-500 shrink-0" />;
      default:
        return <Box className="w-4 h-4 text-neutral-500 shrink-0" />;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, loc: LocationNode) => {
    e.stopPropagation();
    setDraggedNodeId(loc.id);
    e.dataTransfer.setData('text/plain', loc.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, loc: LocationNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedNodeId && draggedNodeId !== loc.id) {
      // Проверка на допустимость
      const descendants = inventoryManager.getDescendantLocationIds(draggedNodeId);
      if (!descendants.includes(loc.id)) {
        setDropTargetId(loc.id);
        e.dataTransfer.dropEffect = 'move';
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetLoc: LocationNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    if (draggedNodeId && draggedNodeId !== targetLoc.id) {
      const descendants = inventoryManager.getDescendantLocationIds(draggedNodeId);
      if (!descendants.includes(targetLoc.id)) {
        try {
          inventoryManager.moveLocation(draggedNodeId, targetLoc.id);
          onLocationMoved();
        } catch (err: any) {
          alert(err?.message || 'Failed to move location');
        }
      }
    }
    setDraggedNodeId(null);
  };

  // Recursive render of tree nodes
  const renderTreeNodes = (parentId: string | null, depth = 0) => {
    const children = locations.filter((loc) => loc.parent_id === parentId);

    if (children.length === 0) return null;

    return (
      <div className={`space-y-1 ${depth > 0 ? 'ml-3 sm:ml-4 border-l border-neutral-200/80 pl-2' : ''}`}>
        {children.map((loc) => {
          const hasChildren = locations.some((l) => l.parent_id === loc.id);
          const isExpanded = !!expandedNodes[loc.id];
          const isSelected = selectedLocationId === loc.id;
          const isDropTarget = dropTargetId === loc.id;
          const isDragging = draggedNodeId === loc.id;

          // Item count in this location
          const check = inventoryManager.canDeleteLocation(loc.id);
          const itemCount = check.totalItemCount;

          return (
            <div key={loc.id} className="select-none">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, loc)}
                onDragOver={(e) => handleDragOver(e, loc)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, loc)}
                onClick={() => onSelectLocation(isSelected ? null : loc.id)}
                className={`group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 font-semibold shadow-2xs'
                    : isDropTarget
                    ? 'bg-emerald-100 border-emerald-500 scale-[1.01]'
                    : isDragging
                    ? 'opacity-40 border-dashed border-neutral-400 bg-neutral-100'
                    : 'border-transparent hover:bg-neutral-100 text-neutral-800'
                }`}
              >
                {/* Left side: toggle, icon, code, name */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Grip for drag-and-drop */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-neutral-300 group-hover:text-neutral-500"
                    title="Drag to change parent location"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(loc.id, e)}
                      className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4.5" />
                  )}

                  {getNodeIcon(loc.type)}

                  {/* Location code */}
                  <span className="font-mono text-[11px] font-bold text-neutral-500 bg-neutral-200/60 px-1 py-0.5 rounded shrink-0">
                    {loc.full_code}
                  </span>

                  {/* Name */}
                  <span className="text-xs truncate font-medium">
                    {loc.name}
                  </span>

                  {/* Item counter badge */}
                  {itemCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold shrink-0 ml-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-200/80 text-neutral-700'
                      }`}
                      title={`${itemCount} items inside`}
                    >
                      {itemCount}
                    </span>
                  )}
                </div>

                {/* Right side: quick hover actions */}
                <div
                  className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Add sub-location */}
                  <button
                    type="button"
                    onClick={() => onAddSubLocation(loc.id)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-emerald-700 hover:bg-white"
                    title="Add sub-location inside"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit location */}
                  <button
                    type="button"
                    onClick={() => onEditLocation(loc)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-blue-700 hover:bg-white"
                    title="Edit location properties"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Print label */}
                  <button
                    type="button"
                    onClick={() => onPrintLocationLabel(loc)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-blue-700 hover:bg-white"
                    title="Print QR / barcode label"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {/* Move location */}
                  <button
                    type="button"
                    onClick={() => onMoveLocation(loc)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-amber-700 hover:bg-white"
                    title="Move location"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete location */}
                  <button
                    type="button"
                    onClick={() => onDeleteLocation(loc)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-rose-700 hover:bg-white"
                    title="Delete location"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Child nodes */}
              {hasChildren && isExpanded && renderTreeNodes(loc.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-3.5 shadow-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Storage Location Hierarchy
          </h4>
        </div>
        {selectedLocationId && (
          <button
            onClick={() => onSelectLocation(null)}
            className="text-[11px] text-emerald-600 hover:underline font-medium"
          >
            Reset filter
          </button>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-1">
        {locations.filter((l) => l.parent_id === null).length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">
            No storage locations yet. Click "Add Location".
          </div>
        ) : (
          renderTreeNodes(null, 0)
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Drag nodes to reassign parent shelf/furniture</span>
        <span className="font-mono text-emerald-700 font-semibold">
          Total locations: {locations.length}
        </span>
      </div>
    </div>
  );
};
