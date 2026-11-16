import React from 'react';
import { MapPin, Phone, Mail, Clock, Send, Globe } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

const MAP_LAT = '41.52793681140537';
const MAP_LNG = '60.35879624415235';

export const ContactMapSection: React.FC = () => {
  const { settings, t } = usePortal();

  return (
    <section id="aloqa" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-wider font-semibold text-sky-800">
            {t(settings.contactKicker || "Bog'lanish")}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {t(settings.contactTitle || settings.districtName)}
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            {t(settings.contactSubtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">
                    {t(settings.contactAddressLabel || "Tashkilot manzili:")}
                  </h4>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                    {t(settings.address)}
                  </p>
                  {settings.landmarkText && (
                    <p className="text-xs text-slate-500 mt-1">{t(settings.landmarkText)}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">{t("Ishonch telefoni:")}</h4>
                  <a href="tel:998556055093" className="text-sm font-bold text-amber-700 hover:underline">
                    +998 (55) 605-50-93
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">{t("Elektron pochta:")}</h4>
                  <a href="mailto:qoshkopirtalim@umail.uz" className="text-sm font-semibold text-sky-800 hover:underline">
                    qoshkopirtalim@umail.uz
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">{t("Ish tartibi:")}</h4>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {t(settings.workingHours)}
                  </p>
                </div>
              </div>
            </div>

            {/* Social channels */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                {t("Rasmiy ijtimoiy tarmoqlar:")}
              </span>
              <div className="flex flex-wrap gap-2">
                {settings.telegramChannel && (
                  <a
                    href={settings.telegramChannel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sky-200"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t("Telegram kanal")}</span>
                  </a>
                )}
                {settings.facebookPage && (
                  <a
                    href={settings.facebookPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t("Facebook sahifa")}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tashkilot joylashuvi xaritasi */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-800" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                  {t("Tashkilot joylashuvi")}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-sky-800 text-white rounded text-xs font-semibold hover:bg-sky-900 shrink-0"
              >
                {t("Xaritada ko'rish")}
              </a>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
              <iframe
                title={t("Tashkilot joylashuvi")}
                src={`https://maps.google.com/maps?q=${MAP_LAT},${MAP_LNG}&z=16&output=embed`}
                className="w-full h-[300px] block"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {t("Koordinatalar")}: {MAP_LAT}, {MAP_LNG}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
