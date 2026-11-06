/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronUp, Check } from 'lucide-react';
import { useLanguage, LANGUAGES, SupportedLanguage } from '../i18n/LanguageContext';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, currentLangInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 transition-colors border border-neutral-700/50 cursor-pointer shadow-2xs"
        aria-label="Select language"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{currentLangInfo.flag}</span>
          <span className="truncate font-semibold text-neutral-200">
            {currentLangInfo.nativeName}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono uppercase">
            ({currentLangInfo.code})
          </span>
        </div>
        <ChevronUp
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
            isOpen ? '' : 'rotate-180'
          }`}
        />
      </button>

      {/* Upward popover menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl p-1.5 z-50 max-h-64 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 mb-1 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>Select Language / Выберите язык</span>
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-sm leading-none shrink-0">{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {lang.name}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
