/**
 * Qo'shko'pir tumani maktabgacha va maktab ta'limi bo'limi portali konfiguratsiyasi.
 * Ushbu sozlamalar orqali sayt GitHub Pages'da ham, har qanday qurilmada ham
 * Google Sheets'dagi barcha o'zgarishlarni real vaqt rejimida avtomatik yuklab oladi.
 */

export const PORTAL_CONFIG = {
  // Asosiy Google Sheets ID si (barcha brauzerlar va fuqarolar uchun yagona rasmiy baza)
  DEFAULT_SPREADSHEET_ID: "1E9amjZWss7ALT5n1I0raSJA9Tlh_yt_ZmpHZIa7V264",

  // Rasmiy Google Drive rasmlar va fayllar asosiy papkasi
  DEFAULT_DRIVE_FOLDER_ID: "",
  DEFAULT_DRIVE_FOLDER_URL: "",

  // Google Sheets API ommaviy kaliti
  GOOGLE_API_KEY: "",

  // GitHub Pages va portal domeni
  PORTAL_DOMAIN: "qoshkopirtalim.uz",

  // Avtomatik fon yangilanishi (millisekundda: har 30 soniyada bir marta)
  AUTO_REFRESH_INTERVAL_MS: 30000
};
