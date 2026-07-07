import React from 'react';
import trianglify from 'trianglify';
import { BannerProps, TrianglifyOptions } from '@inithium/types';

const DEFAULT_HEIGHT = '200px';

const DEFAULT_OPTIONS: TrianglifyOptions = {
  variance: 0.75,
  cell_size: 60,
  x_colors: ['#0f5066', '#115e7a', '#1e293b'],
  y_colors: ['#1e293b', '#64748b', '#e2e8f0'],
};

function toColorArray(colors: string | string[] | undefined): string[] | undefined {
  if (colors === undefined) return undefined;
  return Array.isArray(colors) ? colors : [colors];
}

function toTrianglifyV4(opts: TrianglifyOptions & { width: number; height: number }) {
  return {
    variance: opts.variance,
    cellSize: opts.cell_size,
    xColors: toColorArray(opts.x_colors),
    yColors: toColorArray(opts.y_colors),
    width: opts.width,
    height: opts.height,
  };
}

export const Banner: React.FC<BannerProps & { children?: React.ReactNode }> = ({
  src,
  alt = 'Banner',
  height = DEFAULT_HEIGHT,
  options = {},
  className = '',
  children,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [imageError, setImageError] = React.useState(false);

  const showImage = !!src && !imageError;

  React.useEffect(() => {
    if (showImage) return;

    const container = containerRef.current;
    if (!container) return;

    const { width } = container.getBoundingClientRect();
    const numericHeight = parseFloat(height);

    const merged: TrianglifyOptions & { width: number; height: number } = {
      ...DEFAULT_OPTIONS,
      ...options,
      width: width || 800,
      height: numericHeight || 200,
    };

    const mergedOptions = toTrianglifyV4(merged);

    const pattern = trianglify(mergedOptions);
    const canvas = pattern.toCanvas();
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    if (canvasRef.current && container.contains(canvasRef.current)) {
      container.removeChild(canvasRef.current);
    }

    canvasRef.current = canvas;
    container.insertBefore(canvas, container.firstChild);

    return () => {
      if (canvasRef.current && container.contains(canvasRef.current)) {
        container.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, [showImage, height, options]);

  const containerClasses = [
    'relative',
    'w-full',
    'overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={{ height }}
      role="img"
      aria-label={alt}
    >
      {showImage && (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
      {children && (
        <div className="absolute inset-0 flex items-end">
          {children}
        </div>
      )}
    </div>
  );
};