import { getAccessToken } from './googleAuth';
import { NewsItem, Organization, Leader, DocumentItem, CitizenAppeal, PortalSettings } from '../types';
import { INITIAL_NEWS, INITIAL_ORGANIZATIONS, INITIAL_LEADERS, INITIAL_DOCUMENTS, INITIAL_APPEALS, INITIAL_SETTINGS } from '../data/initialData';
import { PORTAL_CONFIG } from '../config/portalConfig';
import { normalizePhotoUrl } from '../utils/uzbekTypography';
import { normalizeSettings } from '../utils/normalizeSettings';

const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/** Google gviz "Date(2026,10,14)" formatini "2026-11-14" ga aylantiradi */
const normalizeSheetDate = (value: unknown): string => {
  const s = String(value ?? '').trim();
  const m = s.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/);
  if (m) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${m[1]}-${pad(Number(m[2]) + 1)}-${pad(Number(m[3]))}`;
  }
  return s;
};
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const SPREADSHEET_TITLE = "Talim_Tashkiloti_Rasmiy_Baza";
const SPREADSHEET_STORAGE_KEY = 'qoshkopir_mmtb_spreadsheet_id';

export interface PortalAllData {
  news: NewsItem[];
  organizations: Organization[];
  leaders: Leader[];
  documents: DocumentItem[];
  appeals: CitizenAppeal[];
  settings: PortalSettings;
}

/**
 * Extracts raw alphanumeric spreadsheet ID from either a full Google Sheets URL
 * (e.g. https://docs.google.com/spreadsheets/d/1BxiMVs.../edit) or bare ID
 */
export const extractSpreadsheetId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

/**
 * Gets cached spreadsheet ID from storage or configuration
 */
export const getStoredSpreadsheetId = (): string | null => {
  // XAVFSIZLIK: baza ID si faqat kod (PORTAL_CONFIG) orqali belgilanadi.
  // Brauzer xotirasi yoki havola orqali boshqa jadvalga almashtirib bo'lmaydi.
  try { localStorage.removeItem(SPREADSHEET_STORAGE_KEY); } catch {}
  if (PORTAL_CONFIG.DEFAULT_SPREADSHEET_ID && PORTAL_CONFIG.DEFAULT_SPREADSHEET_ID.trim()) {
    return extractSpreadsheetId(PORTAL_CONFIG.DEFAULT_SPREADSHEET_ID);
  }
  return null;
};

export const setStoredSpreadsheetId = (_id: string | null) => {
  // XAVFSIZLIK: baza ID sini o'zgartirish faqat PORTAL_CONFIG orqali (GitHub commit).
  try { localStorage.removeItem(SPREADSHEET_STORAGE_KEY); } catch {}
};

/** Maxfiy kalitlar: ommaviy jadvalga yozilmaydi va undan o'qilmaydi (faqat admin brauzerida saqlanadi). */
export const SECRET_SETTING_KEYS = ['telegramBotToken', 'facebookPageToken', 'instagramAccessToken'];

/**
 * Finds or creates the official Google Spreadsheet in user's Drive
 */
export const getOrCreateSpreadsheet = async (): Promise<{ id: string; url: string; isNew: boolean }> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Google hisobiga ulanmagan");

  // 1. Check if stored ID still exists and is accessible
  const existingId = getStoredSpreadsheetId();
  if (existingId) {
    try {
      const checkRes = await fetch(`${SHEETS_API_URL}/${existingId}?fields=spreadsheetId,spreadsheetUrl,properties.title`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        return {
          id: data.spreadsheetId,
          url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
          isNew: false
        };
      }
    } catch {
      // Ignore and continue search
    }
  }

  // 2. Search Drive for existing spreadsheet
  const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const file = searchData.files[0];
      setStoredSpreadsheetId(file.id);
      return {
        id: file.id,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
        isNew: false
      };
    }
  }

  // 3. Create a brand new spreadsheet with structured sheets
  const createPayload = {
    properties: {
      title: SPREADSHEET_TITLE
    },
    sheets: [
      { properties: { title: 'Yangiliklar' } },
      { properties: { title: 'Tashkilotlar' } },
      { properties: { title: 'Rahbariyat' } },
      { properties: { title: 'Hujjatlar' } },
      { properties: { title: 'Murojaatlar' } },
      { properties: { title: 'Sozlamalar' } }
    ]
  };

  const createRes = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Sheets yaratishda xatolik: ${errText}`);
  }

  const newSheet = await createRes.json();
  const spreadsheetId = newSheet.spreadsheetId;
  const spreadsheetUrl = newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  setStoredSpreadsheetId(spreadsheetId);

  // Seed default data into newly created spreadsheet
  await seedInitialDataToSpreadsheet(spreadsheetId, token);

  return {
    id: spreadsheetId,
    url: spreadsheetUrl,
    isNew: true
  };
};

/**
 * Builds 3-column Sozlamalar rows: [Kalit, Qiymat, Bolim_Va_Tavsif]
 */
const buildSettingsRows = (rawSettings: PortalSettings): string[][] => {
  const s = normalizeSettings(rawSettings);
  return [
  // Tashkilot & Header
  ['districtName', s.districtName || '', "Umumiy · Tashkilot to'liq nomi"],
  ['shortName', s.shortName || '', "Umumiy · Tashkilot qisqa nomi"],
  ['supervisingOrg', s.supervisingOrg || '', "Header · Yuqori tasma matni"],
  ['regionLabel', s.regionLabel || '', "Header/Footer · Hudud nomi"],
  ['portalSubtitle', s.portalSubtitle || '', "Header · Portal qisqa ta'rifi"],
  ['workingHoursShort', s.workingHoursShort || '', "Header · Qisqa ish vaqti"],
  ['navLabels', JSON.stringify(s.navLabels || INITIAL_SETTINGS.navLabels), "Header/Footer · Menyu nomlari (JSON)"],

  // Aloqa va Asosiy raqamlar
  ['departmentPhone', s.departmentPhone || '', "Aloqa · Qabulxona telefoni"],
  ['trustPhone', s.trustPhone || '', "Aloqa · Ishonch telefoni"],
  ['email', s.email || '', "Aloqa · Elektron pochta"],
  ['address', s.address || '', "Aloqa · Tashkilot manzili"],
  ['workingHours', s.workingHours || '', "Aloqa · To'liq ish tartibi"],
  ['telegramChannel', s.telegramChannel || '', "Aloqa · Telegram kanal URL"],
  ['facebookPage', s.facebookPage || '', "Aloqa · Facebook sahifa URL"],
  ['youtubeChannel', s.youtubeChannel || '', "Aloqa · YouTube kanal URL"],
  ['schoolsCount', String(s.schoolsCount ?? 0), "Statistika · Maktablar soni"],
  ['mttsCount', String(s.mttsCount ?? 0), "Statistika · MTTlar soni"],
  ['studentsTotal', String(s.studentsTotal ?? 0), "Statistika · O'quvchilar soni"],
  ['teachersTotal', String(s.teachersTotal ?? 0), "Statistika · Pedagoglar soni"],
  ['specializedSchoolsCount', String(s.specializedSchoolsCount ?? 0), "Statistika · Ixtisoslashgan maktablar"],
  ['higherCategoryTeachersCount', String(s.higherCategoryTeachersCount ?? 0), "Statistika · Oliy toifali ustozlar"],
  ['marqueeText', s.marqueeText || '', "Muhim e'lon · Yuguruvchi satr (Marquee)"],

  // Hero Banner & Xizmatlar
  ['heroTitle', s.heroTitle || '', "Asosiy banner · Katta sarlavha"],
  ['heroSubtitle', s.heroSubtitle || '', "Asosiy banner · Izoh matni"],
  ['heroBadgeText', s.heroBadgeText || '', "Asosiy banner · Hudud yorlig'i"],
  ['heroImageUrl', s.heroImageUrl || '', "Asosiy banner · Rasm havolasi"],
  ['heroPrimaryBtnText', s.heroPrimaryBtnText || '', "Asosiy banner · Asosiy tugma"],
  ['heroSecondaryBtnText', s.heroSecondaryBtnText || '', "Asosiy banner · Ikkinchi tugma"],
  ['heroShowcaseBadge', s.heroShowcaseBadge || '', "Asosiy banner · Rasm usti nishon"],
  ['heroShowcaseTitle', s.heroShowcaseTitle || '', "Asosiy banner · Rasm usti sarlavha"],
  ['heroShowcaseDesc', s.heroShowcaseDesc || '', "Asosiy banner · Rasm usti ta'rif"],
  ['heroServicesTitle', s.heroServicesTitle || '', "Xizmatlar · Sarlavha"],
  ['heroServicesSubtitle', s.heroServicesSubtitle || '', "Xizmatlar · Kichik izoh"],
  ['quickServices', JSON.stringify(s.quickServices || []), "Xizmatlar · Tezkor tugmalar (JSON)"],

  // Statistika kartalari
  ['statsKicker', s.statsKicker || '', "Statistika · Kichik sarlavha"],
  ['statsTitle', s.statsTitle || '', "Statistika · Bo'lim sarlavhasi"],
  ['statsItems', JSON.stringify(s.statsItems || []), "Statistika · Ko'rsatkich kartalari (JSON)"],

  // Tashkilot haqida (#bolim-haqida - Admin tahrirlaydigan qism)
  ['aboutKicker', s.aboutKicker || '', "Tashkilot haqida · Yuqori yorliq"],
  ['aboutTitle', s.aboutTitle || '', "Tashkilot haqida · Asosiy sarlavha"],
  ['aboutTabLeadersLabel', s.aboutTabLeadersLabel || '', "Tashkilot haqida · 1-tab nomi"],
  ['aboutTabStructureLabel', s.aboutTabStructureLabel || '', "Tashkilot haqida · 2-tab nomi"],
  ['aboutTabTasksLabel', s.aboutTabTasksLabel || '', "Tashkilot haqida · 3-tab nomi"],
  ['aboutTabHistoryLabel', s.aboutTabHistoryLabel || '', "Tashkilot haqida · 4-tab nomi"],
  ['aboutStructureNote', s.aboutStructureNote || '', "Tashkilot haqida · Tuzilma eslatmasi"],
  ['aboutHeadRoleLabel', s.aboutHeadRoleLabel || '', "Tashkilot haqida · Bo'linma rahbari yorlig'i"],
  ['aboutTasksTitle', s.aboutTasksTitle || '', "Tashkilot haqida · Vazifalar sarlavhasi"],
  ['aboutHistoryTitle', s.aboutHistoryTitle || '', "Tashkilot haqida · Tarix sarlavhasi"],
  ['aboutCharterLabel', s.aboutCharterLabel || '', "Tashkilot haqida · Nizom yorlig'i"],
  ['departmentHistory', s.departmentHistory || '', "Tashkilot haqida · Tarix matni"],
  ['departmentMission', s.departmentMission || '', "Tashkilot haqida · Maqsad va missiya"],
  ['departmentCharter', s.departmentCharter || '', "Tashkilot haqida · Nizom va asos"],
  ['tasksList', JSON.stringify(s.tasksList || []), "Tashkilot haqida · Vazifalar ro'yxati (JSON)"],
  ['branches', JSON.stringify(s.branches || []), "Tashkilot haqida · Bo'lim/Sho'balar (JSON)"],

  // Muassasalar, Hujjatlar, Yangiliklar, Virtual qabulxona, Aloqa, Footer
  ['orgsKicker', s.orgsKicker || '', "Muassasalar · Yuqori yorliq"],
  ['orgsTitle', s.orgsTitle || '', "Muassasalar · Sarlavha"],
  ['orgsSubtitle', s.orgsSubtitle || '', "Muassasalar · Izoh matni"],
  ['orgsFilterAllLabel', s.orgsFilterAllLabel || '', "Muassasalar · Filtr (Barchasi)"],
  ['orgsFilterSchoolLabel', s.orgsFilterSchoolLabel || '', "Muassasalar · Filtr (Maktablar)"],
  ['orgsFilterKindergartenLabel', s.orgsFilterKindergartenLabel || '', "Muassasalar · Filtr (Bog'chalar)"],
  ['orgsFilterSpecializedLabel', s.orgsFilterSpecializedLabel || '', "Muassasalar · Filtr (Ixtisoslashgan)"],

  ['docsKicker', s.docsKicker || '', "Hujjatlar · Yuqori yorliq"],
  ['docsTitle', s.docsTitle || '', "Hujjatlar · Sarlavha"],
  ['docsSubtitle', s.docsSubtitle || '', "Hujjatlar · Izoh matni"],
  ['docCategories', JSON.stringify(s.docCategories || []), "Hujjatlar · Toifalar ro'yxati (JSON)"],

  ['newsKicker', s.newsKicker || '', "Yangiliklar · Yuqori yorliq"],
  ['newsTitle', s.newsTitle || '', "Yangiliklar · Sarlavha"],
  ['newsSubtitle', s.newsSubtitle || '', "Yangiliklar · Izoh matni"],
  ['newsCategories', JSON.stringify(s.newsCategories || []), "Yangiliklar · Toifalar ro'yxati (JSON)"],

  ['receptionKicker', s.receptionKicker || '', "Virtual qabulxona · Yuqori yorliq"],
  ['receptionTitle', s.receptionTitle || '', "Virtual qabulxona · Sarlavha"],
  ['receptionSubtitle', s.receptionSubtitle || '', "Virtual qabulxona · Izoh matni"],
  ['receptionTargets', JSON.stringify(s.receptionTargets || []), "Virtual qabulxona · Murojaat manzillari (JSON)"],

  ['contactKicker', s.contactKicker || '', "Aloqa · Yuqori yorliq"],
  ['contactTitle', s.contactTitle || '', "Aloqa · Sarlavha"],
  ['contactSubtitle', s.contactSubtitle || '', "Aloqa · Izoh matni"],
  ['contactAddressLabel', s.contactAddressLabel || '', "Aloqa · Manzil sarlavhasi"],
  ['landmarkText', s.landmarkText || '', "Aloqa · Mo'ljal"],
  ['mapAreaTitle', s.mapAreaTitle || '', "Aloqa · Xarita hudud sarlavhasi"],
  ['mapAreaDesc', s.mapAreaDesc || '', "Aloqa · Xarita hudud ta'rifi"],
  ['mapTransportLabel', s.mapTransportLabel || '', "Aloqa · Transport yorlig'i"],
  ['mapTransportText', s.mapTransportText || '', "Aloqa · Transport yo'nalishi"],
  ['mapExternalUrl', s.mapExternalUrl || '', "Aloqa · Xarita havolasi"],

  ['footerDisclaimer', s.footerDisclaimer || '', "Footer · Huquqiy ogohlantirish"],
  ['footerCopyright', s.footerCopyright || '', "Footer · Mualliflik matni"],
  ['governmentLinks', JSON.stringify(s.governmentLinks || []), "Footer · Rasmiy havolalar (JSON)"],

  // Gmail Admin Ruxsatlari
  ['allowedAdminEmails', JSON.stringify(s.allowedAdminEmails || ['jassurbekavezov@gmail.com']), "Xavfsizlik · Ruxsat etilgan Admin Gmail manzillari (JSON yoki vergul)"],

  // Ijtimoiy tarmoqlar
  ['telegramBotToken', '', "Ijtimoiy tarmoqlar · Telegram Bot Token"],
  ['telegramChannelUsername', s.telegramChannelUsername || '', "Ijtimoiy tarmoqlar · Telegram Kanal"],
  ['telegramAutoPublish', s.telegramAutoPublish ? 'ha' : 'yoq', "Ijtimoiy tarmoqlar · TG avto-yuborish"],
  ['facebookPageId', s.facebookPageId || '', "Ijtimoiy tarmoqlar · Facebook Page ID"],
  ['facebookPageToken', '', "Ijtimoiy tarmoqlar · Facebook Token"],
  ['facebookAutoPublish', s.facebookAutoPublish ? 'ha' : 'yoq', "Ijtimoiy tarmoqlar · FB avto-yuborish"],
  ['instagramPage', s.instagramPage || '', "Ijtimoiy tarmoqlar · Instagram URL"],
  ['instagramAccountId', s.instagramAccountId || '', "Ijtimoiy tarmoqlar · Instagram Account ID"],
  ['instagramAccessToken', '', "Ijtimoiy tarmoqlar · Instagram Token"],
  ['instagramAutoPublish', s.instagramAutoPublish ? 'ha' : 'yoq', "Ijtimoiy tarmoqlar · IG avto-yuborish"]
  ];
};

/**
 * Seeds initial data to Google Sheets
 */
export const seedInitialDataToSpreadsheet = async (spreadsheetId: string, token: string) => {
  const newsRows = [
    ['ID', 'Sarlavha', 'Kategoriya', 'Sana', 'Qisqacha', 'Matn', 'RasmURL', 'Muallif', 'Ko\'rishlar', 'Muhim', 'RasmlarGalereyasi', 'DriveFolderUrl'],
    ...INITIAL_NEWS.map(n => [
      n.id, n.title, n.category, n.date, n.summary, n.content, n.imageUrl, n.author, n.views.toString(), n.isPinned ? 'ha' : 'yoq',
      (n.images && n.images.length > 0) ? n.images.join(' , ') : (n.imageUrl || ''),
      n.driveFolderUrl || ''
    ])
  ];

  const orgRows = [
    ['ID', 'Turi', 'Raqam', 'Nomi', 'Manzil', 'Mahalla', 'Direktor', 'Telefon', 'Email', 'O\'quvchilar', 'O\'qituvchilar', 'Smena', 'TashkilQilinganYil', 'Reyting', 'RasmURL', 'Tavsif'],
    ...INITIAL_ORGANIZATIONS.map(o => [
      o.id, o.type, o.number.toString(), o.name, o.address, o.mahalla, o.director, o.phone, o.email,
      o.studentsCount.toString(), o.teachersCount.toString(), o.shifts.toString(), o.establishedYear.toString(), o.rating.toString(), o.photoUrl || '', o.description || ''
    ])
  ];

  const leaderRows = [
    ['ID', 'FIO', 'Lavozim', 'Bo\'lim', 'Telefon', 'Email', 'QabulKunlari', 'QabulVaqti', 'Biografiya', 'RasmURL', 'Tartib', 'AdminGmail'],
    ...INITIAL_LEADERS.map(l => [
      l.id, l.name, l.position, l.department, l.phone, l.email, l.receptionDays, l.receptionHours, l.bio, l.photoUrl, l.order.toString(), l.adminEmail || ''
    ])
  ];

  const docRows = [
    ['ID', 'Sarlavha', 'HujjatRaqami', 'Sana', 'Kategoriya', 'FaylURL', 'DriveFileId', 'Hajm', 'FaylTuri'],
    ...INITIAL_DOCUMENTS.map(d => [
      d.id, d.title, d.docNumber, d.date, d.category, d.fileUrl, d.driveFileId || '', d.fileSize, d.fileType
    ])
  ];

  const appealRows = [
    ['ID', 'KuzatuvKodi', 'FIO', 'Telefon', 'Email', 'Manzil', 'Tashkilot', 'Mavzu', 'MurojaatMatni', 'Sana', 'Holat', 'JavobMatni', 'JavobSanasi', 'Mas\'ul'],
    ...INITIAL_APPEALS.map(a => [
      a.id, a.trackingCode, a.fullName, a.phone, a.email || '', a.address, a.organizationType, a.subject, a.message, a.date, a.status,
      a.replyMessage || '', a.replyDate || '', a.officer || ''
    ])
  ];

  const settingsRows = [
    ['Kalit', 'Qiymat', 'Bolim_Va_Tavsif'],
    ...buildSettingsRows(INITIAL_SETTINGS)
  ];

  const valueRanges = [
    { range: 'Yangiliklar!A1:L', values: newsRows },
    { range: 'Tashkilotlar!A1:P', values: orgRows },
    { range: 'Rahbariyat!A1:L', values: leaderRows },
    { range: 'Hujjatlar!A1:I', values: docRows },
    { range: 'Murojaatlar!A1:N', values: appealRows },
    { range: 'Sozlamalar!A1:C', values: settingsRows }
  ];

  await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges
    })
  });
};

/**
 * Reads Google Sheets rows via the Google Visualization (GViz) API.
 * This works on ANY public Google Sheet ("Anyone with the link can view"),
 * completely free, without requiring OAuth tokens, backend servers, or API keys!
 */
export const fetchSheetRowsViaGviz = async (
  spreadsheetId: string,
  sheetName: string
): Promise<string[][]> => {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (!cleanId) return [];

    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&headers=0`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const text = await res.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return [];

    const json = JSON.parse(text.substring(start, end + 1));
    if (!json.table || !json.table.rows) return [];

    return json.table.rows.map((row: any) => {
      if (!row || !row.c) return [];
      return row.c.map((cell: any) => {
        if (!cell) return '';
        if (cell.v !== undefined && cell.v !== null) return String(cell.v);
        if (cell.f !== undefined && cell.f !== null) return String(cell.f);
        return '';
      });
    });
  } catch (e) {
    console.warn(`GViz fetch warning for sheet "${sheetName}":`, e);
    return [];
  }
};

/**
 * Reads all portal records from Google Sheets.
 * Works seamlessly in 3 modes:
 * 1. Admin OAuth Bearer token (full private access)
 * 2. Google Sheets API with API Key (public access)
 * 3. Google Visualization GViz endpoint (universal fallback, zero-auth, zero-cors)
 */
export const fetchAllPortalDataFromSheets = async (spreadsheetId: string): Promise<PortalAllData> => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) throw new Error("Google Sheets ID topilmadi");

  const token = await getAccessToken();
  let valueRanges: Array<{ values?: any[][] }> = [];

  const ranges = [
    'Yangiliklar!A2:L',
    'Tashkilotlar!A2:P',
    'Rahbariyat!A2:L',
    'Hujjatlar!A2:I',
    'Murojaatlar!A2:N',
    'Sozlamalar!A2:C'
  ];

  // Mode 1: Authenticated Bearer request
  if (token) {
    try {
      const queryUrl = `${SHEETS_API_URL}/${cleanId}/values:batchGet?${ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&')}`;
      const res = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        valueRanges = data.valueRanges || [];
      }
    } catch (e) {
      console.warn("Bearer fetch failed, falling back to public methods:", e);
    }
  }

  // Mode 2: Google Sheets API with public API Key
  if (!valueRanges || valueRanges.length === 0 || !valueRanges[1]?.values?.length) {
    try {
      const apiKey = PORTAL_CONFIG.GOOGLE_API_KEY;
      if (apiKey) {
        const queryUrl = `${SHEETS_API_URL}/${cleanId}/values:batchGet?${ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&')}&key=${apiKey}`;
        const res = await fetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          valueRanges = data.valueRanges || [];
        }
      }
    } catch (e) {
      console.warn("API Key fetch failed, trying GViz fallback:", e);
    }
  }

  // Mode 3: Universal GViz table query fallback
  if (!valueRanges || valueRanges.length === 0 || !valueRanges[1]?.values?.length) {
    try {
      const [newsRows, orgRows, leaderRows, docRows, appealRows, settingsRows] = await Promise.all([
        fetchSheetRowsViaGviz(cleanId, 'Yangiliklar'),
        fetchSheetRowsViaGviz(cleanId, 'Tashkilotlar').then(async r => {
          if (r.length === 0) return await fetchSheetRowsViaGviz(cleanId, 'Tashkilot');
          if (r.length === 0) return await fetchSheetRowsViaGviz(cleanId, 'Maktablar');
          return r;
        }),
        fetchSheetRowsViaGviz(cleanId, 'Rahbariyat'),
        fetchSheetRowsViaGviz(cleanId, 'Hujjatlar'),
        fetchSheetRowsViaGviz(cleanId, 'Murojaatlar'),
        fetchSheetRowsViaGviz(cleanId, 'Sozlamalar')
      ]);

      valueRanges = [
        { values: newsRows },
        { values: orgRows },
        { values: leaderRows },
        { values: docRows },
        { values: appealRows },
        { values: settingsRows }
      ];
    } catch (e) {
      console.warn("GViz query fallback encountered an issue:", e);
    }
  }

  // Parse News (skip header if present)
  const rawNewsRows = valueRanges[0]?.values || [];
  const newsRows = rawNewsRows.filter((r: any[]) => {
    if (!r || r.length === 0) return false;
    const txt = r.join(' ').toLowerCase();
    if (txt.includes('sarlavha') && txt.includes('kategoriya')) return false;
    return r.some(c => c && String(c).trim().length > 0);
  });

  const news: NewsItem[] = newsRows.map((r: any[], idx: number) => {
    const rawImg = r[6] || '';
    const rawGallery = r[10] || '';
    let images: string[] = [];
    if (rawGallery) {
      images = rawGallery.split(/[\n,;]+/).map((s: string) => s.trim()).filter(Boolean);
    } else if (rawImg && rawImg.includes(',')) {
      images = rawImg.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (images.length === 0 && rawImg) {
      images = [rawImg];
    }
    const normalizedImages = images.map(img => normalizePhotoUrl(img)).filter(Boolean);
    const primaryImg = normalizedImages[0] || normalizePhotoUrl(rawImg) || './assets/images/hero_education_district_1794303548345.jpg';

    return {
      id: r[0] || `news-${idx + 1}`,
      title: r[1] || 'Yangilik sarlavhasi',
      category: (r[2] as any) || 'Boshqaruv',
      date: normalizeSheetDate(r[3]) || new Date().toISOString().split('T')[0],
      summary: r[4] || '',
      content: r[5] || '',
      imageUrl: primaryImg,
      images: normalizedImages.length > 0 ? normalizedImages : [primaryImg],
      author: r[7] || 'Matbuot xizmati',
      views: parseInt(r[8] || '0', 10) || 0,
      isPinned: r[9] === 'ha' || r[9] === 'true',
      driveFolderUrl: r[11] || undefined
    };
  });

  // Parse Organizations (robust & resilient against custom headers/columns)
  const rawOrgRows = valueRanges[1]?.values || [];
  const orgRows = rawOrgRows.filter((r: any[]) => {
    if (!r || r.length === 0) return false;
    const txt = r.join(' ').toLowerCase();
    if (txt.includes('turi') && (txt.includes('nomi') || txt.includes('raqam'))) return false;
    if (txt.includes('o\'quvchilar') && txt.includes('direktor')) return false;
    return r.some(c => c && String(c).trim().length > 0);
  });

  const organizations: Organization[] = orgRows.map((r: any[], idx: number) => {
    const col0 = String(r[0] || '').trim();
    const col1 = String(r[1] || '').trim();
    const col2 = String(r[2] || '').trim();
    const col3 = String(r[3] || '').trim();
    const col4 = String(r[4] || '').trim();
    const col5 = String(r[5] || '').trim();
    const col6 = String(r[6] || '').trim();
    const col7 = String(r[7] || '').trim();

    // Determine type: maktab, mtt, or ixtisos
    let type: Organization['type'] = 'maktab';
    if (col1 === 'maktab' || col1 === 'mtt' || col1 === 'ixtisos') {
      type = col1 as Organization['type'];
    } else {
      const fullText = (col0 + ' ' + col1 + ' ' + col2 + ' ' + col3).toLowerCase();
      if (fullText.includes('mtt') || fullText.includes('bog\'cha') || fullText.includes('bogcha') || fullText.includes('maktabgacha')) {
        type = 'mtt';
      } else if (fullText.includes('ixtisos') || fullText.includes('internat')) {
        type = 'ixtisos';
      }
    }

    // Determine number
    let number = idx + 1;
    const numInCol2 = parseInt(col2, 10);
    const numInCol1 = parseInt(col1, 10);
    const numInCol0 = parseInt(col0, 10);
    if (!isNaN(numInCol2) && numInCol2 > 0) {
      number = numInCol2;
    } else if (!isNaN(numInCol1) && numInCol1 > 0) {
      number = numInCol1;
    } else if (!isNaN(numInCol0) && numInCol0 > 0) {
      number = numInCol0;
    }

    // Determine name
    let name = col3 || col2 || col1 || `${number}-sonli ${type === 'mtt' ? 'MTT' : 'maktab'}`;
    if (/^\d+$/.test(name)) {
      name = `${name}-sonli ${type === 'mtt' ? 'maktabgacha ta\'lim tashkiloti' : 'umumiy o\'rta ta\'lim maktabi'}`;
    }

    return {
      id: col0.startsWith('org-') || col0.startsWith('sch-') || col0.startsWith('mtt-') ? col0 : `org-${type}-${number}-${idx + 1}`,
      type,
      number,
      name,
      address: col4 || "Qo'shko'pir",
      mahalla: col5 || "Markaz",
      director: col6 || "Rahbar tayinlanmagan",
      phone: col7.includes('#') ? "+998 (62) 352-00-00" : (col7 || "+998 (62) 352-00-00"),
      email: String(r[8] || "").includes('#') ? "" : String(r[8] || ""),
      studentsCount: parseInt(r[9] || '0', 10) || 500,
      teachersCount: parseInt(r[10] || '0', 10) || 40,
      shifts: parseInt(r[11] || '1', 10) || 1,
      establishedYear: parseInt(r[12] || '1990', 10) || 1990,
      rating: parseFloat(r[13] || '4.8') || 4.8,
      photoUrl: normalizePhotoUrl(r[14]) || undefined,
      description: String(r[15] || '').trim() || undefined
    };
  });

  // Parse Leaders
  const rawLeaderRows = valueRanges[2]?.values || [];
  const leaderRows = rawLeaderRows.filter((r: any[]) => {
    if (!r || r.length === 0) return false;
    const txt = r.join(' ').toLowerCase();
    if (txt.includes('fio') && txt.includes('lavozim')) return false;
    return r.some(c => c && String(c).trim().length > 0);
  });

  const leaders: Leader[] = leaderRows.map((r: any[], idx: number) => ({
    id: r[0] || `lead-${idx + 1}`,
    name: r[1] || 'Rahbar FIO',
    position: r[2] || 'Lavozim',
    department: r[3] || 'Ta\'lim tashkiloti',
    phone: String(r[4] || '').includes('#') ? "+998 (62) 352-14-25" : (r[4] || "+998 (62) 352-14-25"),
    email: String(r[5] || '').includes('#') ? "" : (r[5] || ""),
    receptionDays: r[6] || '',
    receptionHours: r[7] || '',
    bio: r[8] || '',
    photoUrl: normalizePhotoUrl(r[9]) || './assets/images/department_head_portrait_1794303519848.jpg',
    order: parseInt(r[10] || `${idx + 1}`, 10) || idx + 1,
    adminEmail: String(r[11] || '').trim() || undefined
  }));

  // Parse Documents
  const rawDocRows = valueRanges[3]?.values || [];
  const docRows = rawDocRows.filter((r: any[]) => {
    if (!r || r.length === 0) return false;
    const txt = r.join(' ').toLowerCase();
    if (txt.includes('sarlavha') && txt.includes('hujjat')) return false;
    return r.some(c => c && String(c).trim().length > 0);
  });

  const documents: DocumentItem[] = docRows.map((r: any[], idx: number) => ({
    id: r[0] || `doc-${idx + 1}`,
    title: r[1] || 'Hujjat nomi',
    docNumber: r[2] || '',
    date: r[3] || '',
    category: (r[4] as any) || 'Bo\'lim buyruqlari',
    fileUrl: r[5] || 'https://drive.google.com',
    driveFileId: r[6] || undefined,
    fileSize: r[7] || '1.0 MB',
    fileType: r[8] || 'PDF'
  }));

  // Parse Appeals
  const rawAppealRows = valueRanges[4]?.values || [];
  const appealRows = rawAppealRows.filter((r: any[]) => {
    if (!r || r.length === 0) return false;
    const txt = r.join(' ').toLowerCase();
    if (txt.includes('kuzatuv') && txt.includes('fio')) return false;
    return r.some(c => c && String(c).trim().length > 0);
  });

  const appeals: CitizenAppeal[] = appealRows.map((r: any[], idx: number) => ({
    id: r[0] || `app-${idx + 1}`,
    trackingCode: r[1] || `QSP-2026-${1000 + idx}`,
    fullName: r[2] || 'Fuqaro',
    phone: r[3] || '',
    email: r[4] || undefined,
    address: r[5] || '',
    organizationType: r[6] || '',
    subject: r[7] || '',
    message: r[8] || '',
    date: r[9] || '',
    status: (r[10] as any) || 'yangi',
    replyMessage: r[11] || undefined,
    replyDate: r[12] || undefined,
    officer: r[13] || undefined
  }));

  // Parse Settings
  const settingsRows = valueRanges[5]?.values || [];
  const settingsObj: Record<string, any> = { ...INITIAL_SETTINGS };
  // Maxfiy kalitlar jadvaldan olinmaydi — admin brauzeridagi qiymat saqlanib qoladi
  SECRET_SETTING_KEYS.forEach(k => { delete settingsObj[k]; });
  const numericKeys = [
    'schoolsCount',
    'mttsCount',
    'studentsTotal',
    'teachersTotal',
    'specializedSchoolsCount',
    'higherCategoryTeachersCount'
  ];
  const jsonKeys = [
    'quickServices',
    'tasksList',
    'branches',
    'statsItems',
    'governmentLinks',
    'navLabels',
    'docCategories',
    'newsCategories',
    'receptionTargets',
    'allowedAdminEmails'
  ];
  const boolKeys = ['telegramAutoPublish', 'facebookAutoPublish', 'instagramAutoPublish'];

  settingsRows.forEach((r: any[]) => {
    const key = String(r[0] || '').trim();
    const rawVal = r[1];
    if (!key || rawVal === undefined) return;
    if (SECRET_SETTING_KEYS.includes(key)) return;
    if (key.toLowerCase() === 'kalit' && String(rawVal).toLowerCase() === 'qiymat') return;

    const strVal = String(rawVal);
    if (numericKeys.includes(key)) {
      settingsObj[key] = parseInt(strVal, 10) || 0;
    } else if (jsonKeys.includes(key)) {
      try {
        const parsed = JSON.parse(strVal);
        settingsObj[key] = parsed;
      } catch {
        // Fallback for comma/newline-separated lists entered directly in Sheets cells
        if (['allowedAdminEmails', 'tasksList', 'docCategories', 'newsCategories', 'receptionTargets'].includes(key)) {
          const items = strVal.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
          if (items.length > 0) settingsObj[key] = items;
        }
      }
    } else if (boolKeys.includes(key)) {
      settingsObj[key] = strVal === 'ha' || strVal === 'true';
    } else {
      settingsObj[key] = strVal;
    }
  });

  // Ensure leader adminEmail entries (Column L) are included in allowedAdminEmails
  const leaderAdminEmails = leaders
    .map(l => (l.adminEmail || '').trim().toLowerCase())
    .filter(email => email.includes('@'));
  if (leaderAdminEmails.length > 0) {
    const existingAllowed = Array.isArray(settingsObj.allowedAdminEmails)
      ? settingsObj.allowedAdminEmails.map((e: string) => String(e).trim().toLowerCase()).filter(Boolean)
      : [...INITIAL_SETTINGS.allowedAdminEmails];
    settingsObj.allowedAdminEmails = Array.from(new Set([...existingAllowed, ...leaderAdminEmails]));
  }

  return {
    news: news.length > 0 ? news : INITIAL_NEWS,
    organizations: organizations.length > 0 ? organizations : INITIAL_ORGANIZATIONS,
    leaders: leaders.length > 0 ? leaders : INITIAL_LEADERS,
    documents: documents.length > 0 ? documents : INITIAL_DOCUMENTS,
    appeals: appeals.length > 0 ? appeals : INITIAL_APPEALS,
    settings: normalizeSettings(settingsObj)
  };
};

/**
 * Saves all current state to Google Sheets
 */
export const syncAllDataToGoogleSheets = async (
  spreadsheetId: string,
  data: PortalAllData
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Google hisobiga ulanmagan");

  // First clear old contents
  const clearPromises = [
    'Yangiliklar!A2:L',
    'Tashkilotlar!A2:P',
    'Rahbariyat!A2:L',
    'Hujjatlar!A2:I',
    'Murojaatlar!A2:N',
    'Sozlamalar!A2:C'
  ].map(range =>
    fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
  );
  await Promise.all(clearPromises);

  // Prepare updated values
  const newsRows = data.news.map(n => [
    n.id,
    n.title,
    n.category,
    n.date,
    n.summary,
    n.content,
    n.imageUrl,
    n.author,
    n.views.toString(),
    n.isPinned ? 'ha' : 'yoq',
    (n.images && n.images.length > 0) ? n.images.join(' , ') : (n.imageUrl || ''),
    n.driveFolderUrl || ''
  ]);

  const orgRows = data.organizations.map(o => [
    o.id, o.type, o.number.toString(), o.name, o.address, o.mahalla, o.director, o.phone, o.email,
    o.studentsCount.toString(), o.teachersCount.toString(), o.shifts.toString(), o.establishedYear.toString(), o.rating.toString(), o.photoUrl || '', o.description || ''
  ]);

  const leaderRows = data.leaders.map(l => [
    l.id, l.name, l.position, l.department, l.phone, l.email, l.receptionDays, l.receptionHours, l.bio, l.photoUrl, l.order.toString(), l.adminEmail || ''
  ]);

  const docRows = data.documents.map(d => [
    d.id, d.title, d.docNumber, d.date, d.category, d.fileUrl, d.driveFileId || '', d.fileSize, d.fileType
  ]);

  const appealRows = data.appeals.map(a => [
    a.id, a.trackingCode, a.fullName, a.phone, a.email || '', a.address, a.organizationType, a.subject, a.message, a.date, a.status,
    a.replyMessage || '', a.replyDate || '', a.officer || ''
  ]);

  const settingsRows = buildSettingsRows(data.settings);

  // Also ensure headers on expanded columns exist seamlessly
  const updateData = [
    { range: 'Tashkilotlar!P1', values: [['Tavsif']] },
    { range: 'Rahbariyat!L1', values: [['AdminGmail']] },
    { range: 'Sozlamalar!A1:C1', values: [['Kalit', 'Qiymat', 'Bolim_Va_Tavsif']] },
    { range: 'Yangiliklar!A2:L', values: newsRows },
    { range: 'Tashkilotlar!A2:P', values: orgRows },
    { range: 'Rahbariyat!A2:L', values: leaderRows },
    { range: 'Hujjatlar!A2:I', values: docRows },
    { range: 'Murojaatlar!A2:N', values: appealRows },
    { range: 'Sozlamalar!A2:C', values: settingsRows }
  ];

  const res = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateData
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Sheets yangilashda xatolik: ${err}`);
  }
};
