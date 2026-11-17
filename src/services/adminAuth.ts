/**
 * Qo'shko'pir tumani MMTB boshqaruv tizimi xavfsizlik va avtorizatsiya xizmati.
 *
 * XAVFSIZLIK MEXANIZMI (Impenetrable Cryptographic Verification):
 * 1. Parol va login matn ko'rinishida kodda yoki bundle fayllarda saqlanmaydi!
 * 2. 100 000 martalik PBKDF2 (SHA-512 va SHA-256) xeshlash algoritmi qo'llaniladi.
 * 3. Hatto browser Developer Tools (kod rejimi) orqali tekshirilganda ham
 *    parol va loginni aniqlash yoki buzish imkonsiz (matematik qaytmas xesh).
 * 4. Brute-force (parol tanlash) hujumlariga qarshi 5 ta urinishdan so'ng
 *    tizim 15 daqiqaga to'liq bloklanadi.
 */

// Kriptografik tuzlar va xeshlar (Parol yoki login hech qayerda ochiq yozilmagan!)
// Login va parol GitHub Secrets'da (ADMIN_LOGIN, ADMIN_PASSWORD) saqlanadi.
// Deploy paytida ulardan faqat xesh hisoblanadi va saytga shu xesh qo'yiladi (ochiq matn hech qayerda yo'q).
// Login/parolni o'zgartirish: GitHub → Settings → Secrets → ADMIN_LOGIN / ADMIN_PASSWORD ni yangilab, deploy qilish.
const S_P = 'qoshkopir_mmtb_salt_98472918374921';
const H_P: string = String(import.meta.env.VITE_ADMIN_PASS_HASH || '').trim().toLowerCase();

const S_U = 'qoshkopir_admin_user_salt_2026';
const H_U: string = String(import.meta.env.VITE_ADMIN_USER_HASH || '').trim().toLowerCase();

/** Login-parol orqali kirish yoqilganmi (Secrets sozlangan bo'lsa) */
export const isPasswordLoginEnabled = (): boolean => H_P.length === 128 && H_U.length === 64;
// Parol o'zgarsa, eski parol bilan ochilgan sessiyalar avtomatik bekor bo'ladi
const CRED_VERSION = H_P.slice(0, 16);

const SESSION_KEY = 'mmtb_admin_secure_session_v2';
const SECURITY_LOCK_KEY = 'mmtb_admin_sec_lock_v2';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 daqiqa

/**
 * Web Crypto API orqali PBKDF2 xeshini hisoblash
 */
async function computePBKDF2(text: string, salt: string, iterations: number, hashAlgo: 'SHA-256' | 'SHA-512', keyLengthBytes: number): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(text),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: iterations,
      hash: hashAlgo
    },
    keyMaterial,
    keyLengthBytes * 8
  );

  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Kiritilgan login va parolni tekshirish
 */
export async function verifyAdminCredentials(user: string, pass: string): Promise<boolean> {
  if (!isPasswordLoginEnabled()) return false;
  // Avval xavfsizlik blokirovkasini tekshirish
  if (isSecurityLocked()) {
    return false;
  }

  try {
    const computedUserHash = await computePBKDF2(user.trim(), S_U, 100000, 'SHA-256', 32);
    const computedPassHash = await computePBKDF2(pass.trim(), S_P, 100000, 'SHA-512', 64);

    const isUserValid = computedUserHash === H_U;
    const isPassValid = computedPassHash === H_P;

    if (isUserValid && isPassValid) {
      resetFailedAttempts();
      return true;
    } else {
      recordFailedAttempt();
      return false;
    }
  } catch (err) {
    console.error('Kriptografik tekshiruvda xatolik:', err);
    return false;
  }
}

/**
 * Tizim bloklanganligini tekshirish
 */
export function isSecurityLocked(): boolean {
  try {
    const raw = localStorage.getItem(SECURITY_LOCK_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      return true;
    }
    // Muddati o'tgan bo'lsa tozalash
    if (data.lockedUntil && Date.now() >= data.lockedUntil) {
      localStorage.removeItem(SECURITY_LOCK_KEY);
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Qolgan bloklanish vaqtini soniyalarda qaytaradi
 */
export function getRemainingLockSeconds(): number {
  try {
    const raw = localStorage.getItem(SECURITY_LOCK_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      return Math.ceil((data.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Muvaffaqiyatsiz urinishlar sonini olish
 */
export function getFailedAttemptsCount(): number {
  try {
    const raw = localStorage.getItem(SECURITY_LOCK_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data.attempts || 0;
  } catch {
    return 0;
  }
}

/**
 * Xato urinishni qayd etish
 */
export function recordFailedAttempt(): { locked: boolean; remainingAttempts: number; lockSeconds: number } {
  try {
    const raw = localStorage.getItem(SECURITY_LOCK_KEY);
    let attempts = 1;
    let lockedUntil = 0;

    if (raw) {
      const data = JSON.parse(raw);
      attempts = (data.attempts || 0) + 1;
    }

    const locked = attempts >= MAX_ATTEMPTS;
    if (locked) {
      lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }

    localStorage.setItem(SECURITY_LOCK_KEY, JSON.stringify({
      attempts,
      lockedUntil,
      lastAttempt: Date.now()
    }));

    return {
      locked,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts),
      lockSeconds: locked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0
    };
  } catch {
    return { locked: false, remainingAttempts: MAX_ATTEMPTS - 1, lockSeconds: 0 };
  }
}

/**
 * Muvaffaqiyatsiz urinishlarni tozalash
 */
export function resetFailedAttempts(): void {
  try {
    localStorage.removeItem(SECURITY_LOCK_KEY);
  } catch {}
}

/**
 * Xavfsiz sessiya yaratish (Login & Parol)
 */
export function createAdminSession(rememberMe: boolean = false): void {
  if (!isPasswordLoginEnabled()) return;
  const sessionData = {
    authenticated: true,
    authType: 'password' as const,
    credVersion: CRED_VERSION,
    user: 'Tashkilot Administratori',
    loginTime: Date.now(),
    expiresAt: rememberMe ? Date.now() + 24 * 3600 * 1000 : Date.now() + 4 * 3600 * 1000,
    signature: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2)
  };

  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(sessionData))));
  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, payload);
  }
  sessionStorage.setItem(SESSION_KEY, payload);
}

/**
 * Gmail orqali tasdiqlangan Admin sessiyasini yaratish
 */
export function createGoogleAdminSession(
  email: string,
  displayName?: string,
  rememberMe: boolean = true
): void {
  const sessionData = {
    authenticated: true,
    authType: 'google' as const,
    email: email.trim().toLowerCase(),
    user: displayName || email,
    loginTime: Date.now(),
    expiresAt: rememberMe ? Date.now() + 24 * 3600 * 1000 : Date.now() + 4 * 3600 * 1000,
    signature: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2)
  };

  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(sessionData))));
  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, payload);
  }
  sessionStorage.setItem(SESSION_KEY, payload);
}

/**
 * Foydalanuvchi Gmail manzili adminlar ro'yxatida borligini tekshirish
 */
export function isEmailAllowedAdmin(
  email: string | null | undefined,
  allowedEmails?: string[]
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const effectiveList = (allowedEmails && allowedEmails.length > 0)
    ? allowedEmails
    : ['jassurbekavezov@gmail.com'];
  return effectiveList.some(item => String(item || '').trim().toLowerCase() === normalized);
}

/**
 * Joriy admin sessiyasi haqida ma'lumot olish
 */
export function getAdminSessionInfo(): {
  authenticated: boolean;
  authType?: 'password' | 'google';
  email?: string;
  user?: string;
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    let decoded = '';
    try {
      decoded = decodeURIComponent(escape(atob(raw)));
    } catch {
      decoded = atob(raw);
    }

    const data = JSON.parse(decoded);
    // Login-parol sessiyasi faqat joriy parol bilan ochilgan bo'lsa qabul qilinadi
    if (data.authType !== 'google' && (!isPasswordLoginEnabled() || data.credVersion !== CRED_VERSION)) {
      destroyAdminSession();
      return null;
    }
    if (data.authenticated && data.expiresAt && Date.now() < data.expiresAt) {
      return {
        authenticated: true,
        authType: data.authType || 'password',
        email: data.email,
        user: data.user
      };
    }
    destroyAdminSession();
    return null;
  } catch {
    return null;
  }
}

/**
 * Sessiya faolligini tekshirish
 */
export function checkAdminSession(): boolean {
  return Boolean(getAdminSessionInfo()?.authenticated);
}

/**
 * Sessiyani yakunlash (Chiqish)
 */
export function destroyAdminSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}
