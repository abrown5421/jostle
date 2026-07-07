import React from 'react';
import { Search } from 'lucide-react';

interface FriendSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FriendSearchInput: React.FC<FriendSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search by name...',
}) => (
  <div className="relative w-full">
    <Search
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
      strokeWidth={2}
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        'w-full pl-9 pr-4 py-2 text-sm rounded-lg',
        'bg-surface2 text-surface-contrast placeholder:text-surface4-contrast',
        'border-2 border-surface3 focus:border-primary',
        'outline-none transition-colors duration-200',
      ].join(' ')}
    />
  </div>
);