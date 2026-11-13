import { getAccessToken } from './googleAuth';
import { NewsItem, Organization, Leader, DocumentItem, CitizenAppeal, PortalSettings } from '../types';
import { INITIAL_NEWS, INITIAL_ORGANIZATIONS, INITIAL_LEADERS, INITIAL_DOCUMENTS, INITIAL_APPEALS, INITIAL_SETTINGS } from '../data/initialData';
import { PORTAL_CONFIG } from '../config/portalConfig';
import { normalizePhotoUrl } from '../utils/uzbekTypography';

const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const SPREADSHEET_TITLE = "Qo'shko'pir_MMTB_Rasmiy_Baza";
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
  const stored = localStorage.getItem(SPREADSHEET_STORAGE_KEY);
  if (stored && stored.trim()) return extractSpreadsheetId(stored);
  if (PORTAL_CONFIG.DEFAULT_SPREADSHEET_ID && PORTAL_CONFIG.DEFAULT_SPREADSHEET_ID.trim()) {
    return extractSpreadsheetId(PORTAL_CONFIG.DEFAULT_SPREADSHEET_ID);
  }
  return null;
};

export const setStoredSpreadsheetId = (id: string | null) => {
  if (id && id.trim()) {
    localStorage.setItem(SPREADSHEET_STORAGE_KEY, extractSpreadsheetId(id));
  } else {
    localStorage.removeItem(SPREADSHEET_STORAGE_KEY);
  }
};

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
 * Seeds initial demo data to Google Sheets
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
    ['ID', 'Turi', 'Raqam', 'Nomi', 'Manzil', 'Mahalla', 'Direktor', 'Telefon', 'Email', 'O\'quvchilar', 'O\'qituvchilar', 'Smena', 'TashkilQilinganYil', 'Reyting', 'RasmURL'],
    ...INITIAL_ORGANIZATIONS.map(o => [
      o.id, o.type, o.number.toString(), o.name, o.address, o.mahalla, o.director, o.phone, o.email,
      o.studentsCount.toString(), o.teachersCount.toString(), o.shifts.toString(), o.establishedYear.toString(), o.rating.toString(), o.photoUrl || ''
    ])
  ];

  const leaderRows = [
    ['ID', 'FIO', 'Lavozim', 'Bo\'lim', 'Telefon', 'Email', 'QabulKunlari', 'QabulVaqti', 'Biografiya', 'RasmURL', 'Tartib'],
    ...INITIAL_LEADERS.map(l => [
      l.id, l.name, l.position, l.department, l.phone, l.email, l.receptionDays, l.receptionHours, l.bio, l.photoUrl, l.order.toString()
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
    ['Kalit', 'Qiymat'],
    ['districtName', INITIAL_SETTINGS.districtName],
    ['departmentPhone', INITIAL_SETTINGS.departmentPhone],
    ['trustPhone', INITIAL_SETTINGS.trustPhone],
    ['email', INITIAL_SETTINGS.email],
    ['address', INITIAL_SETTINGS.address],
    ['workingHours', INITIAL_SETTINGS.workingHours],
    ['telegramChannel', INITIAL_SETTINGS.telegramChannel],
    ['facebookPage', INITIAL_SETTINGS.facebookPage],
    ['youtubeChannel', INITIAL_SETTINGS.youtubeChannel],
    ['schoolsCount', INITIAL_SETTINGS.schoolsCount.toString()],
    ['mttsCount', INITIAL_SETTINGS.mttsCount.toString()],
    ['studentsTotal', INITIAL_SETTINGS.studentsTotal.toString()],
    ['teachersTotal', INITIAL_SETTINGS.teachersTotal.toString()],
    ['specializedSchoolsCount', INITIAL_SETTINGS.specializedSchoolsCount.toString()],
    ['higherCategoryTeachersCount', INITIAL_SETTINGS.higherCategoryTeachersCount.toString()],
    ['marqueeText', INITIAL_SETTINGS.marqueeText],
    ['heroTitle', INITIAL_SETTINGS.heroTitle],
    ['heroSubtitle', INITIAL_SETTINGS.heroSubtitle],
    ['heroBadgeText', INITIAL_SETTINGS.heroBadgeText],
    ['heroImageUrl', INITIAL_SETTINGS.heroImageUrl],
    ['quickServices', JSON.stringify(INITIAL_SETTINGS.quickServices)],
    ['departmentHistory', INITIAL_SETTINGS.departmentHistory],
    ['departmentMission', INITIAL_SETTINGS.departmentMission],
    ['departmentCharter', INITIAL_SETTINGS.departmentCharter],
    ['tasksList', JSON.stringify(INITIAL_SETTINGS.tasksList)],
    ['branches', JSON.stringify(INITIAL_SETTINGS.branches)],
    ['telegramBotToken', INITIAL_SETTINGS.telegramBotToken],
    ['telegramChannelUsername', INITIAL_SETTINGS.telegramChannelUsername],
    ['telegramAutoPublish', INITIAL_SETTINGS.telegramAutoPublish ? 'ha' : 'yoq'],
    ['facebookPageId', INITIAL_SETTINGS.facebookPageId],
    ['facebookPageToken', INITIAL_SETTINGS.facebookPageToken],
    ['facebookAutoPublish', INITIAL_SETTINGS.facebookAutoPublish ? 'ha' : 'yoq'],
    ['instagramPage', INITIAL_SETTINGS.instagramPage],
    ['instagramAccountId', INITIAL_SETTINGS.instagramAccountId],
    ['instagramAccessToken', INITIAL_SETTINGS.instagramAccessToken],
    ['instagramAutoPublish', INITIAL_SETTINGS.instagramAutoPublish ? 'ha' : 'yoq']
  ];

  const valueRanges = [
    { range: 'Yangiliklar!A1:L', values: newsRows },
    { range: 'Tashkilotlar!A1:O', values: orgRows },
    { range: 'Rahbariyat!A1:K', values: leaderRows },
    { range: 'Hujjatlar!A1:I', values: docRows },
    { range: 'Murojaatlar!A1:N', values: appealRows },
    { range: 'Sozlamalar!A1:B', values: settingsRows }
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
    'Tashkilotlar!A2:O',
    'Rahbariyat!A2:K',
    'Hujjatlar!A2:I',
    'Murojaatlar!A2:N',
    'Sozlamalar!A2:B'
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
      date: r[3] || new Date().toISOString().split('T')[0],
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
      address: col4 || "Qo'shko'pir tumani",
      mahalla: col5 || "Qo'shko'pir",
      director: col6 || "Rahbar tayinlanmagan",
      phone: col7.includes('#') ? "+998 (62) 352-00-00" : (col7 || "+998 (62) 352-00-00"),
      email: String(r[8] || "").includes('#') ? "" : String(r[8] || ""),
      studentsCount: parseInt(r[9] || '0', 10) || 500,
      teachersCount: parseInt(r[10] || '0', 10) || 40,
      shifts: parseInt(r[11] || '1', 10) || 1,
      establishedYear: parseInt(r[12] || '1990', 10) || 1990,
      rating: parseFloat(r[13] || '4.8') || 4.8,
      photoUrl: normalizePhotoUrl(r[14]) || undefined
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
    department: r[3] || 'Bo\'lim',
    phone: String(r[4] || '').includes('#') ? "+998 (62) 352-14-25" : (r[4] || "+998 (62) 352-14-25"),
    email: String(r[5] || '').includes('#') ? "" : (r[5] || ""),
    receptionDays: r[6] || '',
    receptionHours: r[7] || '',
    bio: r[8] || '',
    photoUrl: normalizePhotoUrl(r[9]) || './assets/images/department_head_portrait_1794303519848.jpg',
    order: parseInt(r[10] || `${idx + 1}`, 10) || idx + 1
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
  settingsRows.forEach((r: any[]) => {
    if (r[0] && r[1] !== undefined) {
      if (['schoolsCount', 'mttsCount', 'studentsTotal', 'teachersTotal', 'specializedSchoolsCount', 'higherCategoryTeachersCount'].includes(r[0])) {
        settingsObj[r[0]] = parseInt(r[1], 10) || 0;
      } else if (r[0] === 'quickServices' || r[0] === 'tasksList' || r[0] === 'branches') {
        try {
          settingsObj[r[0]] = JSON.parse(r[1]);
        } catch {
          // Keep default
        }
      } else if (r[0] === 'telegramAutoPublish' || r[0] === 'facebookAutoPublish' || r[0] === 'instagramAutoPublish') {
        settingsObj[r[0]] = r[1] === 'ha' || r[1] === 'true';
      } else {
        settingsObj[r[0]] = r[1];
      }
    }
  });

  return {
    news: news.length > 0 ? news : INITIAL_NEWS,
    organizations: organizations.length > 0 ? organizations : INITIAL_ORGANIZATIONS,
    leaders: leaders.length > 0 ? leaders : INITIAL_LEADERS,
    documents: documents.length > 0 ? documents : INITIAL_DOCUMENTS,
    appeals: appeals.length > 0 ? appeals : INITIAL_APPEALS,
    settings: settingsObj as PortalSettings
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
    'Tashkilotlar!A2:O',
    'Rahbariyat!A2:K',
    'Hujjatlar!A2:I',
    'Murojaatlar!A2:N',
    'Sozlamalar!A2:B'
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
    o.studentsCount.toString(), o.teachersCount.toString(), o.shifts.toString(), o.establishedYear.toString(), o.rating.toString(), o.photoUrl || ''
  ]);

  const leaderRows = data.leaders.map(l => [
    l.id, l.name, l.position, l.department, l.phone, l.email, l.receptionDays, l.receptionHours, l.bio, l.photoUrl, l.order.toString()
  ]);

  const docRows = data.documents.map(d => [
    d.id, d.title, d.docNumber, d.date, d.category, d.fileUrl, d.driveFileId || '', d.fileSize, d.fileType
  ]);

  const appealRows = data.appeals.map(a => [
    a.id, a.trackingCode, a.fullName, a.phone, a.email || '', a.address, a.organizationType, a.subject, a.message, a.date, a.status,
    a.replyMessage || '', a.replyDate || '', a.officer || ''
  ]);

  const s = data.settings;
  const settingsRows = [
    ['districtName', s.districtName],
    ['departmentPhone', s.departmentPhone],
    ['trustPhone', s.trustPhone],
    ['email', s.email],
    ['address', s.address],
    ['workingHours', s.workingHours],
    ['telegramChannel', s.telegramChannel],
    ['facebookPage', s.facebookPage],
    ['youtubeChannel', s.youtubeChannel],
    ['schoolsCount', s.schoolsCount.toString()],
    ['mttsCount', s.mttsCount.toString()],
    ['studentsTotal', s.studentsTotal.toString()],
    ['teachersTotal', s.teachersTotal.toString()],
    ['specializedSchoolsCount', s.specializedSchoolsCount.toString()],
    ['higherCategoryTeachersCount', s.higherCategoryTeachersCount.toString()],
    ['marqueeText', s.marqueeText],
    ['heroTitle', s.heroTitle || ''],
    ['heroSubtitle', s.heroSubtitle || ''],
    ['heroBadgeText', s.heroBadgeText || ''],
    ['heroImageUrl', s.heroImageUrl || ''],
    ['quickServices', JSON.stringify(s.quickServices || [])],
    ['departmentHistory', s.departmentHistory || ''],
    ['departmentMission', s.departmentMission || ''],
    ['departmentCharter', s.departmentCharter || ''],
    ['tasksList', JSON.stringify(s.tasksList || [])],
    ['branches', JSON.stringify(s.branches || [])],
    ['telegramBotToken', s.telegramBotToken || ''],
    ['telegramChannelUsername', s.telegramChannelUsername || ''],
    ['telegramAutoPublish', s.telegramAutoPublish ? 'ha' : 'yoq'],
    ['facebookPageId', s.facebookPageId || ''],
    ['facebookPageToken', s.facebookPageToken || ''],
    ['facebookAutoPublish', s.facebookAutoPublish ? 'ha' : 'yoq'],
    ['instagramPage', s.instagramPage || ''],
    ['instagramAccountId', s.instagramAccountId || ''],
    ['instagramAccessToken', s.instagramAccessToken || ''],
    ['instagramAutoPublish', s.instagramAutoPublish ? 'ha' : 'yoq']
  ];

  const updateData = [
    { range: 'Yangiliklar!A2:L', values: newsRows },
    { range: 'Tashkilotlar!A2:O', values: orgRows },
    { range: 'Rahbariyat!A2:K', values: leaderRows },
    { range: 'Hujjatlar!A2:I', values: docRows },
    { range: 'Murojaatlar!A2:N', values: appealRows },
    { range: 'Sozlamalar!A2:B', values: settingsRows }
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
