import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Baby,
  FileCheck2,
  Trophy,
  Send,
  BookOpen,
  ExternalLink,
  School,
  Sparkles,
  Users,
  FileText,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  CalendarDays,
  Eye
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { NewsItem } from '../../types';
import { heroImage } from '../../assets/images';

interface HeroSectionProps {
  onSelectNews: (news: NewsItem) => void;
  onNavigate: (section: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectNews, onNavigate }) => {
  const { publicNews: news, settings, t } = usePortal();

  const quickServicesList = settings.quickServices || [];

  const getServiceIcon = (title: string) => {
    const low = title.toLowerCase();
    if (low.includes('maktab') || low.includes('qabul') || low.includes('1-sinf')) return GraduationCap;
    if (low.includes('bog\'cha') || low.includes('mtt')) return Baby;
    if (low.includes('attestatsiya') || low.includes('pedkadr') || low.includes('sertifikat')) return FileCheck2;
    if (low.includes('olimpiada') || low.includes('tanlov')) return Trophy;
    if (low.includes('kundalik') || low.includes('kitob') || low.includes('kurs') || low.includes('resurs')) return BookOpen;
    return Send;
  };

  // Sarlavha: "A — B C, D..." => B (ko'k), C (to'q), verguldan keyingi qism (oltin)
  const renderTitle = (raw: string) => {
    const dashIdx = raw.indexOf('—');
    if (dashIdx === -1) return raw;
    const head = raw.slice(0, dashIdx + 1);
    const tail = raw.slice(dashIdx + 1).trim();
    const commaIdx = tail.lastIndexOf(',');
    const before = commaIdx === -1 ? tail : tail.slice(0, commaIdx + 1);
    const after = commaIdx === -1 ? '' : tail.slice(commaIdx + 1).trim();
    const words = before.split(/\s+/);
    const firstWord = words.shift() || '';
    return (
      <>
        {head}{' '}
        <span className="text-sky-800">{firstWord}</span>{' '}
        {words.join(' ')}{' '}
        {after && <span className="text-amber-500">{after}</span>}
      </>
    );
  };

  // Izoh matnidan "• 54 ta maktab" kabi qatorlarni statistik kartochkalarga aylantirish
  const subtitleText = t(settings.heroSubtitle || '');
  const subtitleLines = subtitleText.split('\n').map(l => l.trim()).filter(Boolean);
  const statLines = subtitleLines.filter(l => /^[•\-*·]\s*\d+/.test(l));
  const introLines = subtitleLines.filter(l => !/^[•\-*·]\s*\d+/.test(l));
  let introText = introLines.join(' ');
  if (statLines.length && introText.endsWith(':') && !/soni/i.test(introText)) {
    introText = introText.slice(0, -1) + ' soni:';
  }

  const statPalettes = [
    'bg-gradient-to-br from-sky-500 to-blue-700 shadow-blue-200',
    'bg-gradient-to-br from-emerald-500 to-green-700 shadow-emerald-200',
    'bg-gradient-to-br from-violet-500 to-purple-700 shadow-violet-200',
    'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200',
  ];

  const stats = statLines.map((line) => {
    const m = line.replace(/^[•\-*·]\s*/, '').match(/^(\d+)\s*(?:ta\s+)?(.+)$/i);
    const value = m ? m[1] : '';
    const rawLabel = m ? m[2].trim() : line;
    const low = rawLabel.toLowerCase();
    let label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
    let Icon: React.ElementType = Sparkles;
    if (low.includes('maktabga') || low.includes('mtt') || low.includes("bog'")) {
      label = t("Davlat MTT (Bog'chalar)");
      Icon = Users;
    } else if (low.includes('maktab')) {
      label = t('Maktablar');
      Icon = School;
    } else if (low.startsWith('af')) {
      Icon = FileText;
    } else if (low.includes('markaz')) {
      label = t('Ilk rivojlantirish markazi');
      Icon = BookOpen;
    }
    return { value, label, Icon };
  }).sort((a, b) => Number(b.value) - Number(a.value));

  // O'ng tomondagi yangiliklar slayderi (rasmli so'nggi yangiliklar)
  const slides = news
    .filter(n => (n.images && n.images.length > 0) || n.imageUrl)
    .slice(0, 5);
  const [slide, setSlide] = useState(0);
  const slideCount = slides.length;

  useEffect(() => {
    if (slideCount < 2) return;
    const id = setInterval(() => setSlide(s => (s + 1) % slideCount), 6000);
    return () => clearInterval(id);
  }, [slideCount]);

  useEffect(() => {
    if (slide >= slideCount) setSlide(0);
  }, [slide, slideCount]);

  const fallbackImage =
    settings.heroImageUrl &&
    settings.heroImageUrl !== heroImage &&
    !settings.heroImageUrl.includes('hero_education_district')
      ? settings.heroImageUrl
      : './assets/aistudio/IMG_20261114_101244_271_9b96aa41.jpg';

  const heroQuote = t("“Sifatli ta'lim – Yangi O'zbekiston taraqqiyotining mustahkam poydevori”");

  return (
    <section className="bg-gradient-to-b from-sky-50/60 to-white pt-6 pb-12 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid: chap panel + yangiliklar slayderi */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-10">
          {/* Chap panel */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-blue-50 border border-sky-100 shadow-[0_10px_40px_-15px_rgba(14,74,130,0.25)] p-6 sm:p-8 w3-animate-left">
            {/* Bezak: bitiruvchi qalpoqchasi va kitoblar */}
            <svg className="pointer-events-none absolute right-4 top-4 w-40 sm:w-52 opacity-90 hidden sm:block" viewBox="0 0 220 170" fill="none" aria-hidden="true">
              <ellipse cx="120" cy="150" rx="90" ry="10" fill="#0c4a6e" opacity="0.08" />
              <rect x="50" y="118" width="140" height="22" rx="4" fill="#1d4ed8" />
              <rect x="56" y="122" width="128" height="6" rx="2" fill="#e0f2fe" />
              <rect x="40" y="96" width="150" height="22" rx="4" fill="#f8fafc" stroke="#cbd5e1" />
              <rect x="40" y="96" width="10" height="22" rx="2" fill="#0369a1" />
              <rect x="60" y="76" width="125" height="20" rx="4" fill="#0c4a6e" />
              <rect x="66" y="80" width="113" height="5" rx="2" fill="#fbbf24" />
              <path d="M70 76c0-12 22-20 52-20s52 8 52 20" fill="#0f2f57" />
              <path d="M22 48 122 18l100 30-100 30z" fill="#12325e" />
              <path d="M22 48 122 18l100 30-100 30z" fill="url(#capShine)" />
              <path d="M122 48 172 62v34" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              <circle cx="172" cy="100" r="5" fill="#f59e0b" />
              <path d="M30 120c-10-6-14-16-10-26 8 4 13 13 10 26zM205 112c6-10 16-14 26-10-4 8-13 13-26 10z" fill="#22c55e" opacity="0.8" />
              <defs>
                <linearGradient id="capShine" x1="22" y1="18" x2="222" y2="78">
                  <stop stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Bezak: pastki burchakdagi ko'k-sariq to'lqin */}
            <svg className="pointer-events-none absolute -right-2 bottom-0 w-[70%] h-32" viewBox="0 0 400 120" preserveAspectRatio="none" fill="none" aria-hidden="true">
              <path d="M0 120C140 110 280 80 400 0v120z" fill="#0369a1" opacity="0.9" />
              <path d="M60 120C190 108 300 76 400 22v14C300 92 200 116 110 120z" fill="#fbbf24" />
              <path d="M0 120C120 116 230 100 330 60" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
            </svg>

            <div className="relative z-10">
              {/* Yuqori yorliq */}
              {settings.heroBadgeText && (
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-sky-900 uppercase tracking-[0.18em] mb-4">
                  <span className="w-8 h-0.5 bg-sky-800 rounded-full" />
                  <span>{t(settings.heroBadgeText)}</span>
                </div>
              )}

              {/* Sarlavha */}
              <h1 className="text-2xl sm:text-3xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-3 sm:pr-44 text-balance">
                {renderTitle(t(settings.heroTitle))}
              </h1>

              <p className="text-sm sm:text-lg italic font-semibold text-slate-800 leading-snug mb-7 sm:pr-44">
                {heroQuote}
              </p>

              {stats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  {stats.map((st, i) => {
                    const Icon = st.Icon;
                    return (
                      <button
                        key={i}
                        onClick={() => onNavigate('muassasalar')}
                        className="flex items-center gap-4 bg-white/95 backdrop-blur rounded-2xl border border-white p-3.5 sm:p-4 shadow-[0_6px_24px_-10px_rgba(15,47,87,0.25)] hover:shadow-[0_12px_32px_-12px_rgba(15,47,87,0.35)] hover:-translate-y-0.5 transition-all duration-300 text-left group"
                      >
                        <span className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full ${statPalettes[i % statPalettes.length]} shadow-lg text-white flex items-center justify-center`}>
                          <Icon className="w-7 h-7" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-3xl sm:text-4xl font-extrabold text-slate-900 leading-none">{st.value}</span>
                          <span className="block mt-1 text-sm font-semibold text-slate-700 leading-snug">{st.label}</span>
                        </span>
                        <span className="shrink-0 w-10 h-10 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-700 group-hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl whitespace-pre-line">
                  {subtitleText}
                </p>
              )}

              <button
                onClick={() => onNavigate('bolim-haqida')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-900 hover:bg-sky-950 text-white text-sm font-bold shadow-lg shadow-sky-900/20 transition-colors"
              >
                <span>{t("Batafsil ma'lumot")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* O'ng panel: yangiliklar slayderi */}
          <div className="lg:col-span-5 flex flex-col w3-animate-right">
            <div className="relative flex-1 min-h-[340px] lg:min-h-[480px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              {slideCount > 0 ? (
                slides.map((n, i) => (
                  <div
                    key={n.id}
                    onClick={() => onSelectNews(n)}
                    className={`absolute inset-0 cursor-pointer transition-opacity duration-700 ${i === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img
                      src={(n.images && n.images[0]) || n.imageUrl}
                      alt={t(n.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 pr-20 text-white">
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-bold mb-3">
                        {t(n.category || 'Yangiliklar')}
                      </span>
                      <h3 className="text-lg sm:text-2xl font-bold leading-snug line-clamp-2 mb-3">
                        {t(n.title)}
                      </h3>
                      <div className="flex items-center gap-5 text-sm text-slate-200">
                        <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{n.date}</span>
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{n.views}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <img src={fallbackImage} alt={t(settings.districtName)} className="w-full h-full object-cover absolute inset-0" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    {settings.heroShowcaseBadge && (
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-bold mb-3">{t(settings.heroShowcaseBadge)}</span>
                    )}
                    {settings.heroShowcaseTitle && (
                      <p className="text-lg sm:text-2xl font-bold leading-snug">{t(settings.heroShowcaseTitle)}</p>
                    )}
                  </div>
                </>
              )}

              {slideCount > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSlide((slide - 1 + slideCount) % slideCount); }}
                    className="absolute z-20 left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t("Oldingi")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSlide((slide + 1) % slideCount); }}
                    className="absolute z-20 right-5 bottom-6 w-11 h-11 rounded-full bg-white/25 hover:bg-white/45 backdrop-blur text-white flex items-center justify-center transition-colors"
                    aria-label={t("Keyingi")}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {slideCount > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`h-2 rounded-full transition-all ${i === slide ? 'w-7 bg-sky-700' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                    aria-label={`${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Electronic Services Bar */}
        {quickServicesList.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-200 w3-animate-bottom">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                {t(settings.heroServicesTitle || "Elektron ta'lim xizmatlari va havolalar")}
              </h2>
              {settings.heroServicesSubtitle && (
                <span className="text-xs text-slate-500">{t(settings.heroServicesSubtitle)}</span>
              )}
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-3 ${quickServicesList.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-6'} gap-3`}>
              {quickServicesList.map((srv, idx) => {
                const Icon = getServiceIcon(srv.title);
                if (srv.isExternal && srv.link) {
                  return (
                    <a
                      key={srv.id || idx}
                      href={srv.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className={`w-9 h-9 rounded-lg ${srv.color || 'bg-sky-700 text-white'} flex items-center justify-center mb-2.5 shadow-xs`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700 transition-colors">
                          <span>{t(srv.title)}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {t(srv.desc)}
                        </p>
                      </div>
                    </a>
                  );
                }

                return (
                  <button
                    key={srv.id || idx}
                    onClick={() => {
                      if (srv.link?.startsWith('#')) {
                        onNavigate(srv.link.replace('#', ''));
                      } else if (srv.link) {
                        window.open(srv.link, '_blank');
                      } else {
                        onNavigate('yangiliklar');
                      }
                    }}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all group flex flex-col justify-between text-left"
                  >
                    <div>
                      <div className={`w-9 h-9 rounded-lg ${srv.color || 'bg-sky-700 text-white'} flex items-center justify-center mb-2.5 shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700 transition-colors">
                        {t(srv.title)}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {t(srv.desc)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
