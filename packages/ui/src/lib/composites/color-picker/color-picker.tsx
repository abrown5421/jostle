import React from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import { ColorPickerProps } from './color-picker.types';
import { Input } from '../../components';

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '',
  onChange,
  onColorChange,
  fullWidth = false,
  ...restProps
}) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updateCoordinates = React.useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
      });
    }
  }, []);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const isOutside = containerRef.current && !containerRef.current.contains(event.target as Node);
      const portalContainer = document.getElementById('color-picker-portal-root');
      const isInsidePortal = portalContainer && portalContainer.contains(event.target as Node);

      if (isOutside && !isInsidePortal) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      updateCoordinates();
      window.addEventListener('resize', updateCoordinates);
      window.addEventListener('scroll', updateCoordinates, true);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', updateCoordinates);
      window.removeEventListener('scroll', updateCoordinates, true);
    };
  }, [isOpen, updateCoordinates]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onColorChange) onColorChange(e.target.value);
  };

  const handlePickerChange = (newHex: string) => {
    if (onColorChange) onColorChange(newHex);
    if (onChange) {
      onChange({
        target: { value: newHex },
        currentTarget: { value: newHex }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const togglePicker = () => {
    if (!isOpen) updateCoordinates();
    setIsOpen((prev) => !prev);
  };

  const isValidHex = (hexStr: string): boolean => 
    /^#([A-Fa-f0-9]{3}){1,2}$|^#([A-Fa-f0-9]{4}){1,2}$/.test(hexStr);

  const activeColor = isValidHex(value) ? value : '#ffffff';

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block ${fullWidth ? 'w-full' : 'w-72'}`}
    >
      <div className="relative w-full">
        <Input
          {...restProps}
          value={value}
          onChange={handleTextChange}
          fullWidth={fullWidth}
          onClick={togglePicker}
          className="pr-12"
        />
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-sm border border-slate-300 pointer-events-none z-20"
          style={{ backgroundColor: activeColor }}
        />
      </div>

      {isOpen && createPortal(
        <div 
          id="color-picker-portal-root"
          className="fixed z-[9999] shadow-xl bg-white p-2 rounded-md border border-slate-200"
          style={{
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            transform: 'translateX(-100%)',
          }}
        >
          <HexColorPicker color={activeColor} onChange={handlePickerChange} />
        </div>,
        document.body
      )}
    </div>
  );
};