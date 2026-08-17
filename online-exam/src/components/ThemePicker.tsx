'use client';

import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';

const THEMES = [
  { id: 'indigo', label: 'Tím',       sub: 'Mặc định',   color: '#6366F1' },
  { id: 'ocean',  label: 'Xanh biển', sub: 'Đại dương',   color: '#0EA5E9' },
  { id: 'forest', label: 'Rừng xanh', sub: 'Thiên nhiên', color: '#10B981' },
  { id: 'sunset', label: 'Hoàng hôn', sub: 'Ấm áp',       color: '#F59E0B' },
] as const;

type ThemeId = (typeof THEMES)[number]['id'];

interface ThemePickerProps {
  align?: 'up' | 'down';
}

export default function ThemePicker({ align = 'down' }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeId>('indigo');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved theme
    const saved = (localStorage.getItem('colorTheme') as ThemeId) || 'indigo';
    setCurrent(saved);
    apply(saved);

    // Detect dark mode
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    // Observe dark mode class changes on <html>
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  function apply(id: ThemeId) {
    const html = document.documentElement;
    THEMES.forEach((t) => html.classList.remove(`theme-${t.id}`));
    if (id !== 'indigo') html.classList.add(`theme-${id}`);
    localStorage.setItem('colorTheme', id);
  }

  function select(id: ThemeId) {
    setCurrent(id);
    apply(id);
    setOpen(false);
  }

  // Hide theme picker in dark mode
  if (isDark) return null;

  const activeColor = THEMES.find((t) => t.id === current)?.color ?? '#6366F1';

  // Determine dropdown placement
  const dropdownPlacementClass = align === 'up'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';

  return (
    <div className="relative inline-block text-left">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Đổi màu giao diện"
        aria-label="Chọn theme màu sắc"
        className="h-9 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:opacity-85 active:scale-95 flex-shrink-0"
        style={{
          backgroundColor: 'hsl(var(--accent))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
          style={{ backgroundColor: activeColor }}
        />
        <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 z-50 rounded-xl shadow-2xl p-2 w-48 animate-fade-in ${dropdownPlacementClass}`}
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-1.5"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Màu chủ đạo
            </p>
            <div className="space-y-0.5">
              {THEMES.map((t) => {
                const isActive = current === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => select(t.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-left"
                    style={{
                      backgroundColor: isActive ? `${t.color}22` : 'transparent',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--accent))';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{
                        backgroundColor: t.color,
                        boxShadow: isActive ? `0 0 0 2px ${t.color}44` : undefined,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-bold leading-tight"
                        style={{ color: isActive ? t.color : 'hsl(var(--foreground))' }}
                      >
                        {t.label}
                      </div>
                      <div
                        className="text-[10px] leading-tight"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {t.sub}
                      </div>
                    </div>
                    {isActive && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
