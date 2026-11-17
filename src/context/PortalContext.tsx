import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { NewsItem, Organization, Leader, DocumentItem, CitizenAppeal, PortalSettings, GoogleSyncStatus } from '../types';
import {
  INITIAL_NEWS,
  INITIAL_ORGANIZATIONS,
  INITIAL_LEADERS,
  INITIAL_DOCUMENTS,
  INITIAL_APPEALS,
  INITIAL_SETTINGS
} from '../data/initialData';
import { initAuth, googleSignIn, googleSignInRedirect, logout, getCurrentUser } from '../services/googleAuth';
import {
  getOrCreateSpreadsheet,
  fetchAllPortalDataFromSheets,
  syncAllDataToGoogleSheets,
  getStoredSpreadsheetId,
  setStoredSpreadsheetId,
  extractSpreadsheetId
} from '../services/googleSheets';
import { getOrCreatePortalFolder } from '../services/googleDrive';
import { PORTAL_CONFIG } from '../config/portalConfig';
import { toNewUzbekAlphabet } from '../utils/uzbekTypography';

import { createGoogleAdminSession, isEmailAllowedAdmin } from '../services/adminAuth';
import { normalizeSettings } from '../utils/normalizeSettings';

export interface AdminGoogleAuthResult {
  authorized: boolean;
  email?: string;
  error?: string;
}

interface PortalContextType {
  // State
  news: NewsItem[];
  /** Saytdagi yangiliklar + Telegram kanal postlari (ommaviy sahifalar uchun) */
  publicNews: NewsItem[];
  organizations: Organization[];
  leaders: Leader[];
  documents: DocumentItem[];
  appeals: CitizenAppeal[];
  settings: PortalSettings;

  // Google Integration & Gmail Admin Auth
  user: User | null;
  googleSyncStatus: GoogleSyncStatus;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleRedirect: () => Promise<void>;
  loginAdminWithGoogle: (mode?: 'popup' | 'redirect') => Promise<AdminGoogleAuthResult>;
  pendingAdminAuthResult: AdminGoogleAuthResult | null;
  clearPendingAdminAuthResult: () => void;
  connectSpreadsheetById: (sheetId: string) => Promise<boolean>;
  refreshDataFromSheets: (targetId?: string) => Promise<void>;
  logoutGoogle: () => Promise<void>;
  syncNow: () => Promise<void>;

  // CRUD actions
  addNews: (item: Omit<NewsItem, 'id' | 'views'>) => Promise<void>;
  updateNews: (item: NewsItem) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;

  addOrganization: (item: Omit<Organization, 'id'>) => Promise<void>;
  updateOrganization: (item: Organization) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;

  addLeader: (item: Omit<Leader, 'id'>) => Promise<void>;
  updateLeader: (item: Leader) => Promise<void>;
  deleteLeader: (id: string) => Promise<void>;

  addDocument: (item: Omit<DocumentItem, 'id'>) => Promise<void>;
  updateDocument: (item: DocumentItem) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  submitCitizenAppeal: (data: Omit<CitizenAppeal, 'id' | 'trackingCode' | 'date' | 'status'>) => Promise<string>;
  updateAppeal: (item: CitizenAppeal) => Promise<void>;
  deleteAppeal: (id: string) => Promise<void>;

  updateSettings: (newSettings: Partial<PortalSettings>) => Promise<void>;

  // Accessibility
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  contrastMode: 'normal' | 'high' | 'grayscale';
  setContrastMode: (mode: 'normal' | 'high' | 'grayscale') => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;

  // Alphabet Mode (New Uzbek Latin: ş, ç, ö, ğ)
  useNewAlphabet: boolean;
  setUseNewAlphabet: (val: boolean) => void;
  t: (text?: string) => string;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'qoshkopir_portal_data_v1';

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial local data if cached
  const [news, setNews] = useState<NewsItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_news`);
      return saved ? JSON.parse(saved) : INITIAL_NEWS;
    } catch {
      return INITIAL_NEWS;
    }
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_orgs`);
      return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
    } catch {
      return INITIAL_ORGANIZATIONS;
    }
  });

  const [leaders, setLeaders] = useState<Leader[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_leaders`);
      return saved ? JSON.parse(saved) : INITIAL_LEADERS;
    } catch {
      return INITIAL_LEADERS;
    }
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_docs`);
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [appeals, setAppeals] = useState<CitizenAppeal[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_appeals`);
      return saved ? JSON.parse(saved) : INITIAL_APPEALS;
    } catch {
      return INITIAL_APPEALS;
    }
  });

  const [settings, setSettings] = useState<PortalSettings>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const migratedDistrictName =
          !parsed.districtName || parsed.districtName === "Qo'shko'pir Ta'lim Tashkiloti"
            ? INITIAL_SETTINGS.districtName
            : parsed.districtName;
        const migratedShortName =
          !parsed.shortName || parsed.shortName === "Ta'lim Tashkiloti"
            ? INITIAL_SETTINGS.shortName
            : parsed.shortName;
        const migratedRegionLabel =
          !parsed.regionLabel || parsed.regionLabel === "Xorazm viloyati · Qo'shko'pir"
            ? INITIAL_SETTINGS.regionLabel
            : parsed.regionLabel;
        return normalizeSettings({
          ...parsed,
          districtName: migratedDistrictName,
          shortName: migratedShortName,
          regionLabel: migratedRegionLabel
        });
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Telegram kanal postlari (deploy paytida public/telegram-news.json ga yoziladi)
  const [telegramNews, setTelegramNews] = useState<NewsItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/telegram-news.json?t=${Math.floor(Date.now() / 300000)}`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (!cancelled && Array.isArray(data)) setTelegramNews(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const publicNews = useMemo<NewsItem[]>(() => {
    const normTitle = (s: string) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').slice(0, 60);
    const siteTgIds = new Set(news.map(n => n.telegramMessageId).filter(Boolean).map(String));
    const siteTitles = new Set(news.map(n => normTitle(n.title)));
    const fallbackImg = './assets/images/hero_education_district_1794303548345.jpg';
    const extra = telegramNews
      .filter(tg => !siteTgIds.has(String(tg.telegramMessageId)) && !siteTitles.has(normTitle(tg.title)))
      .map(tg => {
        const images = Array.isArray(tg.images) && tg.images.length > 0 ? tg.images : [];
        const imageUrl = tg.imageUrl || images[0] || fallbackImg;
        return { ...tg, imageUrl, images: images.length > 0 ? images : [imageUrl] };
      });
    const dateKey = (n: NewsItem) => {
      const s = String(n.date || '');
      const m = s.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/);
      return m ? `${m[1]}-${String(+m[2] + 1).padStart(2, '0')}-${m[3].padStart(2, '0')}` : s.slice(0, 10);
    };
    return [...news, ...extra].sort((a, b) => {
      if (!!b.isPinned !== !!a.isPinned) return b.isPinned ? 1 : -1;
      return dateKey(b).localeCompare(dateKey(a));
    });
  }, [news, telegramNews]);

  // Google State
  const [user, setUser] = useState<User | null>(null);
  const [pendingAdminAuthResult, setPendingAdminAuthResult] = useState<AdminGoogleAuthResult | null>(null);
  const clearPendingAdminAuthResult = useCallback(() => setPendingAdminAuthResult(null), []);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<GoogleSyncStatus>({
    isConnected: false,
    spreadsheetId: getStoredSpreadsheetId(),
    spreadsheetUrl: null,
    folderId: null,
    folderUrl: null,
    lastSyncedAt: null,
    syncing: false,
    error: null
  });

  // Accessibility State
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [contrastMode, setContrastModeState] = useState<'normal' | 'high' | 'grayscale'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Alphabet Mode State (default: true => updated Uzbek alphabet ş, ç, ö, ğ)
  const [useNewAlphabet, setUseNewAlphabetState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('qoshkopir_alphabet_new');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const setUseNewAlphabet = useCallback((val: boolean) => {
    setUseNewAlphabetState(val);
    try {
      localStorage.setItem('qoshkopir_alphabet_new', String(val));
    } catch {}
  }, []);

  const t = useCallback((text?: string): string => {
    if (!text) return '';
    return useNewAlphabet ? toNewUzbekAlphabet(text) : text;
  }, [useNewAlphabet]);

  useEffect(() => {
    const titleBase = settings.districtName || "Ta'lim Tashkiloti";
    document.title = useNewAlphabet ? toNewUzbekAlphabet(titleBase) : titleBase;
  }, [useNewAlphabet, settings.districtName]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_news`, JSON.stringify(news));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_orgs`, JSON.stringify(organizations));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_leaders`, JSON.stringify(leaders));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_docs`, JSON.stringify(documents));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_appeals`, JSON.stringify(appeals));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(settings));
    } catch (e) {
      console.warn("Mahalliy xotiraga yozishda cheklov:", e);
    }
  }, [news, organizations, leaders, documents, appeals, settings]);

  // Synchronize with Google Sheets
  const triggerGoogleSheetsSync = useCallback(async (
    targetSpreadsheetId?: string,
    stateOverride?: {
      news?: NewsItem[];
      organizations?: Organization[];
      leaders?: Leader[];
      documents?: DocumentItem[];
      appeals?: CitizenAppeal[];
      settings?: PortalSettings;
    }
  ) => {
    const sheetId = targetSpreadsheetId || googleSyncStatus.spreadsheetId || getStoredSpreadsheetId();
    if (!sheetId) return;

    try {
      setGoogleSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      await syncAllDataToGoogleSheets(sheetId, {
        news: stateOverride?.news || news,
        organizations: stateOverride?.organizations || organizations,
        leaders: stateOverride?.leaders || leaders,
        documents: stateOverride?.documents || documents,
        appeals: stateOverride?.appeals || appeals,
        settings: stateOverride?.settings || settings
      });

      setGoogleSyncStatus(prev => ({
        ...prev,
        syncing: false,
        lastSyncedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        error: null
      }));
    } catch (err: any) {
      console.error("Google Sheets sinxronlashda xatolik:", err);
      setGoogleSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: err.message || "Google Sheets bilan bog'lanishda xatolik"
      }));
    }
  }, [news, organizations, leaders, documents, appeals, settings, googleSyncStatus.spreadsheetId]);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authUser, token) => {
        setUser(authUser);
        if (token) {
          // Connected with valid token - check or create spreadsheet
          try {
            setGoogleSyncStatus(prev => ({ ...prev, syncing: true, isConnected: true }));
            const sheetInfo = await getOrCreateSpreadsheet();
            const folderId = await getOrCreatePortalFolder();

            setGoogleSyncStatus(prev => ({
              ...prev,
              isConnected: true,
              spreadsheetId: sheetInfo.id,
              spreadsheetUrl: sheetInfo.url,
              folderId: folderId,
              folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
              syncing: false,
              error: null
            }));

            let latestAllowedEmails: string[] = [
              ...(settings.allowedAdminEmails || []),
              ...leaders.map(l => l.adminEmail || '').filter(Boolean)
            ];

            // If existing spreadsheet, load data from it
            if (!sheetInfo.isNew) {
              const loaded = await fetchAllPortalDataFromSheets(sheetInfo.id);
              setNews(loaded.news);
              setOrganizations(loaded.organizations);
              setLeaders(loaded.leaders);
              setDocuments(loaded.documents);
              setAppeals(loaded.appeals);
              setSettings(prev => normalizeSettings({ ...prev, ...loaded.settings }));
              latestAllowedEmails = Array.from(new Set([
                ...(loaded.settings.allowedAdminEmails || []),
                ...loaded.leaders.map(l => l.adminEmail || '').filter(Boolean),
                ...INITIAL_SETTINGS.allowedAdminEmails
              ]));
            }

            // Finish pending Gmail Admin Login if returning from redirect
            try {
              if (sessionStorage.getItem('pending_admin_gmail_login') === '1') {
                sessionStorage.removeItem('pending_admin_gmail_login');
                const email = authUser.email || '';
                if (isEmailAllowedAdmin(email, latestAllowedEmails)) {
                  createGoogleAdminSession(email, authUser.displayName || undefined, true);
                  setPendingAdminAuthResult({ authorized: true, email });
                } else {
                  setPendingAdminAuthResult({
                    authorized: false,
                    email,
                    error: `Ushbu Gmail (${email}) hisobiga admin ruxsati berilmagan. Ruxsat olish uchun bosh administratordan Gmail manzilingizni ruxsatlar ro'yxatiga qo'shishni so'rang.`
                  });
                }
              }
            } catch {}
          } catch (err: any) {
            console.warn("Google Sheets dastlabki tekshiruvida xatolik:", err);
            setGoogleSyncStatus(prev => ({
              ...prev,
              isConnected: true,
              syncing: false,
              error: err.message
            }));
          }
        }
      },
      () => {
        setUser(null);
        setGoogleSyncStatus(prev => ({ ...prev, isConnected: false, syncing: false }));
      }
    );

    return () => unsubscribe();
  }, []);

  // Universal Public/Auth Sheets Synchronization
  const refreshDataFromSheets = useCallback(async (targetId?: string) => {
    const rawId = targetId || googleSyncStatus.spreadsheetId || getStoredSpreadsheetId() || settings.googleSpreadsheetId;
    if (!rawId) return;
    const cleanId = extractSpreadsheetId(rawId);
    if (!cleanId) return;

    try {
      setGoogleSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      const loaded = await fetchAllPortalDataFromSheets(cleanId);
      if (loaded) {
        if (loaded.organizations && loaded.organizations.length > 0) {
          setOrganizations(loaded.organizations);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_orgs`, JSON.stringify(loaded.organizations));
          } catch {}
        }
        if (loaded.news && loaded.news.length > 0) {
          setNews(loaded.news);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_news`, JSON.stringify(loaded.news));
          } catch {}
        }
        if (loaded.leaders && loaded.leaders.length > 0) {
          setLeaders(loaded.leaders);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_leaders`, JSON.stringify(loaded.leaders));
          } catch {}
        }
        if (loaded.documents && loaded.documents.length > 0) {
          setDocuments(loaded.documents);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_docs`, JSON.stringify(loaded.documents));
          } catch {}
        }
        if (loaded.appeals && loaded.appeals.length > 0) {
          setAppeals(loaded.appeals);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_appeals`, JSON.stringify(loaded.appeals));
          } catch {}
        }
        if (loaded.settings) {
          setSettings(prev => {
            const loadedSettings = normalizeSettings({ ...prev, ...loaded.settings });
            return {
              ...loadedSettings,
              navLabels: { ...normalizeSettings(prev).navLabels, ...loadedSettings.navLabels },
              googleSpreadsheetId: cleanId
            };
          });
        }
      }
      setGoogleSyncStatus(prev => ({
        ...prev,
        spreadsheetId: cleanId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
        syncing: false,
        lastSyncedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        error: null
      }));
    } catch (err: any) {
      console.warn("Google Sheets yangilanishida ogohlantirish:", err);
      setGoogleSyncStatus(prev => ({
        ...prev,
        syncing: false
      }));
    }
  }, [googleSyncStatus.spreadsheetId, settings.googleSpreadsheetId]);

  // Initial auto-sync and periodic background poll from Google Sheets
  useEffect(() => {
    // XAVFSIZLIK: ?sheet= havola parametri orqali bazani almashtirish o'chirildi.

    // 2. Initial fetch if ID already configured
    const initialId = getStoredSpreadsheetId() || settings.googleSpreadsheetId;
    if (initialId) {
      refreshDataFromSheets(initialId);
    }

    // 3. Periodic background poll (every 30 seconds)
    const interval = setInterval(() => {
      const activeId = getStoredSpreadsheetId() || settings.googleSpreadsheetId;
      if (activeId) {
        refreshDataFromSheets(activeId);
      }
    }, PORTAL_CONFIG.AUTO_REFRESH_INTERVAL_MS || 30000);

    // 4. Instant synchronization when user switches back to website tab
    const handleTabFocus = () => {
      const activeId = getStoredSpreadsheetId() || settings.googleSpreadsheetId;
      if (activeId) {
        refreshDataFromSheets(activeId);
      }
    };

    window.addEventListener('focus', handleTabFocus);
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleTabFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleTabFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshDataFromSheets, settings.googleSpreadsheetId]);

  const loginWithGoogle = async () => {
    try {
      setGoogleSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        const sheetInfo = await getOrCreateSpreadsheet();
        let folderId: string | null = null;
        try {
          folderId = await getOrCreatePortalFolder();
        } catch (e) {
          console.warn("Drive jild yaratishda ogohlantirish:", e);
        }

        setGoogleSyncStatus(prev => ({
          ...prev,
          isConnected: true,
          spreadsheetId: sheetInfo.id,
          spreadsheetUrl: sheetInfo.url,
          folderId,
          folderUrl: folderId ? `https://drive.google.com/drive/folders/${folderId}` : null,
          syncing: false,
          error: null
        }));

        if (!sheetInfo.isNew) {
          const loaded = await fetchAllPortalDataFromSheets(sheetInfo.id);
          setNews(loaded.news);
          setOrganizations(loaded.organizations);
          setLeaders(loaded.leaders);
          setDocuments(loaded.documents);
          setAppeals(loaded.appeals);
          setSettings(prev => normalizeSettings({ ...prev, ...loaded.settings }));
        }
      }
    } catch (err: any) {
      console.error("Login xatoligi:", err);
      const isDomainError = err.code === 'auth/unauthorized-domain';
      setGoogleSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: err.customExplanation || err.message,
        unauthorizedDomain: isDomainError ? (err.domainToAdd || window.location.hostname) : null
      }));
      throw err;
    }
  };

  const loginWithGoogleRedirect = async () => {
    try {
      setGoogleSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      await googleSignInRedirect();
    } catch (err: any) {
      console.error("Redirect login xatoligi:", err);
      const isDomainError = err.code === 'auth/unauthorized-domain';
      setGoogleSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: err.customExplanation || err.message,
        unauthorizedDomain: isDomainError ? (err.domainToAdd || window.location.hostname) : null
      }));
    }
  };

  const loginAdminWithGoogle = async (mode: 'popup' | 'redirect' = 'popup'): Promise<AdminGoogleAuthResult> => {
    if (mode === 'redirect') {
      try {
        sessionStorage.setItem('pending_admin_gmail_login', '1');
      } catch {}
      await loginWithGoogleRedirect();
      return { authorized: false };
    }

    try {
      setGoogleSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      const result = await googleSignIn();
      if (!result) {
        setGoogleSyncStatus(prev => ({ ...prev, syncing: false }));
        return { authorized: false, error: "Google hisobiga kirish bekor qilindi." };
      }

      const authUser = result.user;
      setUser(authUser);

      let latestAllowedEmails: string[] = [
        ...(settings.allowedAdminEmails || []),
        ...leaders.map(l => l.adminEmail || '').filter(Boolean),
        ...INITIAL_SETTINGS.allowedAdminEmails
      ];

      try {
        const sheetInfo = await getOrCreateSpreadsheet();
        let folderId: string | null = null;
        try {
          folderId = await getOrCreatePortalFolder();
        } catch {}

        setGoogleSyncStatus(prev => ({
          ...prev,
          isConnected: true,
          spreadsheetId: sheetInfo.id,
          spreadsheetUrl: sheetInfo.url,
          folderId,
          folderUrl: folderId ? `https://drive.google.com/drive/folders/${folderId}` : null,
          syncing: false,
          error: null
        }));

        if (!sheetInfo.isNew) {
          const loaded = await fetchAllPortalDataFromSheets(sheetInfo.id);
          setNews(loaded.news);
          setOrganizations(loaded.organizations);
          setLeaders(loaded.leaders);
          setDocuments(loaded.documents);
          setAppeals(loaded.appeals);
          setSettings(prev => normalizeSettings({ ...prev, ...loaded.settings }));
          latestAllowedEmails = Array.from(new Set([
            ...(loaded.settings.allowedAdminEmails || []),
            ...loaded.leaders.map(l => l.adminEmail || '').filter(Boolean),
            ...INITIAL_SETTINGS.allowedAdminEmails
          ]));
        }
      } catch (syncErr) {
        console.warn("Sheets sinxronizatsiyada ogohlantirish:", syncErr);
        setGoogleSyncStatus(prev => ({ ...prev, isConnected: true, syncing: false }));
      }

      const email = authUser.email || '';
      if (isEmailAllowedAdmin(email, latestAllowedEmails)) {
        createGoogleAdminSession(email, authUser.displayName || undefined, true);
        return { authorized: true, email };
      }

      return {
        authorized: false,
        email,
        error: `Ushbu Gmail (${email}) hisobiga admin ruxsati berilmagan. Ruxsat olish uchun bosh administratordan Gmail manzilingizni ruxsatlar ro'yxatiga qo'shishni so'rang.`
      };
    } catch (err: any) {
      const isDomainError = err.code === 'auth/unauthorized-domain';
      const msg = err.customExplanation || err.message || "Google bilan kirishda xatolik yuz berdi.";
      setGoogleSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: msg,
        unauthorizedDomain: isDomainError ? (err.domainToAdd || window.location.hostname) : null
      }));
      return { authorized: false, error: msg };
    }
  };

  const connectSpreadsheetById = async (sheetId: string): Promise<boolean> => {
    try {
      const clean = extractSpreadsheetId(sheetId);
      if (!clean) return false;

      setGoogleSyncStatus(prev => ({ ...prev, syncing: true, error: null }));
      setStoredSpreadsheetId(clean);

      const loaded = await fetchAllPortalDataFromSheets(clean);
      if (loaded) {
        if (loaded.organizations && loaded.organizations.length > 0) {
          setOrganizations(loaded.organizations);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_orgs`, JSON.stringify(loaded.organizations));
          } catch {}
        }
        if (loaded.news && loaded.news.length > 0) {
          setNews(loaded.news);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_news`, JSON.stringify(loaded.news));
          } catch {}
        }
        if (loaded.leaders && loaded.leaders.length > 0) {
          setLeaders(loaded.leaders);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_leaders`, JSON.stringify(loaded.leaders));
          } catch {}
        }
        if (loaded.documents && loaded.documents.length > 0) {
          setDocuments(loaded.documents);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_docs`, JSON.stringify(loaded.documents));
          } catch {}
        }
        if (loaded.appeals && loaded.appeals.length > 0) {
          setAppeals(loaded.appeals);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_appeals`, JSON.stringify(loaded.appeals));
          } catch {}
        }
        if (loaded.settings) {
          setSettings(prev => ({
            ...normalizeSettings({ ...prev, ...loaded.settings }),
            googleSpreadsheetId: clean
          }));
        } else {
          setSettings(prev => ({ ...prev, googleSpreadsheetId: clean }));
        }
      }

      setGoogleSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        spreadsheetId: clean,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${clean}/edit`,
        syncing: false,
        lastSyncedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        error: null
      }));
      return true;
    } catch (err: any) {
      setGoogleSyncStatus(prev => ({
        ...prev,
        syncing: false,
        error: "Google Sheets jadvaliga ulanishda xatolik: " + err.message
      }));
      return false;
    }
  };

  const logoutGoogle = async () => {
    await logout();
    setUser(null);
    setGoogleSyncStatus(prev => ({
      ...prev,
      isConnected: false,
      syncing: false,
      error: null,
      unauthorizedDomain: null
    }));
  };

  const syncNow = async () => {
    if (!googleSyncStatus.spreadsheetId) {
      if (user) {
        const sheetInfo = await getOrCreateSpreadsheet();
        await triggerGoogleSheetsSync(sheetInfo.id);
      } else {
        await loginWithGoogle();
      }
    } else {
      await triggerGoogleSheetsSync();
    }
  };

  // CRUD Implementations
  const addNews = async (item: Omit<NewsItem, 'id' | 'views'>) => {
    const newItem: NewsItem = {
      ...item,
      id: `news-${Date.now()}`,
      views: 0
    };
    const updated = [newItem, ...news];
    setNews(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { news: updated });
    }
  };

  const updateNews = async (item: NewsItem) => {
    const updated = news.map(n => n.id === item.id ? item : n);
    setNews(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { news: updated });
    }
  };

  const deleteNews = async (id: string) => {
    const updated = news.filter(n => n.id !== id);
    setNews(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { news: updated });
    }
  };

  const addOrganization = async (item: Omit<Organization, 'id'>) => {
    const newOrg: Organization = {
      ...item,
      id: `org-${Date.now()}`
    };
    const updated = [...organizations, newOrg];
    setOrganizations(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { organizations: updated });
    }
  };

  const updateOrganization = async (item: Organization) => {
    const updated = organizations.map(o => o.id === item.id ? item : o);
    setOrganizations(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { organizations: updated });
    }
  };

  const deleteOrganization = async (id: string) => {
    const updated = organizations.filter(o => o.id !== id);
    setOrganizations(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { organizations: updated });
    }
  };

  const addLeader = async (item: Omit<Leader, 'id'>) => {
    const newLeader: Leader = {
      ...item,
      id: `lead-${Date.now()}`
    };
    const updated = [...leaders, newLeader].sort((a, b) => a.order - b.order);
    setLeaders(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { leaders: updated });
    }
  };

  const updateLeader = async (item: Leader) => {
    const updated = leaders.map(l => l.id === item.id ? item : l).sort((a, b) => a.order - b.order);
    setLeaders(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { leaders: updated });
    }
  };

  const deleteLeader = async (id: string) => {
    const updated = leaders.filter(l => l.id !== id);
    setLeaders(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { leaders: updated });
    }
  };

  const addDocument = async (item: Omit<DocumentItem, 'id'>) => {
    const newDoc: DocumentItem = {
      ...item,
      id: `doc-${Date.now()}`
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { documents: updated });
    }
  };

  const updateDocument = async (item: DocumentItem) => {
    const updated = documents.map(d => d.id === item.id ? item : d);
    setDocuments(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { documents: updated });
    }
  };

  const deleteDocument = async (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { documents: updated });
    }
  };

  const submitCitizenAppeal = async (data: Omit<CitizenAppeal, 'id' | 'trackingCode' | 'date' | 'status'>): Promise<string> => {
    const randomCode = `ORG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAppeal: CitizenAppeal = {
      ...data,
      id: `app-${Date.now()}`,
      trackingCode: randomCode,
      date: new Date().toISOString().split('T')[0],
      status: 'yangi'
    };
    const updated = [newAppeal, ...appeals];
    setAppeals(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { appeals: updated });
    }
    return randomCode;
  };

  const updateAppeal = async (item: CitizenAppeal) => {
    const updated = appeals.map(a => a.id === item.id ? item : a);
    setAppeals(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { appeals: updated });
    }
  };

  const deleteAppeal = async (id: string) => {
    const updated = appeals.filter(a => a.id !== id);
    setAppeals(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { appeals: updated });
    }
  };

  const updateSettings = async (newSettings: Partial<PortalSettings>) => {
    const updated: PortalSettings = normalizeSettings({ ...settings, ...newSettings });
    setSettings(updated);
    if (googleSyncStatus.spreadsheetId) {
      await triggerGoogleSheetsSync(undefined, { settings: updated });
    }
  };

  // Accessibility Handlers
  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeState(size);
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    if (size === 'large') {
      root.style.fontSize = '18px';
    } else if (size === 'xlarge') {
      root.style.fontSize = '20px';
    } else {
      root.style.fontSize = '16px';
    }
  };

  const setContrastMode = (mode: 'normal' | 'high' | 'grayscale') => {
    setContrastModeState(mode);
    const root = document.documentElement;
    root.classList.remove('high-contrast', 'grayscale-mode');
    if (mode === 'high') {
      root.classList.add('high-contrast');
    } else if (mode === 'grayscale') {
      root.classList.add('grayscale-mode');
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <PortalContext.Provider
      value={{
        news,
        publicNews,
        organizations,
        leaders,
        documents,
        appeals,
        settings,
        user,
        googleSyncStatus,
        loginWithGoogle,
        loginWithGoogleRedirect,
        loginAdminWithGoogle,
        pendingAdminAuthResult,
        clearPendingAdminAuthResult,
        connectSpreadsheetById,
        refreshDataFromSheets,
        logoutGoogle,
        syncNow,
        addNews,
        updateNews,
        deleteNews,
        addOrganization,
        updateOrganization,
        deleteOrganization,
        addLeader,
        updateLeader,
        deleteLeader,
        addDocument,
        updateDocument,
        deleteDocument,
        submitCitizenAppeal,
        updateAppeal,
        deleteAppeal,
        updateSettings,
        fontSize,
        setFontSize,
        contrastMode,
        setContrastMode,
        speakText,
        stopSpeaking,
        isSpeaking,
        useNewAlphabet,
        setUseNewAlphabet,
        t
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};
