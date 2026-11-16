export interface QuickServiceItem {
  id: string;
  title: string;
  desc: string;
  link: string;
  isExternal: boolean;
  color: string;
}

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  suffix: string;
  sub: string;
  icon: 'school' | 'baby' | 'graduation' | 'users' | 'book' | 'award' | 'building' | 'star';
  color: string;
}

export interface GovernmentLinkItem {
  id: string;
  title: string;
  url: string;
}

export interface NavLabels {
  home: string;
  about: string;
  orgs: string;
  docs: string;
  news: string;
  reception: string;
  contact: string;
}

export interface DepartmentBranch {
  id: string;
  name: string;
  head: string;
  phone: string;
  staffCount: number;
  description: string;
}

export interface NewsVideo {
  src?: string; // To'g'ridan-to'g'ri o'ynatiladigan havola (bo'lmasa — faqat Telegramda)
  thumb?: string;
  duration?: string;
  url?: string; // Telegramdagi post havolasi
}

export interface NewsItem {
  id: string;
  title: string;
  category: 'Boshlang\'ich ta\'lim' | 'Olimpiada' | 'Pedagogika' | 'MTT' | 'E\'lon' | 'Tadbirlar' | 'Boshqaruv' | string;
  date: string;
  summary: string;
  content: string;
  imageUrl: string;
  images?: string[]; // Multiple images for gallery
  driveFolderId?: string; // Sub-folder created in Google Drive for this news item
  driveFolderUrl?: string; // Link to the Google Drive folder
  driveFileId?: string;
  author: string;
  views: number;
  isPinned?: boolean;
  sentToTelegram?: boolean;
  sentToFacebook?: boolean;
  sentToInstagram?: boolean;
  telegramMessageId?: string;
  instagramMediaId?: string;
  sourceUrl?: string; // Asl manba (masalan, Telegram post havolasi)
  source?: 'site' | 'telegram';
  videos?: NewsVideo[]; // Telegram kanal videolari
}

export interface Organization {
  id: string;
  type: 'maktab' | 'mtt' | 'ixtisos';
  number: number;
  name: string;
  address: string;
  mahalla: string;
  director: string;
  phone: string;
  email: string;
  studentsCount: number;
  teachersCount: number;
  shifts: number;
  establishedYear: number;
  rating: number;
  photoUrl?: string;
  inn?: string;
  capacity?: number;
  description?: string; // Column P in Google Sheets
}

export interface Leader {
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  receptionDays: string;
  receptionHours: string;
  bio: string;
  photoUrl: string;
  order: number;
  adminEmail?: string; // Column L in Google Sheets (optional Gmail admin access)
}

export interface DocumentItem {
  id: string;
  title: string;
  docNumber: string;
  date: string;
  category: string;
  fileUrl: string;
  driveFileId?: string;
  fileSize: string;
  fileType: string;
}

export interface CitizenAppeal {
  id: string;
  trackingCode: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  organizationType: string;
  subject: string;
  message: string;
  date: string;
  status: 'yangi' | 'jarayonda' | 'ijro_etildi' | 'rad_etildi';
  replyMessage?: string;
  replyDate?: string;
  officer?: string;
}

export interface PortalSettings {
  // Tashkilot identifikatsiyasi va Header/Footer matnlari
  districtName: string; // Tashkilot to'liq nomi
  shortName: string; // Qisqa nomi (masalan: "Qöşköpir Ta'lim Tashkiloti")
  supervisingOrg: string; // Yuqori ribbondagi tashkilot nomi
  regionLabel: string; // Hudud / maqom nomi
  portalSubtitle: string; // Logo ostidagi izoh
  departmentPhone: string;
  trustPhone: string;
  email: string;
  address: string;
  workingHours: string;
  workingHoursShort: string;
  telegramChannel: string;
  facebookPage: string;
  youtubeChannel: string;
  schoolsCount: number;
  mttsCount: number;
  studentsTotal: number;
  teachersTotal: number;
  specializedSchoolsCount: number;
  higherCategoryTeachersCount: number;
  marqueeText: string;
  navLabels: NavLabels;

  // Asosiy sahifa sozlamalari (Hero, Showcase, Quick Services & Stats)
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  heroImageUrl: string;
  heroPrimaryBtnText: string;
  heroSecondaryBtnText: string;
  heroShowcaseBadge: string;
  heroShowcaseTitle: string;
  heroShowcaseDesc: string;
  heroServicesTitle: string;
  heroServicesSubtitle: string;
  quickServices: QuickServiceItem[];

  // Statistika bo'limi
  statsKicker: string;
  statsTitle: string;
  statsItems: StatCardItem[];

  // Tashkilot haqida (#bolim-haqida - Admin orqali to'liq boshqariladi)
  aboutKicker: string;
  aboutTitle: string;
  aboutTabLeadersLabel: string;
  aboutTabStructureLabel: string;
  aboutTabTasksLabel: string;
  aboutTabHistoryLabel: string;
  aboutStructureNote: string;
  aboutHeadRoleLabel: string;
  aboutTasksTitle: string;
  aboutHistoryTitle: string;
  aboutCharterLabel: string;
  departmentHistory: string;
  departmentMission: string;
  departmentCharter: string;
  tasksList: string[];
  branches: DepartmentBranch[];

  // Muassasalar / Bo'linmalar bo'limi
  orgsKicker: string;
  orgsTitle: string;
  orgsSubtitle: string;
  orgsFilterAllLabel: string;
  orgsFilterSchoolLabel: string;
  orgsFilterKindergartenLabel: string;
  orgsFilterSpecializedLabel: string;

  // Hujjatlar bo'limi
  docsKicker: string;
  docsTitle: string;
  docsSubtitle: string;
  docCategories: string[];

  // Yangiliklar bo'limi
  newsKicker: string;
  newsTitle: string;
  newsSubtitle: string;
  newsCategories: string[];

  // Virtual qabulxona bo'limi
  receptionKicker: string;
  receptionTitle: string;
  receptionSubtitle: string;
  receptionTargets: string[];

  // Aloqa va xarita bo'limi
  contactKicker: string;
  contactTitle: string;
  contactSubtitle: string;
  contactAddressLabel: string;
  landmarkText: string;
  mapAreaTitle: string;
  mapAreaDesc: string;
  mapTransportLabel: string;
  mapTransportText: string;
  mapExternalUrl: string;

  // Footer
  footerDisclaimer: string;
  footerCopyright: string;
  governmentLinks: GovernmentLinkItem[];

  // Admin Gmail ruxsatlari (Boshqa Gmail hisoblarga ruxsat berish)
  allowedAdminEmails: string[];

  // Telegram, Facebook & Instagram ijtimoiy tarmoqlariga avtomatik yuborish sozlamalari
  telegramBotToken: string;
  telegramChannelUsername: string;
  telegramAutoPublish: boolean;
  facebookPageId: string;
  facebookPageToken: string;
  facebookAutoPublish: boolean;
  instagramPage: string;
  instagramAccountId: string;
  instagramAccessToken: string;
  instagramAutoPublish: boolean;
  googleSpreadsheetId?: string;
}

export interface GoogleSyncStatus {
  isConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  folderId: string | null;
  folderUrl: string | null;
  lastSyncedAt: string | null;
  syncing: boolean;
  error: string | null;
  unauthorizedDomain?: string | null;
}
