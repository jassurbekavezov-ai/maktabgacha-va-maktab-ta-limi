import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Eye,
  User,
  ArrowRight,
  Share2,
  Volume2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FolderOpen,
  Images,
  ExternalLink,
  PlayCircle
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { NewsItem } from '../../types';
import { PORTAL_CONFIG } from '../../config/portalConfig';

interface NewsSectionProps {
  selectedNews: NewsItem | null;
  onSelectNews: (news: NewsItem | null) => void;
  /** Asosiy sahifa uchun: faqat oxirgi N ta yangilik, filtrsiz */
  limit?: number;
  onShowAll?: () => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ selectedNews, onSelectNews, limit, onShowAll }) => {
  const { settings, publicNews: news, speakText, t } = usePortal();
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isClosingArticle, setIsClosingArticle] = useState<boolean>(false);
  const [isClosingLightbox, setIsClosingLightbox] = useState<boolean>(false);

  const handleCloseArticle = useCallback(() => {
    if (isClosingArticle) return;
    setIsClosingArticle(true);
    setTimeout(() => {
      onSelectNews(null);
      setIsClosingArticle(false);
    }, 210);
  }, [isClosingArticle, onSelectNews]);

  const handleCloseLightbox = useCallback(() => {
    if (isClosingLightbox) return;
    setIsClosingLightbox(true);
    setTimeout(() => {
      setIsLightboxOpen(false);
      setIsClosingLightbox(false);
    }, 210);
  }, [isClosingLightbox]);

  const categories = [
    'Barchasi',
    ...(settings.newsCategories && settings.newsCategories.length > 0
      ? settings.newsCategories
      : ['Boshqaruv', 'MTT', 'Pedagogika', 'Olimpiada', 'E\'lon'])
  ];

  const filteredNews = selectedCategory === 'Barchasi'
    ? news
    : news.filter(n => n.category === selectedCategory);

  // Reset active image index when switching or opening article
  useEffect(() => {
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
    setIsClosingArticle(false);
    setIsClosingLightbox(false);
  }, [selectedNews?.id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedNews) return;
    const gallery = (selectedNews.images && selectedNews.images.length > 0)
      ? selectedNews.images
      : (selectedNews.imageUrl ? [selectedNews.imageUrl] : []);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          handleCloseLightbox();
        } else {
          handleCloseArticle();
        }
      } else if (e.key === 'ArrowRight' && gallery.length > 1) {
        setActiveImageIndex(prev => (prev + 1) % gallery.length);
      } else if (e.key === 'ArrowLeft' && gallery.length > 1) {
        setActiveImageIndex(prev => (prev - 1 + gallery.length) % gallery.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNews, isLightboxOpen, handleCloseLightbox, handleCloseArticle]);

  const handleShare = (item: NewsItem) => {
    if (navigator.share) {
      navigator.share({
        title: t(item.title),
        text: t(item.summary),
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t("Havola nusxalandi!"));
    }
  };

  const currentGallery = selectedNews
    ? ((selectedNews.images && selectedNews.images.length > 0)
        ? selectedNews.images
        : (selectedNews.imageUrl ? [selectedNews.imageUrl] : []))
    : [];

  return (
    <section id="yangiliklar" className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-800">
              {t(settings.newsKicker || "Axborot xizmati")}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {limit ? t("So'nggi yangiliklar") : t(settings.newsTitle || "Yangiliklar va rasmiy xabarlar")}
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              {t(settings.newsSubtitle)}
            </p>
          </div>

          {/* Interactive Category Filter Tabs */}
          {limit && onShowAll ? (
            <button
              onClick={onShowAll}
              className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-sky-800 text-white hover:bg-sky-900 shadow-xs"
            >
              {t("Barcha yangiliklar")} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </div>
          )}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(limit ? filteredNews.slice(0, limit) : filteredNews).map((item, idx) => {
            const hasMultipleImages = (item.images && item.images.length > 1);
            const imageCount = item.images?.length || 1;
            const cardImg = (item.images && item.images[0]) || item.imageUrl;

            return (
              <article
                key={`${item.id}-${selectedCategory}`}
                onClick={() => onSelectNews(item)}
                style={{ animationDelay: `${Math.min(idx, 5) * 45}ms` }}
                className="w3-animate-bottom bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col group"
              >
                <div className="h-48 w-full overflow-hidden relative bg-slate-100">
                  <img
                    src={cardImg}
                    alt={t(item.title)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './assets/images/hero_education_district_1794303548345.jpg';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                    {t(item.category)}
                  </div>

                  {item.videos && item.videos.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-slate-900/70 rounded-full p-2.5 shadow-lg">
                        <PlayCircle className="w-9 h-9 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Multi-image indicator badge */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <Images className="w-3.5 h-3.5 text-sky-400" />
                      <span>{imageCount} {t("ta rasm")}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.date}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{item.views}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2 mb-2 leading-snug">
                      {t(item.title)}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {t(item.summary)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{t(item.author)}</span>
                    <span className="text-sky-700 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>{t("O'qish va galereya")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">{t("Ushbu toifada hozircha yangiliklar mavjud emas.")}</p>
          </div>
        )}
      </div>

      {/* Full Article Modal Reader with Interactive Image Gallery */}
      {selectedNews && (
        <div
          onClick={handleCloseArticle}
          className={`fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${
            isClosingArticle ? 'w3-animate-opacity-out' : 'w3-animate-opacity'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 my-6 ${
              isClosingArticle ? 'w3-animate-zoom-out' : 'w3-animate-zoom'
            }`}
          >
            
            {/* Gallery Main Viewer */}
            <div className="relative w-full bg-slate-950 select-none group">
              <div className="relative h-64 sm:h-96 md:h-[420px] w-full flex items-center justify-center overflow-hidden bg-slate-900">
                <img
                  src={currentGallery[activeImageIndex] || selectedNews.imageUrl}
                  alt={`${t(selectedNews.title)} - Rasm ${activeImageIndex + 1}`}
                  className="w-full h-full object-contain cursor-zoom-in transition-all duration-200"
                  referrerPolicy="no-referrer"
                  onClick={() => setIsLightboxOpen(true)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './assets/images/hero_education_district_1794303548345.jpg';
                  }}
                />

                {/* Left navigation arrow */}
                {currentGallery.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((activeImageIndex - 1 + currentGallery.length) % currentGallery.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white transition-all backdrop-blur-xs shadow-lg hover:scale-105 active:scale-95"
                    aria-label={t("Oldingi rasm")}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* Right navigation arrow */}
                {currentGallery.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((activeImageIndex + 1) % currentGallery.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white transition-all backdrop-blur-xs shadow-lg hover:scale-105 active:scale-95"
                    aria-label={t("Keyingi rasm")}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}

                {/* Top Action Buttons (Close & Lightbox) */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white transition-colors backdrop-blur-xs"
                    title={t("Kattalashtirish (Fullscreen)")}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseArticle}
                    className="p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white transition-colors backdrop-blur-xs"
                    aria-label={t("Yopish")}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Badges: Category & Gallery Counter */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="bg-sky-700/90 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded shadow-sm">
                    {t(selectedNews.category)}
                  </div>
                  {currentGallery.length > 1 && (
                    <div className="bg-black/75 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm flex items-center gap-1">
                      <Images className="w-3.5 h-3.5 text-sky-400" />
                      <span>{activeImageIndex + 1} / {currentGallery.length} rasm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnails Strip */}
              {currentGallery.length > 1 && (
                <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
                  {currentGallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all ${
                        activeImageIndex === idx
                          ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900 scale-105 opacity-100'
                          : 'opacity-50 hover:opacity-90'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Article Content */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{selectedNews.date}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{t(selectedNews.author)}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>{selectedNews.views} {t("marta ko'rildi")}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakText(`${selectedNews.title}. ${selectedNews.content}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    title={t("Ovozli o'qish")}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t("Ovozli eshitish")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(selectedNews)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    title={t("Ulashish")}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{t("Ulashish")}</span>
                  </button>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-4">
                {t(selectedNews.title)}
              </h1>

              {selectedNews.summary && (
                <div className="text-sm sm:text-base font-medium text-slate-700 bg-sky-50/70 p-4 rounded-xl border border-sky-100 mb-6 leading-relaxed">
                  {t(selectedNews.summary)}
                </div>
              )}

              <div className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {t(selectedNews.content)}
              </div>

              {selectedNews.videos && selectedNews.videos.length > 0 && (
                <div className="mt-6 space-y-4">
                  {selectedNews.videos.map((vid, i) =>
                    vid.src ? (
                      <video
                        key={i}
                        src={vid.src}
                        poster={vid.thumb || undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-[70vh] rounded-xl bg-black"
                      />
                    ) : (
                      <a
                        key={i}
                        href={vid.url || selectedNews.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block w-full rounded-xl overflow-hidden bg-slate-900 group/vid"
                      >
                        {vid.thumb && (
                          <img
                            src={vid.thumb}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full max-h-[70vh] object-cover opacity-80 group-hover/vid:opacity-60 transition-opacity"
                          />
                        )}
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                          <PlayCircle className="w-16 h-16" />
                          <span className="text-sm font-semibold bg-slate-900/70 px-3 py-1 rounded-md">
                            {t("Videoni Telegramda ko'rish")}{vid.duration ? ` · ${vid.duration}` : ''}
                          </span>
                        </span>
                      </a>
                    )
                  )}
                </div>
              )}

              {selectedNews.sourceUrl && (
                <a
                  href={selectedNews.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900"
                >
                  {t("Telegram kanalda ko'rish")} →
                </a>
              )}

              {/* Gallery Grid Preview inside Article Body */}
              {currentGallery.length > 1 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Images className="w-4 h-4 text-sky-700" />
                    <span>{t("Fotolavhalar to'plami")} ({currentGallery.length} {t("ta rasm")}):</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentGallery.map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setActiveImageIndex(i);
                          setIsLightboxOpen(true);
                        }}
                        className={`group relative h-28 sm:h-32 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-2xs hover:shadow-md transition-all ${
                          activeImageIndex === i ? 'ring-2 ring-sky-600' : ''
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Rasm ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/70 text-[10px] text-white px-1.5 py-0.5 rounded">
                          {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">

                <button
                  type="button"
                  onClick={handleCloseArticle}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {t("Yopish")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {selectedNews && isLightboxOpen && (
        <div
          className={`fixed inset-0 z-60 bg-black/95 flex flex-col justify-between p-4 ${
            isClosingLightbox ? 'w3-animate-opacity-out' : 'w3-animate-opacity'
          }`}
          onClick={handleCloseLightbox}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white py-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-200">
                {t(selectedNews.title)}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-sky-300">
                {activeImageIndex + 1} / {currentGallery.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCloseLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={t("Yopish (Esc)")}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Center Image & Arrows */}
          <div className="relative flex-1 flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
            {currentGallery.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIndex((activeImageIndex - 1 + currentGallery.length) % currentGallery.length)}
                className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <img
              src={currentGallery[activeImageIndex] || selectedNews.imageUrl}
              alt={`${selectedNews.title} katta rasm`}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />

            {currentGallery.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIndex((activeImageIndex + 1) % currentGallery.length)}
                className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Strip */}
          <div className="py-2 flex items-center justify-center gap-2 overflow-x-auto" onClick={e => e.stopPropagation()}>
            {currentGallery.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-12 h-9 sm:w-16 sm:h-12 rounded overflow-hidden shrink-0 transition-all ${
                  activeImageIndex === idx ? 'ring-2 ring-sky-400 scale-105 opacity-100' : 'opacity-40 hover:opacity-80'
                }`}
              >
                <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
