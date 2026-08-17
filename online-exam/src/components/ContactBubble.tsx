'use client';

import { useEffect, useState } from 'react';
import { getSystemSettings } from '@/app/actions/metadata';
import { Phone, X, ArrowUp, Bot, Sparkles } from 'lucide-react';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

interface ContactInfo {
  phone: string;
  zalo: string;
  facebook: string;
}

export default function ContactBubble() {
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [contacts, setContacts] = useState<ContactInfo>({
    phone: '0978888777',
    zalo: 'https://zalo.me',
    facebook: 'https://facebook.com',
  });

  useEffect(() => {
    async function loadContacts() {
      const res = await getSystemSettings('contacts');
      if (res.success && res.data) {
        setContacts({
          phone: res.data.phone || '0978888777',
          zalo: res.data.zalo || 'https://zalo.me',
          facebook: res.data.facebook || 'https://facebook.com',
        });
      }
    }
    loadContacts();

    // Listen to scroll position for Back-to-Top visibility
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const zaloUrl = contacts.zalo.startsWith('http') 
    ? contacts.zalo 
    : `https://zalo.me/${contacts.zalo.replace(/\s+/g, '')}`;

  const fbUrl = contacts.facebook.startsWith('http') 
    ? contacts.facebook 
    : `https://facebook.com/${contacts.facebook}`;

  return (
    <div className="fixed bottom-20 right-6 z-50 flex items-center gap-3.5 select-none">
      
      {/* ── Floating Back to Top Button (Left of contact button) ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Về đầu trang"
          title="Về đầu trang"
          className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer border transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-right duration-300"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--primary))',
            boxShadow: '0 4px 20px -2px hsl(var(--primary) / 0.2), 0 2px 8px -1px hsl(var(--primary) / 0.1)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--accent))';
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--primary) / 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--card))';
            (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
          }}
        >
          <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" style={{ color: 'hsl(var(--primary))' }} />
        </button>
      )}

      {/* ── Main Contact Container ── */}
      <div className="relative">
        
        {/* Contact Panel (Opens cleanly above main button) */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div 
              className="absolute bottom-16 right-0 mb-2 w-72 rounded-2xl shadow-2xl p-4 border z-50 animate-in slide-in-from-bottom duration-200"
              style={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              {/* Panel Header */}
              <div className="flex items-center gap-2.5 mb-3 pb-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md relative">
                  <Bot className="w-4.5 h-4.5" />
                  <Sparkles className="w-2.5 h-2.5 text-yellow-300 absolute -top-0.5 -right-0.5 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Trợ Lý BaoAn Exam</p>
                  <p className="text-[10px] text-slate-400">Kết nối & Hỗ trợ học tập 24/7</p>
                </div>
              </div>

              {/* Action Rows */}
              <div className="space-y-1.5">
                {/* Zalo Link */}
                <a 
                  href={zaloUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-xs font-semibold text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                    Z
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Nhắn Tin Zalo</p>
                    <p className="text-[10px] text-slate-400">Nhận tài liệu & hỗ trợ trực tiếp</p>
                  </div>
                </a>

                {/* Facebook Link */}
                <a 
                  href={fbUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-xs font-semibold text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <FacebookIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Facebook Fanpage</p>
                    <p className="text-[10px] text-slate-400">Giao lưu & chia sẻ kinh nghiệm</p>
                  </div>
                </a>

                {/* Hotline Link */}
                <a 
                  href={`tel:${contacts.phone.replace(/\s+/g, '')}`} 
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-xs font-semibold text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Gọi Hotline</p>
                    <p className="text-[10px] text-slate-400">{contacts.phone} (Mọi thắc mắc)</p>
                  </div>
                </a>
              </div>
            </div>
          </>
        )}

        {/* Main Trigger Button (AI Support representation) */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Trợ lý AI Hỗ trợ"
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all active:scale-90 relative text-white z-50 ${
            open 
              ? 'bg-slate-800 dark:bg-slate-900 hover:opacity-95 rotate-90' 
              : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 hover:scale-105 shadow-indigo-500/30'
          }`}
        >
          {/* Outer glowing pulsing ring when closed */}
          {!open && (
            <span className="absolute -inset-1 rounded-full animate-pulse bg-gradient-to-tr from-violet-500 to-cyan-400 opacity-40 blur-sm pointer-events-none" />
          )}

          {open ? (
            <X className="w-6 h-6 transition-all duration-300" />
          ) : (
            <div className="relative">
              <Bot className="w-7 h-7 text-white" />
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-pulse" />
            </div>
          )}
        </button>
      </div>

    </div>
  );
}
