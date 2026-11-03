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
  FolderGit2,
  FileText,
  Cpu,
} from 'lucide-react';
import { inventoryManager } from '../utils/inventoryStorage';

interface GoBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoBackendModal: React.FC<GoBackendModalProps> = ({ isOpen, onClose }) => {
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
        {/* Шапка */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Бэкенд на Go (Golang) — чистый `net/http`
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Без СУБД
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Полная автономность, единый бинарник для Windows, macOS и Linux
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

        {/* Навигационные табы */}
        <div className="flex items-center px-6 border-b border-neutral-200 bg-neutral-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('run')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'run'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Инструкции запуска и компиляции
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Архитектура и ТЗ
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Code className="w-4 h-4" />
            Файлы Go-сервера в проекте
          </button>
        </div>

        {/* Контент табов */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-150px)] text-sm space-y-4">
          {activeTab === 'run' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                <span className="font-bold">Локальный сервер без зависимостей:</span> В папке{' '}
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  /go-backend/
                </code>{' '}
                создан полный исходный код на чистом Go. Он компилируется в один исполняемый файл
                без необходимости устанавливать PostgreSQL, SQLite или Docker!
              </div>

              {/* 1. Linux / macOS */}
              <div className="p-4 bg-neutral-900 rounded-xl text-neutral-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-400 font-sans text-[11px] font-bold">
                  <span>Запуск на Linux / macOS:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'cd go-backend\ngo run main.go',
                        'linux-run'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedCmd === 'linux-run' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd === 'linux-run' ? 'Скопировано' : 'Копировать'}
                  </button>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-lg text-emerald-400 selection:bg-neutral-800">
                  cd go-backend<br />
                  go run main.go
                </div>
                <div className="text-[11px] text-neutral-400 font-sans">
                  Сервер поднимется на <strong>http://localhost:8080</strong> (или на порту из переменной <code>PORT</code>).
                </div>
              </div>

              {/* 2. Компиляция в 1 бинарник для Windows, Mac, Linux */}
              <div className="p-4 bg-neutral-900 rounded-xl text-neutral-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-400 font-sans text-[11px] font-bold">
                  <span>Сборка автономного бинарника для любой ОС:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        '# Для Windows:\nGOOS=windows GOARCH=amd64 go build -o inventory.exe main.go\n\n# Для Linux:\nGOOS=linux GOARCH=amd64 go build -o inventory main.go\n\n# Для macOS (Apple Silicon M1/M2/M3):\nGOOS=darwin GOARCH=arm64 go build -o inventory-mac main.go',
                        'cross-build'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedCmd === 'cross-build' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd === 'cross-build' ? 'Скопировано' : 'Копировать'}
                  </button>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-lg text-emerald-400 space-y-1">
                  <div># Для Windows (создаст inventory.exe):</div>
                  <div className="text-white">GOOS=windows GOARCH=amd64 go build -o inventory.exe main.go</div>
                  <div className="mt-2"># Для Linux:</div>
                  <div className="text-white">GOOS=linux GOARCH=amd64 go build -o inventory main.go</div>
                  <div className="mt-2"># Для macOS (M1/M2/M3 Apple Silicon):</div>
                  <div className="text-white">GOOS=darwin GOARCH=arm64 go build -o inventory-mac main.go</div>
                </div>
              </div>

              {/* Экспорт db.json */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <div className="font-bold text-xs text-neutral-900">
                    Файл базы данных db.json
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Содержит все ваши текущие места, полки, коробки и вещи
                  </div>
                </div>
                <button
                  onClick={handleDownloadDb}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Скачать db.json
                </button>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  1. Архитектура хранения без СУБД
                </h4>
                <p>
                  База хранится в локальном файле <code>db.json</code> в папке приложения. Записи защищены потокобезопасным мьютексом <code>sync.RWMutex</code>.
                  Фотографии сохраняются в относительную папку <code>./uploads/</code>, в базе хранятся только относительные ссылки: <code>uploads/item_photo_xxx.jpg</code>.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  2. 4-уровневая жесткая иерархия
                </h4>
                <p>
                  1. <strong>Локация</strong> (Дом, Гараж, Дача)<br />
                  2. <strong>Стеллаж / Мебель</strong> (Шкаф, Верстак)<br />
                  3. <strong>Полка</strong> (Полка 1, Полка 2 — отсчет снизу)<br />
                  4. <strong>Коробка / Контейнер</strong> (Коробка 1, Органайзер А)
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  3. Маркировка этикеток
                </h4>
                <p>
                  Формат кода: <code>[Локация]-[Стеллаж]-[Полка]-[Коробка]</code> (например: <code>д-ш1-п3-к1</code>). Если вещь лежит прямо на полке без коробки: <code>д-ш1-п3</code>.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  4. Защита удаления мест
                </h4>
                <p>
                  При вызове <code>DELETE /api/locations/:id</code> проверяется наличие вещей внутри места или его потомков. Если вещи есть — возвращается HTTP 400 Bad Request с подробным списком вещей.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3 text-xs">
              <p className="text-neutral-600">
                Исходный код Go-сервера разбит на чистые модули в соответствии с пунктом 4 ТЗ:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/go-backend/models/models.go</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Структуры <code>LocationNode</code> и <code>InventoryItem</code> с тегами <code>json</code> и <code>db</code>.
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/go-backend/storage/storage.go</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Собственная база данных JSON с потокобезопасностью и расчетом кодов этикеток.
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/go-backend/handlers/handlers.go</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    HTTP-эндпоинты для 7 операций, живого поиска и загрузки фото с камеры.
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="font-mono font-bold text-emerald-800">/read.me</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Подробная документация по сборке с нуля для Windows, Mac и Linux.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Стек: Go (Golang) чистый net/http</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
