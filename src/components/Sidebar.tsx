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
  FolderTree,
  Edit2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

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
  const { t } = useLanguage();

  return (
    <>
      {/* Dim backdrop for mobile */}
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
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">{t('appName')}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-emerald-400 font-normal shrink-0">
                    {t('version')}
                  </span>
                </h1>
                <p className="text-[11px] text-neutral-400 truncate">
                  {t('appSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Storage statistics */}
          <div className="px-5 py-3 bg-neutral-950/60 border-b border-neutral-800/80 grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-neutral-800/50 text-center">
              <span className="text-neutral-400 block text-xs truncate">
                {t('statsItems')}
              </span>
              <span className="font-bold text-sm text-emerald-400 font-mono">
                {totalItems}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-800/50 text-center">
              <span className="text-neutral-400 block text-xs truncate">
                {t('statsLocations')}
              </span>
              <span className="font-bold text-sm text-blue-400 font-mono">
                {totalLocations}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-800/50 text-center">
              <span className="text-neutral-400 block text-xs truncate">
                {t('statsCategories')}
              </span>
              <span className="font-bold text-sm text-purple-400 font-mono">
                {totalCategories}
              </span>
            </div>
          </div>

          {/* Operations menu */}
          <div className="p-4 flex-1 space-y-4">
            {/* VIEW MODE SWITCHER — PLACED ABOVE CONTROL PANEL AS REQUESTED */}
            <div className="bg-neutral-950/70 p-2.5 rounded-2xl border border-neutral-800">
              <div className="px-1 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>{t('viewMode')}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-900 rounded-xl border border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => setActiveView('items')}
                  className={`py-1.5 px-1 rounded-lg text-center text-xs font-medium transition-colors cursor-pointer truncate ${
                    activeView === 'items'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={t('viewModeItems')}
                >
                  {t('viewModeItems')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('tree')}
                  className={`py-1.5 px-1 rounded-lg text-center text-xs font-medium transition-colors cursor-pointer truncate ${
                    activeView === 'tree'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={t('viewModeStorage')}
                >
                  {t('viewModeStorage')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('categories')}
                  className={`py-1.5 px-1 rounded-lg text-center text-xs font-medium transition-colors cursor-pointer truncate ${
                    activeView === 'categories'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={t('viewModeCategories')}
                >
                  {t('viewModeCategories')}
                </button>
              </div>
            </div>

            {/* CONTROL PANEL */}
            <div>
              <div className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t('controlPanel')}
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
                  <div className="flex items-center gap-2.5 truncate">
                    <PackagePlus className="w-4.5 h-4.5 text-white shrink-0" />
                    <span className="truncate">{t('addItem')}</span>
                  </div>
                  <span className="text-xs opacity-80 font-normal group-hover:translate-x-0.5 transition-transform shrink-0">
                    {t('newItem')}
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
                  <div className="flex items-center gap-2.5 truncate">
                    <Trash2 className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                    <span className="truncate">{t('deleteItem')}</span>
                  </div>
                  {selectedItemsCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded font-mono text-xs shrink-0">
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
                  <div className="flex items-center gap-2.5 truncate">
                    <ArrowRightLeft className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{t('moveItem')}</span>
                  </div>
                  {selectedItemsCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-xs shrink-0">
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
                  <div className="flex items-center gap-2.5 truncate">
                    <FolderPlus className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                    <span className="truncate">{t('addLocation')}</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono shrink-0">
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
                  <div className="flex items-center gap-2.5 truncate">
                    <Edit2 className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{t('editLocation')}</span>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">
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
                  <div className="flex items-center gap-2.5 truncate">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                    <span className="truncate">{t('deleteLocation')}</span>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">
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
                  <div className="flex items-center gap-2.5 truncate">
                    <FolderSync className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                    <span className="truncate">{t('moveLocation')}</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono shrink-0">
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
                  <div className="flex items-center gap-2.5 truncate">
                    <Layers className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                    <span className="truncate">{t('storageTree')}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 shrink-0">
                    {t('storageTreeLvls')}
                  </span>
                </button>
              </nav>
            </div>

            {/* Item Categories */}
            <div className="pt-2 border-t border-neutral-800">
              <div className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t('itemCategories')}
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
                  <div className="flex items-center gap-2.5 truncate">
                    <FolderTree className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                    <span className="truncate">{t('categoryTree')}</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono shrink-0">
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
                  <div className="flex items-center gap-2.5 truncate">
                    <FolderPlus className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{t('addCategory')}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono shrink-0">+</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom block: Language Selector, Go Server, Export/Import db.json & Reset */}
          <div className="p-3.5 border-t border-neutral-800 bg-neutral-950/70 space-y-2">
            {/* LANGUAGE SELECTOR IN BOTTOM-LEFT AREA NEAR GO SERVER */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                {t('language')}
              </div>
              <LanguageSelector />
            </div>

            {/* Go Server modal trigger */}
            <button
              type="button"
              onClick={onOpenGoDocs}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 transition-colors cursor-pointer border border-neutral-750"
            >
              <div className="flex items-center gap-2 truncate">
                <Code className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{t('goServer')}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 shrink-0">net/http</span>
            </button>

            {/* Database JSON export / import */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onExportDb}
                className="py-1.5 px-2 rounded-lg text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title={t('downloadDb')}
              >
                <Download className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{t('downloadDb')}</span>
              </button>
              <button
                type="button"
                onClick={onImportDbClick}
                className="py-1.5 px-2 rounded-lg text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title={t('importDb')}
              >
                <Upload className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{t('importDb')}</span>
              </button>
            </div>

            {/* Reset to sample data */}
            <button
              type="button"
              onClick={onResetData}
              className="w-full text-center text-[10px] text-neutral-400 hover:text-rose-400 py-1 transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-900/50 rounded-lg"
            >
              <RotateCcw className="w-3 h-3 text-neutral-500" />
              <span className="truncate">{t('resetSampleData')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
