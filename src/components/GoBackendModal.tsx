/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Code,
  Terminal,
  Download,
  Copy,
  Check,
  Server,
  Cpu,
  Folder,
} from 'lucide-react';
import { inventoryManager } from '../utils/inventoryStorage';
import { useLanguage } from '../i18n/LanguageContext';

interface GoBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoBackendModal: React.FC<GoBackendModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'run' | 'architecture' | 'code'>('run');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadDb = () => {
    const jsonStr = inventoryManager.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'db.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                {t('goBackendTitle')}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {t('noDbRequired')}
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                {t('goBackendSubtitle')}
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

        {/* Navigation tabs */}
        <div className="flex items-center px-4 sm:px-6 border-b border-neutral-200 bg-neutral-50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('run')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'run'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{t('tabRun')}</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t('tabArch')}</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>{t('tabCode')}</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-150px)] text-sm space-y-4">
          {activeTab === 'run' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                <span className="font-bold">{t('localServerNoDeps')}</span>{' '}
                {t('localServerDesc')}
              </div>

              {/* 1. Linux / macOS */}
              <div className="p-4 bg-neutral-900 rounded-xl text-neutral-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-400 font-sans text-[11px] font-bold">
                  <span>{t('runLinuxMac')}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'cd go-backend\ngo run main.go',
                        'linux-run'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {copiedCmd === 'linux-run' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd === 'linux-run' ? t('copied') : t('copy')}
                  </button>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-lg text-emerald-400 selection:bg-neutral-800">
                  cd go-backend<br />
                  go run main.go
                </div>
                <div className="text-[11px] text-neutral-400 font-sans">
                  {t('serverUrlNote')}
                </div>
              </div>

              {/* 2. Standalone binary build for any OS */}
              <div className="p-4 bg-neutral-900 rounded-xl text-neutral-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-400 font-sans text-[11px] font-bold">
                  <span>{t('crossBuildTitle')}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        '# Windows:\nGOOS=windows GOARCH=amd64 go build -o inventory.exe main.go\n\n# Linux:\nGOOS=linux GOARCH=amd64 go build -o inventory main.go\n\n# macOS (Apple Silicon M1/M2/M3):\nGOOS=darwin GOARCH=arm64 go build -o inventory-mac main.go',
                        'cross-build'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {copiedCmd === 'cross-build' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd === 'cross-build' ? t('copied') : t('copy')}
                  </button>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-lg text-emerald-400 space-y-1">
                  <div>{t('crossBuildWindows')}</div>
                  <div className="text-white">GOOS=windows GOARCH=amd64 go build -o inventory.exe main.go</div>
                  <div className="mt-2">{t('crossBuildLinux')}</div>
                  <div className="text-white">GOOS=linux GOARCH=amd64 go build -o inventory main.go</div>
                  <div className="mt-2">{t('crossBuildMac')}</div>
                  <div className="text-white">GOOS=darwin GOARCH=arm64 go build -o inventory-mac main.go</div>
                </div>
              </div>

              {/* 3. Folder transfer guide */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-500">
                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('deployFolderTitle')}</span>
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  {t('deployFolderDesc')}
                </p>
                <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[11px] text-sky-400 space-y-0.5 border border-neutral-800">
                  <div>your-inventory-folder/</div>
                  <div>├── inventory.exe &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-neutral-500">(Go server)</span></div>
                  <div>├── web/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400 font-bold">&lt;-- copy go-backend/web here!</span></div>
                  <div>│&nbsp;&nbsp; ├── index.html</div>
                  <div>│&nbsp;&nbsp; └── assets/</div>
                  <div>├── db.json &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-neutral-500">(database - auto created)</span></div>
                  <div>└── uploads/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-neutral-500">(photos - auto created)</span></div>
                </div>
              </div>

              {/* Export db.json */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <div className="font-bold text-xs text-neutral-900">
                    {t('dbJsonFileTitle')}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {t('dbJsonFileDesc')}
                  </div>
                </div>
                <button
                  onClick={handleDownloadDb}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  {t('downloadDbJson')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  {t('archSection1Title')}
                </h4>
                <p>{t('archSection1Desc')}</p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  {t('archSection2Title')}
                </h4>
                <p className="whitespace-pre-line">{t('archSection2Desc')}</p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  {t('archSection3Title')}
                </h4>
                <p>{t('archSection3Desc')}</p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  {t('archSection4Title')}
                </h4>
                <p>{t('archSection4Desc')}</p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3 text-xs">
              <p className="text-neutral-600">
                {t('filesSectionDesc')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/go-backend/models/models.go</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Structures <code>LocationNode</code> and <code>InventoryItem</code> with JSON and database tags.
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/go-backend/storage/storage.go</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    JSON database engine with thread-safe mutex and label code generation.
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/go-backend/handlers/handlers.go</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    REST API endpoints for items, locations, categories, live search, and photo uploads.
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/README.md</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Service configuration (systemd / Windows service) and backup instructions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>{t('stackFooter')}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
