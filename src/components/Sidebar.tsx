/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  PackagePlus,
  Trash2,
  ArrowRightLeft,
  FolderPlus,
  ShieldAlert,
  FolderSync,
  Layers,
  Database,
  Download,
  Upload,
  Code,
  Box,
  RotateCcw,
  Sparkles,
  FolderTree,
  Edit2,
} from 'lucide-react';
import { LocationNode, InventoryItem, CategoryNode } from '../types/inventory';

interface SidebarProps {
  onOpenAddItem: () => void;
  onOpenDeleteItems: () => void;
  onOpenMoveItems: () => void;
  onOpenAddLocation: () => void;
  onOpenEditLocation: () => void;
  onOpenDeleteLocation: () => void;
  onOpenMoveLocation: () => void;
  onOpenShowLocations: () => void;
  onOpenAddCategory: () => void;
  onOpenShowCategories: () => void;
  selectedItemsCount: number;
  totalItems: number;
  totalLocations: number;
  totalCategories: number;
  activeView: 'items' | 'tree' | 'categories';
  setActiveView: (view: 'items' | 'tree' | 'categories') => void;
  onExportDb: () => void;
  onImportDbClick: () => void;
  onOpenGoDocs: () => void;
  onResetData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAddItem,
  onOpenDeleteItems,
  onOpenMoveItems,
  onOpenAddLocation,
  onOpenEditLocation,
  onOpenDeleteLocation,
  onOpenMoveLocation,
  onOpenShowLocations,
  onOpenAddCategory,
  onOpenShowCategories,
  selectedItemsCount,
  totalItems,
  totalLocations,
  totalCategories,
  activeView,
  setActiveView,
  onExportDb,
  onImportDbClick,
  onOpenGoDocs,
  onResetData,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Затемнение для мобильных устройств */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-neutral-900 text-white flex flex-col justify-between border-r border-neutral-800 transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  Storage & Inventory
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-emerald-400 font-normal">
                    v1.1
                  </span>
                </h1>
                <p className="text-[11px] text-neutral-400">
                  Inventory & Labeling
                </p>
              </div>
            </div>
          </div>

          {/* Storage statistics */}
          <div className="px-5 py-3 bg-neutral-950/60 border-b border-neutral-800/80 grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-neutral-800/50 text-center">
              <span className="text-neutral-400 block text-xs">Items</span>
              <span className="font-bold text-sm text-emerald-400 font-mono">
                {totalItems}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-800/50 text-center">
              <span className="text-neutral-400 block text-xs">Locations</span>
              <span className="font-bold text-sm text-blue-400 font-mono">
                {totalLocations}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-800/50 text-center">
              <span className="text-neutral-400 block text-xs">Categories</span>
              <span className="font-bold text-sm text-purple-400 font-mono">
                {totalCategories}
              </span>
            </div>
          </div>

          {/* Fixed operations menu */}
          <div className="p-4 flex-1 space-y-4">
            <div>
              <div className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                Control Panel
              </div>
              <nav className="space-y-1.5">
                {/* 1. Add item */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenAddItem();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-neutral-100 hover:text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <PackagePlus className="w-4.5 h-4.5 text-white" />
                    <span>1. Add Item</span>
                  </div>
                  <span className="text-xs opacity-80 font-normal group-hover:translate-x-0.5 transition-transform">
                    New
                  </span>
                </button>

                {/* 2. Delete item */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenDeleteItems();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4.5 h-4.5 text-rose-400" />
                    <span>2. Delete Item</span>
                  </div>
                  {selectedItemsCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded font-mono text-xs">
                      {selectedItemsCount}
                    </span>
                  )}
                </button>

                {/* 3. Move item */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenMoveItems();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowRightLeft className="w-4.5 h-4.5 text-emerald-400" />
                    <span>3. Move Item</span>
                  </div>
                  {selectedItemsCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-xs">
                      {selectedItemsCount}
                    </span>
                  )}
                </button>

                {/* 4. Add location */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenAddLocation();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderPlus className="w-4.5 h-4.5 text-blue-400" />
                    <span>4. Add Location</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    h-w-s-b
                  </span>
                </button>

                {/* Edit location */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenEditLocation();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Edit2 className="w-4.5 h-4.5 text-cyan-400" />
                    <span>Edit Location</span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    properties
                  </span>
                </button>

                {/* 5. Delete location */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenDeleteLocation();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-400" />
                    <span>5. Delete Location</span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    safe check
                  </span>
                </button>

                {/* 6. Move location */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenMoveLocation();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderSync className="w-4.5 h-4.5 text-purple-400" />
                    <span>6. Move Location</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    Drag&Drop
                  </span>
                </button>

                {/* 7. Show location (Tree) */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenShowLocations();
                    setActiveView('tree');
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                    activeView === 'tree'
                      ? 'bg-neutral-800 text-emerald-400 font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4.5 h-4.5 text-amber-400" />
                    <span>7. Storage Tree</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">
                    4 lvls
                  </span>
                </button>
              </nav>
            </div>

            {/* Catalog Categories */}
            <div className="pt-2 border-t border-neutral-800">
              <div className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                Item Categories
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenShowCategories();
                    setActiveView('categories');
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                    activeView === 'categories'
                      ? 'bg-neutral-800 text-blue-400 font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-4.5 h-4.5 text-blue-400" />
                    <span>Category Tree</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {totalCategories}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenAddCategory();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderPlus className="w-4.5 h-4.5 text-emerald-400" />
                    <span>Add Category</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">+</span>
                </button>
              </div>
            </div>

            {/* Main view toggle */}
            <div className="pt-2 border-t border-neutral-800">
              <div className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                View Mode
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveView('items')}
                  className={`py-2 px-1 rounded-lg text-center text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'items'
                      ? 'bg-neutral-800 text-white shadow-2xs font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Items
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('tree')}
                  className={`py-2 px-1 rounded-lg text-center text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'tree'
                      ? 'bg-neutral-800 text-white shadow-2xs font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Storage
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('categories')}
                  className={`py-2 px-1 rounded-lg text-center text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeView === 'categories'
                      ? 'bg-neutral-800 text-white shadow-2xs font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Categories
                </button>
              </div>
            </div>
          </div>

          {/* Bottom block: Import/Export db.json and Go Server info */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 space-y-2">
            <button
              type="button"
              onClick={onOpenGoDocs}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>Go Server &amp; Service</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">net/http</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onExportDb}
                className="py-1.5 px-2 rounded-lg text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
                title="Download db.json file"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>db.json</span>
              </button>
              <button
                type="button"
                onClick={onImportDbClick}
                className="py-1.5 px-2 rounded-lg text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
                title="Import your db.json"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span>Import</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onResetData}
              className="w-full text-center text-[10px] text-neutral-500 hover:text-neutral-300 py-1 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Sample Data
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
