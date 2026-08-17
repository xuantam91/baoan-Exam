'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  /* Apply theme to DOM */
  const applyTheme = useCallback((mode: 'light' | 'dark') => {
    const html = document.documentElement;
    if (mode === 'dark') {
      html.classList.add('dark');
      // Remove color themes in dark mode
      ['theme-ocean', 'theme-forest', 'theme-sunset', 'theme-pink'].forEach((c) => html.classList.remove(c));
    } else {
      html.classList.remove('dark');
      // Restore saved color theme
      const savedColor = localStorage.getItem('colorTheme');
      if (savedColor && savedColor !== 'indigo') {
        html.classList.add(`theme-${savedColor}`);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = saved ?? (systemDark ? 'dark' : 'light');

    setTheme(resolved);
    applyTheme(resolved);
    setMounted(true);

    /* Cross-tab / cross-page sync via storage event */
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);

    /* Same-page sync: listen for custom event dispatched by other ThemeToggle instances */
    const onCustom = ((e: CustomEvent<'light' | 'dark'>) => {
      setTheme(e.detail);
      applyTheme(e.detail);
    }) as EventListener;
    window.addEventListener('theme-changed', onCustom);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('theme-changed', onCustom);
    };
  }, [applyTheme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('theme', next);

    // Dispatch custom event so other ThemeToggle instances on the same page sync
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: next }));
  };

  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-xl animate-pulse"
        style={{ backgroundColor: 'hsl(var(--accent))' }}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:opacity-80 active:scale-95"
      style={{
        backgroundColor: 'hsl(var(--accent))',
        border: '1px solid hsl(var(--border))',
      }}
      title={theme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
      aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-indigo-600" />
      ) : (
        <Sun className="w-4 h-4 text-amber-400" />
      )}
    </button>
  );
}
