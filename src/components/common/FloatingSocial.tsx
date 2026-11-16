import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const TELEGRAM_URL = 'https://t.me/qoshkopirtalim';
const INSTAGRAM_URL = 'https://www.instagram.com/qoshkopirtalim?igsh=NDdtMHlsZjNkYjZ0';

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
    <path d="M21.94 4.6 18.9 19.04c-.23 1.02-.83 1.27-1.69.79l-4.65-3.43-2.25 2.16c-.25.25-.46.46-.94.46l.34-4.76 8.66-7.83c.38-.34-.08-.52-.58-.19L7.08 13.01 2.47 11.57c-1-.31-1.02-1 .21-1.48l18-6.94c.84-.31 1.57.19 1.26 1.45Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** O'ng pastki burchakdagi suzuvchi tugmalar: yuqoriga qaytish, Instagram, Telegram */
export const FloatingSocial: React.FC = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed right-4 sm:right-6 bottom-20 lg:bottom-6 z-40 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Yuqoriga qaytish"
        title="Yuqoriga qaytish"
        className={`w-12 h-12 rounded-xl bg-indigo-800 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-indigo-900 ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-6 h-6" />
      </button>

      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram sahifamiz"
        title="Instagram"
        className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg shadow-pink-500/40 hover:scale-110 transition-transform"
        style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
      >
        <InstagramIcon />
      </a>

      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram kanalimiz"
        title="Telegram"
        className="relative w-14 h-14 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/50 hover:scale-110 transition-transform"
      >
        <span className="absolute inset-0 rounded-full bg-sky-400 opacity-60 animate-ping" aria-hidden="true" />
        <span className="relative">
          <TelegramIcon />
        </span>
      </a>
    </div>
  );
};
