'use client';

import { useEffect, useState } from 'react';
import { LANGUAGES, Language } from '@/lib/translations';
import { Globe } from 'lucide-react';

interface LanguagePickerProps {
  align?: 'up' | 'down';
  menuAlign?: 'left' | 'right';
}

export default function LanguagePicker({ align = 'down', menuAlign = 'right' }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Language>('vi');

  useEffect(() => {
    const saved = (localStorage.getItem('lang') as Language) || 'vi';
    setCurrent(saved);

    const onLangSync = (e: CustomEvent<Language>) => {
      setCurrent(e.detail);
    };
    window.addEventListener('language-changed' as any, onLangSync);
    return () => window.removeEventListener('language-changed' as any, onLangSync);
  }, []);

  const select = (langId: Language) => {
    setCurrent(langId);
    localStorage.setItem('lang', langId);
    setOpen(false);

    // Dispatch event for other pickers on same page
    window.dispatchEvent(new CustomEvent('language-changed', { detail: langId }));
    
    // Smooth reload to apply language globally across static texts
    window.location.reload();
  };

  const active = LANGUAGES.find((l) => l.id === current) || LANGUAGES[0];
  const dropdownPlacementClass = align === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';
  const menuAlignClass = menuAlign === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="relative inline-block text-left">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Chọn ngôn ngữ / Select Language"
        aria-label="Chọn ngôn ngữ"
        className="h-9 px-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:opacity-85 active:scale-95 flex-shrink-0"
        style={{
          backgroundColor: 'hsl(var(--accent))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <span className="text-base select-none leading-none flex-shrink-0">{active.flag}</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:inline">
          {active.code}
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute z-50 rounded-xl shadow-2xl p-1.5 w-44 animate-fade-in ${dropdownPlacementClass} ${menuAlignClass}`}
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <p
              className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1.5"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Ngôn Ngữ
            </p>
            <div className="space-y-0.5">
              {LANGUAGES.map((l) => {
                const isActive = current === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => select(l.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-left text-xs font-bold"
                    style={{
                      backgroundColor: isActive ? 'hsl(var(--accent))' : 'transparent',
                      outline: 'none',
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--accent) / 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="leading-tight">{l.label}</div>
                      <div className="text-[9px] font-normal leading-tight opacity-60">
                        {l.desc}
                      </div>
                    </div>
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
