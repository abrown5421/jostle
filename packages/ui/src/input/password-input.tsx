import { useState } from 'react';
import type { Ref } from 'react';
import { Input } from './input.js';
import type { InputProps } from './input.js';

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailingElement'>;

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12Z"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.5} />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12s3.75 7.5 9.75 7.5c1.556 0 2.98-.348 4.244-.926M6.228 6.228A10.45 10.45 0 0 1 12 4.5c6 0 9.75 7.5 9.75 7.5a10.523 10.523 0 0 1-2.478 3.772M6.228 6.228 3 3m3.228 3.228 12.544 12.544M9.878 9.878a3 3 0 1 0 4.243 4.243"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A composed Input variant rather than a page-level hack: password
// visibility toggling is generic enough to want everywhere a password
// field appears (login, signup, future settings/change-password forms).
export function PasswordInput({ ref, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...rest}
      ref={ref as Ref<HTMLInputElement>}
      type={visible ? 'text' : 'password'}
      autoComplete={rest.autoComplete ?? 'current-password'}
      trailingElement={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="text-content-tertiary transition-colors hover:text-content-primary"
        >
          <EyeIcon visible={visible} />
        </button>
      }
    />
  );
}
