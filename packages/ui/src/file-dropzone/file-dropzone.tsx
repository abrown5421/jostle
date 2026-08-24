import { useId, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { cn } from '../shared/index.js';
import type { BlowoffProps } from '../shared/index.js';

export interface FileDropzoneProps extends BlowoffProps {
  onFileSelected: (file: File) => void;
  /** e.g. 'image/png,image/jpeg,image/webp,image/gif' */
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export function FileDropzone({
  onFileSelected,
  accept,
  label = 'Drag and drop a file here, or click to browse',
  disabled,
  className,
  style,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = () => setIsDragActive(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    const file = event.dataTransfer.files[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-content-tertiary hover:border-content-secondary',
        className,
      )}
      style={style}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className="h-8 w-8 text-content-secondary"
      >
        <path
          d="M12 16V4M12 4L7 9M12 4l5 5M5 20h14"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-sm text-content-secondary">{label}</span>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}
