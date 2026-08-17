'use client';

import { useEffect, useState } from 'react';
import { getSystemSettings } from '@/app/actions/metadata';
import { MessageCircle, Phone, X, ArrowUp } from 'lucide-react';

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
      setShowScrollTop(window.scrollY > 400);
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-medium">
      
      {/* ── Floating Back to Top Button ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Về đầu trang"
          title="Về đầu trang"
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 animate-in fade-in zoom-in duration-200"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Stacked contact buttons when expanded */}
      {open && (
        <div className="flex flex-col items-end gap-2.5 mb-1 animate-in slide-in-from-bottom duration-300">
          
          {/* Facebook */}
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat qua Facebook"
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all hover:scale-105 active:scale-95 text-xs font-bold"
          >
            <span>Facebook</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <FacebookIcon className="w-4.5 h-4.5 text-white" />
            </div>
          </a>

          {/* Zalo */}
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat qua Zalo"
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white shadow-lg transition-all hover:scale-105 active:scale-95 text-xs font-bold"
          >
            <span>Zalo Chat</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-extrabold text-[11px]">
              Z
            </div>
          </a>

          {/* Hotline */}
          <a
            href={`tel:${contacts.phone.replace(/\s+/g, '')}`}
            title={`Gọi Hotline: ${contacts.phone}`}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all hover:scale-105 active:scale-95 text-xs font-bold"
          >
            <span>Hotline: {contacts.phone}</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-white" />
            </div>
          </a>

        </div>
      )}

      {/* Main trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Liên hệ hỗ trợ"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all active:scale-90 relative ${
          open 
            ? 'bg-slate-700 dark:bg-slate-800 text-white rotate-90' 
            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90'
        }`}
      >
        {/* Pulsing ring animation when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping bg-indigo-500/30 opacity-75 pointer-events-none" />
        )}
        
        {open ? (
          <X className="w-6 h-6 transition-all duration-300" />
        ) : (
          <MessageCircle className="w-7 h-7 transition-all duration-300" />
        )}
      </button>
    </div>
  );
}
