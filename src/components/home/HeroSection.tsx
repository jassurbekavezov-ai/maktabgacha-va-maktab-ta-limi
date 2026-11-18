import React from 'react';
import {
  GraduationCap,
  Baby,
  FileCheck2,
  Trophy,
  Send,
  BookOpen,
  ExternalLink,
  MapPin,
  School,
  Sparkles
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { NewsItem } from '../../types';
import { heroImage } from '../../assets/images';

interface HeroSectionProps {
  onSelectNews: (news: NewsItem) => void;
  onNavigate: (section: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectNews, onNavigate }) => {
  const { settings, t } = usePortal();

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

  // Sarlavhani rangli qismlarga ajratish: "A — B, C D..." => B (to'q), C (ko'k), qolgani (oltin)
  const renderTitle = (raw: string) => {
    const dashIdx = raw.indexOf('—');
    if (dashIdx === -1) return raw;
    const head = raw.slice(0, dashIdx + 1);
    const tail = raw.slice(dashIdx + 1);
    const commaIdx = tail.lastIndexOf(',');
    if (commaIdx === -1) {
      return (<>{head}<span className="text-sky-700">{tail}</span></>);
    }
    const before = tail.slice(0, commaIdx + 1);
    const after = tail.slice(commaIdx + 1).trim().split(/\s+/);
    const first = after.shift() || '';
    return (
      <>
        {head}{before}{' '}
        <span className="bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">{first}</span>{' '}
        <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">{after.join(' ')}</span>
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
    { box: 'bg-sky-50 text-sky-700 ring-sky-100', bar: 'from-sky-500 to-sky-700', num: 'text-sky-900' },
    { box: 'bg-amber-50 text-amber-600 ring-amber-100', bar: 'from-amber-400 to-amber-600', num: 'text-slate-900' },
    { box: 'bg-emerald-50 text-emerald-600 ring-emerald-100', bar: 'from-emerald-400 to-emerald-600', num: 'text-slate-900' },
    { box: 'bg-indigo-50 text-indigo-600 ring-indigo-100', bar: 'from-indigo-400 to-indigo-600', num: 'text-slate-900' },
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
      Icon = Baby;
    } else if (low.includes('maktab')) {
      label = t('Maktablar');
      Icon = School;
    } else if (low.startsWith('af')) {
      Icon = GraduationCap;
    } else if (low.includes('markaz')) {
      label = t('Ilk rivojlantirish markazi');
      Icon = BookOpen;
    }
    return { value, label, Icon };
  }).sort((a, b) => Number(b.value) - Number(a.value));

  return (
    <section className="bg-gradient-to-b from-sky-50/60 to-white pt-6 pb-12 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid: Featured Hero Story + Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
          {/* Left Column: Mission and Featured Story */}
          <div className="lg:col-span-7 flex flex-col justify-between w3-animate-left">
            <div>
              {/* Region / Identity Tag */}
              {settings.heroBadgeText && (
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-800 uppercase tracking-widest mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t(settings.heroBadgeText)}</span>
                </div>
              )}

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 text-balance">
                {renderTitle(t(settings.heroTitle))}
              </h1>

              {stats.length > 0 ? (
                <>
                  {introText && (
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4 max-w-2xl">
                      {introText}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                    {stats.map((st, i) => {
                      const pal = statPalettes[i % statPalettes.length];
                      const Icon = st.Icon;
                      return (
                        <div
                          key={i}
                          onClick={() => onNavigate('muassasalar')}
                          className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-sky-200 transition-all duration-300 cursor-pointer group"
                        >
                          <span className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${pal.bar} opacity-80`} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-none ${pal.num}`}>
                                {st.value}
                              </div>
                              <div className="mt-2 text-xs sm:text-sm font-medium text-slate-600 leading-snug">
                                {st.label}
                              </div>
                            </div>
                            <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl ring-1 ${pal.box} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl whitespace-pre-line">
                  {subtitleText}
                </p>
              )}

            </div>
          </div>

          {/* Right Column: Hero Showcase Image */}
          <div className="lg:col-span-5 relative w3-animate-right">
            <div className="w-full h-full min-h-[320px] lg:min-h-[420px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative group">
              <img
                src={
                  settings.heroImageUrl &&
                  settings.heroImageUrl !== heroImage &&
                  !settings.heroImageUrl.includes('hero_education_district')
                    ? settings.heroImageUrl
                    : './assets/aistudio/IMG_20261114_101244_271_9b96aa41.jpg'
                }
                alt={t(settings.heroShowcaseTitle || settings.districtName)}
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                {settings.heroShowcaseBadge && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 block mb-1">
                    {t(settings.heroShowcaseBadge)}
                  </span>
                )}
                {settings.heroShowcaseTitle && (
                  <p className="text-sm font-bold leading-snug">
                    {t(settings.heroShowcaseTitle)}
                  </p>
                )}
                {settings.heroShowcaseDesc && (
                  <p className="text-xs text-slate-300 mt-1">
                    {t(settings.heroShowcaseDesc)}
                  </p>
                )}
              </div>
            </div>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
