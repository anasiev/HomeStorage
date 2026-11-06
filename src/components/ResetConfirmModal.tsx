/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">
                {t('resetWarningTitle')}
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                {t('resetSampleData')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-3 text-sm text-neutral-700 leading-relaxed">
          <p className="font-medium text-neutral-900">
            {t('resetWarningMessage')}
          </p>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-1">
            <div className="font-semibold text-neutral-800">
              {t('appName')} (English seed):
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-neutral-500">
              <li>Home, Garage, Pantry storage tree (4 levels)</li>
              <li>Spare Parts, Hardware, Cables, Appliances, Collectibles</li>
              <li>8 clean demonstration inventory items with English descriptions</li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-200 bg-neutral-100 transition-colors cursor-pointer"
          >
            {t('cancelButton')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('confirmResetButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
