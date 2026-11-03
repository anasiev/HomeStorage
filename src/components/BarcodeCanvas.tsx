/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Рендерит штрихкод в виде SVG с контрольными линиями (Code128 эмуляция)
 */
export const BarcodeSvg: React.FC<BarcodeProps> = ({
  value,
  width = 200,
  height = 50,
  showText = true,
  className = '',
}) => {
  // Простая псевдо-генерация полос для визуализации штрихкода
  const generateBars = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = (hash << 5) - hash + code.charCodeAt(i);
      hash |= 0;
    }

    const bars: { x: number; w: number }[] = [];
    let currentX = 10;
    const barWidths = [1, 2, 3, 1, 2, 1, 3, 2];

    // Стартовая защитная полоса
    bars.push({ x: currentX, w: 2 });
    currentX += 3;
    bars.push({ x: currentX, w: 1 });
    currentX += 3;

    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const patternIdx = (charCode + i + Math.abs(hash)) % barWidths.length;
      const w1 = barWidths[patternIdx];
      const gap = (charCode % 2) + 1;
      const w2 = barWidths[(patternIdx + 2) % barWidths.length];

      bars.push({ x: currentX, w: w1 });
      currentX += w1 + gap;
      bars.push({ x: currentX, w: w2 });
      currentX += w2 + 2;
    }

    // Стоповая полоса
    bars.push({ x: currentX, w: 2 });
    currentX += 3;
    bars.push({ x: currentX, w: 1 });
    currentX += 10;

    return { bars, totalWidth: currentX };
  };

  const { bars, totalWidth } = generateBars(value || '00000000');

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[240px] h-auto text-neutral-900"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="0" y="0" width={totalWidth} height={height} fill="white" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y="2"
            width={bar.w}
            height={height - (showText ? 14 : 4)}
            fill="currentColor"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-semibold tracking-widest text-neutral-700 mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
};

interface QrCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Рендерит QR-код через библиотеку QRCode
 */
export const QrCodeCanvas: React.FC<QrCanvasProps> = ({ value, size = 120, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 1,
        color: {
          dark: '#171717',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error('QR code generation error:', error);
      }
    );
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded shadow-xs border border-neutral-200 bg-white ${className}`}
      width={size}
      height={size}
    />
  );
};
