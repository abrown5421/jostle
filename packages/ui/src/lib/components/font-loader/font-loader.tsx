import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAllSettings } from '@inithium/store';

export interface SettingItem {
  _id: string;
  key: string;
  value: string | boolean | number;
  description?: string;
  is_public: boolean;
}

export const FontLoader: React.FC = () => {
  const settings = useSelector(selectAllSettings) as SettingItem[];

  useEffect(() => {
    const primaryUrl = settings.find((s) => s.key === 'primary-font-asset')?.value as string | undefined;
    const secondaryUrl = settings.find((s) => s.key === 'secondary-font-asset')?.value as string | undefined;

    if (!primaryUrl && !secondaryUrl) return;

    const styleId = 'dynamic-fonts';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }

    el.textContent = `
      ${primaryUrl ? `
        @font-face {
          font-family: "CustomPrimary";
          src: url("${primaryUrl}") format("truetype");
          font-display: swap;
        }
      ` : ''}

      ${secondaryUrl ? `
        @font-face {
          font-family: "CustomSecondary";
          src: url("${secondaryUrl}") format("truetype");
          font-display: swap;
        }
      ` : ''}

      .primary-font {
        font-family: "CustomPrimary", sans-serif;
      }

      .secondary-font {
        font-family: "CustomSecondary", sans-serif;
      }

      body {
        font-family: ${secondaryUrl ? '"CustomSecondary"' : 'inherit'}, sans-serif;
      }
    `;
  }, [settings]);

  return null;
};