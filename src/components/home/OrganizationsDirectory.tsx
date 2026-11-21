import React, { useState, useEffect, useCallback } from 'react';
import {
  School,
  Baby,
  Search,
  Phone,
  MapPin,
  Users,
  Award,
  X,
  Building2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { Organization } from '../../types';
import { normalizePhotoUrl, toNewUzbekAlphabet } from '../../utils/uzbekTypography';

const ITEMS_PER_PAGE = 21;

export const OrganizationsDirectory: React.FC = () => {
  const { settings, organizations, googleSyncStatus, refreshDataFromSheets, useNewAlphabet, setUseNewAlphabet, t } = usePortal();
  const [filterType, setFilterType] = useState<'all' | 'maktab' | 'mtt' | 'ixtisos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [photoEnlarged, setPhotoEnlarged] = useState<string | null>(null);
  const [isClosingOrg, setIsClosingOrg] = useState<boolean>(false);
  const [isClosingPhoto, setIsClosingPhoto] = useState<boolean>(false);

  const handleOpenOrg = (org: Organization) => {
    setIsClosingOrg(false);
    setSelectedOrg(org);
  };

  const handleCloseOrg = useCallback(() => {
    if (isClosingOrg) return;
    setIsClosingOrg(true);
    setTimeout(() => {
      setSelectedOrg(null);
      setIsClosingOrg(false);
    }, 210);
  }, [isClosingOrg]);

  const handleOpenPhoto = (url: string) => {
    setIsClosingPhoto(false);
    setPhotoEnlarged(url);
  };

  const handleClosePhoto = useCallback(() => {
    if (isClosingPhoto) return;
    setIsClosingPhoto(true);
    setTimeout(() => {
      setPhotoEnlarged(null);
      setIsClosingPhoto(false);
    }, 210);
  }, [isClosingPhoto]);

  useEffect(() => {
    if (!selectedOrg && !photoEnlarged) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (photoEnlarged) {
          handleClosePhoto();
        } else if (selectedOrg) {
          handleCloseOrg();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedOrg, photoEnlarged, handleCloseOrg, handleClosePhoto]);

  const normalizedQuery = toNewUzbekAlphabet(searchQuery.toLowerCase());
  const rawQuery = searchQuery.toLowerCase();

  const filteredOrgs = organizations.filter(org => {
    const matchesType = filterType === 'all' || org.type === filterType;
    const matchesSearch =
      org.name.toLowerCase().includes(rawQuery) ||
      toNewUzbekAlphabet(org.name.toLowerCase()).includes(normalizedQuery) ||
      org.number.toString().includes(searchQuery) ||
      org.mahalla.toLowerCase().includes(rawQuery) ||
      toNewUzbekAlphabet(org.mahalla.toLowerCase()).includes(normalizedQuery) ||
      org.director.toLowerCase().includes(rawQuery) ||
      toNewUzbekAlphabet(org.director.toLowerCase()).includes(normalizedQuery);
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE) || 1;

  // Ensure current page is valid when filter or search changes
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedOrgs = filteredOrgs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleFilterChange = (type: 'all' | 'maktab' | 'mtt' | 'ixtisos') => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <section id="muassasalar" className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-sky-800">
                {t(settings.orgsKicker || "Ta'lim muassasalari tarmog'i")}
              </span>
              <button
                type="button"
                onClick={() => setUseNewAlphabet(!useNewAlphabet)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 cursor-pointer ${
                  useNewAlphabet
                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
                title={t("Yangilangan alifboga (ş, ç, ö, ğ) o'girish")}
              >
                <Sparkles className="w-3 h-3 text-sky-600" />
                <span>{useNewAlphabet ? "Alifbo: Yangilangan (ş, ç, ö, ğ)" : "Alifbo: Standart (sh, ch, o', g')"}</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {t(settings.orgsTitle || "Tarkibiy muassasalar va ta'lim bo'linmalari")}
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              {t(settings.orgsSubtitle)}
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg flex-wrap sm:flex-nowrap">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t(settings.orgsFilterAllLabel || "Barchasi")} ({organizations.length})
            </button>
            <button
              onClick={() => handleFilterChange('maktab')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterType === 'maktab' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t(settings.orgsFilterSchoolLabel || "Maktablar")} ({organizations.filter(o => o.type === 'maktab').length})
            </button>
            <button
              onClick={() => handleFilterChange('mtt')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterType === 'mtt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t(settings.orgsFilterKindergartenLabel || "Bog'chalar - MTT")} ({organizations.filter(o => o.type === 'mtt').length})
            </button>
            <button
              onClick={() => handleFilterChange('ixtisos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterType === 'ixtisos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t(settings.orgsFilterSpecializedLabel || "Ixtisoslashgan")} ({organizations.filter(o => o.type === 'ixtisos').length})
            </button>
          </div>
        </div>

        {/* Search Bar & Live Sheets Sync Button */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("Raqam, mahalla yoki direktor bo'yicha qidirish...")}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                {t("Tozalash")}
              </button>
            )}
          </div>

          {/* Live Sync with Google Sheets indicator & button */}
          <div className="flex items-center gap-2 shrink-0">
            {googleSyncStatus.lastSyncedAt && (
              <span className="hidden lg:inline text-[11px] text-slate-500 font-medium">
                {t("Sinxronlangan")}: {googleSyncStatus.lastSyncedAt}
              </span>
            )}
            <button
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await refreshDataFromSheets();
                } finally {
                  setTimeout(() => setIsRefreshing(false), 600);
                }
              }}
              disabled={isRefreshing || googleSyncStatus.syncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
              title={t("Google Sheets jadval (14xTiUicc9...) bazasidagi o'zgarishlarni yuklab olish")}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing || googleSyncStatus.syncing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing || googleSyncStatus.syncing ? t("Yuklanmoqda...") : t("Baza bilan yangilash")}</span>
            </button>
          </div>
        </div>

        {/* Organizations Grid - Exactly 6 items per page */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedOrgs.map((org, idx) => {
            const isSchool = org.type === 'maktab' || org.type === 'ixtisos';
            const normalizedPhoto = normalizePhotoUrl(org.photoUrl);

            return (
              <div
                key={`${org.id}-${filterType}-${activePage}-${startIndex + idx}`}
                onClick={() => handleOpenOrg(org)}
                style={{ animationDelay: `${idx * 45}ms` }}
                className="w3-animate-bottom bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-sky-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      {isSchool ? <School className="w-4 h-4 text-blue-600" /> : <Baby className="w-4 h-4 text-emerald-600" />}
                      <span>
                        {org.type === 'mtt'
                          ? t("Maktabgacha tashkilot")
                          : org.type === 'ixtisos'
                          ? t("Ixtisoslashgan maktab")
                          : t("Umumta'lim maktabi")}
                      </span>
                    </span>

                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{org.rating}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors mb-2 leading-snug">
                    {t(org.name)}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{t(org.address)} ({t(org.mahalla)})</span>
                    </div>

                    {/* Director line with avatar if available */}
                    <div className="flex items-center gap-3 pt-1">
                      {normalizedPhoto ? (
                        <img
                          src={normalizedPhoto}
                          alt={t(org.director)}
                          className="w-20 h-24 rounded-md object-cover border-2 border-slate-300 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-20 h-24 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <span className="line-clamp-1">
                        {t("Direktor")}: <strong className="font-semibold text-slate-800">{t(org.director)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{org.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-medium">
                    {org.studentsCount} {isSchool ? t("o'quvchi") : t("tarbiyalanuvchi")} · {org.teachersCount} {t("pedagog")}
                  </div>
                  <span className="text-sky-700 font-semibold group-hover:underline flex items-center gap-1">
                    <span>{t("Batafsil")}</span>
                    <span className="text-[11px]">→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrgs.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">{t("So'rovingizga mos muassasa topilmadi.")}</p>
          </div>
        )}

        {/* Pagination Bar (Exactly 6 items per page) */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              {t("Jami")} {filteredOrgs.length} {t("ta muassasadan")}{" "}
              <strong className="text-slate-700 font-semibold">
                {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredOrgs.length)}
              </strong>{" "}
              {t("ko'rsatilmoqda")} ({t("Sahifa")} {activePage} / {totalPages})
            </span>

            <div className="flex items-center gap-1.5">
              {/* Previous page button */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={activePage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 text-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t("Oldingi")}</span>
              </button>

              {/* Numbered Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show current page, edges, and neighbors
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - activePage) <= 2;
                })
                .map((page, pIdx, arr) => {
                  const prevPage = arr[pIdx - 1];
                  const hasGap = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {hasGap && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          activePage === page
                            ? 'bg-sky-800 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              {/* Next page button */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={activePage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 text-slate-700"
              >
                <span>{t("Keyingi")}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Organization Details Modal with Director Photo (From Google Sheets Column O) */}
      {selectedOrg && (
        <div
          onClick={handleCloseOrg}
          className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${
            isClosingOrg ? 'w3-animate-opacity-out' : 'w3-animate-opacity'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-6 ${
              isClosingOrg ? 'w3-animate-zoom-out' : 'w3-animate-zoom'
            }`}
          >
            <button
              onClick={handleCloseOrg}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              aria-label={t("Yopish")}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Institution Badge & Type */}
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-800 mb-2">
              <Building2 className="w-4 h-4 text-sky-700" />
              <span>
                {selectedOrg.type === 'mtt'
                  ? t("Maktabgacha ta'lim tashkiloti")
                  : selectedOrg.type === 'ixtisos'
                  ? t("Ixtisoslashtirilgan maktab")
                  : t("Umumta'lim muassasasi")}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 leading-snug">
              {t(selectedOrg.name)}
            </h2>

            {/* Director & Institution Card (Featuring Photo from Sheet Column O) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5 space-y-4">
              
              {/* Director Photo + Info Box */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-200">
                {normalizePhotoUrl(selectedOrg.photoUrl) ? (
                  <div className="relative group shrink-0">
                    <img
                      src={normalizePhotoUrl(selectedOrg.photoUrl)}
                      alt={t(selectedOrg.director)}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-sky-100 shadow-sm cursor-zoom-in group-hover:opacity-90 transition-opacity"
                      referrerPolicy="no-referrer"
                      onClick={() => handleOpenPhoto(normalizePhotoUrl(selectedOrg.photoUrl))}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './assets/images/department_head_portrait_1794303519848.jpg';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenPhoto(normalizePhotoUrl(selectedOrg.photoUrl))}
                      className="absolute inset-0 bg-black/30 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-zoom-in"
                      title={t("Kattalashtirish")}
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-200 border-2 border-slate-300 flex flex-col items-center justify-center text-slate-500 shrink-0">
                    <User className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-[10px] font-medium text-slate-500">{t("Foto mavjud emas")}</span>
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                    {t("Rahbar (Direktor)")}:
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {t(selectedOrg.director)}
                  </h3>
                  <div className="inline-block text-[11px] font-semibold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded">
                    {selectedOrg.type === 'mtt' ? t("Tashkilot mudirasi") : t("Maktab direktori")}
                  </div>
                  <p className="text-xs text-slate-500 pt-0.5">
                    {t("Reyting balli")}: <strong className="text-amber-600 font-semibold">{selectedOrg.rating}</strong> / 5.0
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">{t("Telefon")}:</span>
                  <a
                    href={`tel:${selectedOrg.phone.replace(/\D/g, '')}`}
                    className="text-sky-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedOrg.phone}</span>
                  </a>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">{t("Elektron pochta")}:</span>
                  <span className="text-slate-800 font-medium break-all">
                    {selectedOrg.email || `${selectedOrg.type}${selectedOrg.number}@talim-tashkiloti.uz`}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-0.5">{t("Manzil")}:</span>
                <span className="text-slate-800 font-medium">
                  {t(selectedOrg.address)}, {t(selectedOrg.mahalla)}
                </span>
              </div>

              {selectedOrg.description && (
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-0.5">{t("Qo'shimcha ma'lumot")}:</span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {t(selectedOrg.description)}
                  </p>
                </div>
              )}

              {/* Numerical Statistics */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">{t("Sig'im")}:</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{selectedOrg.studentsCount} {t("nafar")}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">{t("O'qituvchilar")}:</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{selectedOrg.teachersCount} {t("nafar")}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">{t("Smena")}:</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{selectedOrg.shifts}-{t("smena")}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseOrg}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                {t("Yopish")}
              </button>
              <a
                href={`tel:${selectedOrg.phone.replace(/\D/g, '')}`}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t("Qo'ng'iroq qilish")}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Lightbox Modal */}
      {photoEnlarged && (
        <div
          className={`fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out ${
            isClosingPhoto ? 'w3-animate-opacity-out' : 'w3-animate-opacity'
          }`}
          onClick={handleClosePhoto}
        >
          <div
            className={`relative max-w-2xl max-h-[90vh] p-2 ${
              isClosingPhoto ? 'w3-animate-zoom-out' : 'w3-animate-zoom'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClosePhoto}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={photoEnlarged}
              alt={t("Direktor fotosi")}
              className="max-h-[80vh] max-w-full rounded-xl shadow-2xl object-contain border border-white/20"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </section>
  );
};
