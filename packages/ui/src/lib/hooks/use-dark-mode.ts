import { useEffect } from 'react';

type Theme = 'light' | 'dark';

const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

export const useDarkMode = (userDarkMode: boolean | undefined): void => {
  useEffect(() => {
    if (userDarkMode !== undefined) {
      applyTheme(userDarkMode ? 'dark' : 'light');
      return;
    }

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, [userDarkMode]);
};