import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  X,
  RefreshCw,
  KeyRound,
  ShieldAlert,
  Mail,
  ExternalLink
} from 'lucide-react';
import {
  verifyAdminCredentials,
  isSecurityLocked,
  getRemainingLockSeconds,
  getFailedAttemptsCount,
  createAdminSession
} from '../../services/adminAuth';
import { usePortal } from '../../context/PortalContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  initialError?: string | null;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  initialError,
  onClose,
  onLoginSuccess
}) => {
  const { settings, loginAdminWithGoogle, t } = usePortal();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Anti-bot Math Challenge
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (initialError) {
      setErrorMessage(initialError);
    }
  }, [initialError]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 210);
  };

  // Generate new math captcha
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 15) + 3;
    const n2 = Math.floor(Math.random() * 9) + 2;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaAnswer('');
  };

  // Check lock status on open and timer
  useEffect(() => {
    if (!isOpen) return;

    generateCaptcha();
    const remaining = getRemainingLockSeconds();
    setLockSeconds(remaining);

    const attempts = getFailedAttemptsCount();
    if (attempts > 0 && attempts < 5) {
      setRemainingAttempts(5 - attempts);
    }
  }, [isOpen]);

  // Live countdown timer for security lockout
  useEffect(() => {
    if (lockSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockSeconds]);

  if (!isOpen) return null;

  const handleGmailLogin = async (mode: 'popup' | 'redirect') => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginAdminWithGoogle(mode);
      if (mode === 'redirect') return;
      if (res.authorized) {
        onLoginSuccess();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t("Gmail orqali kirishda xatolik yuz berdi."));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Check if locked
    if (lockSeconds > 0) {
      return;
    }

    // 2. Validate empty fields
    if (!username.trim() || !password) {
      setErrorMessage(t("Iltimos, login va parolni kiriting."));
      return;
    }

    // 3. Validate math captcha
    if (parseInt(captchaAnswer) !== (captchaNum1 + captchaNum2)) {
      setErrorMessage(t("Xavfsizlik hisobi (anti-robot) noto‘g‘ri kiritildi."));
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      // 4. Cryptographic salted PBKDF2 hash verification
      const isValid = await verifyAdminCredentials(username, password);

      if (isValid) {
        createAdminSession(rememberMe);
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        generateCaptcha();

        const locked = isSecurityLocked();
        if (locked) {
          const secs = getRemainingLockSeconds();
          setLockSeconds(secs);
          setErrorMessage(t("Ko‘p marotaba xato urinishlar tufayli tizim xavfsizlik maqsadida 15 daqiqaga bloklandi!"));
        } else {
          const attempts = getFailedAttemptsCount();
          const left = Math.max(0, 5 - attempts);
          setRemainingAttempts(left);
          setErrorMessage(t(`Login yoki parol noto‘g‘ri! Qolgan urinishlar soni: ${left} ta`));
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage(t("Avtorizatsiyada xatolik yuz berdi."));
    }
  };

  const formatLockTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${
        isClosing ? 'w3-animate-opacity-out' : 'w3-animate-opacity'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md my-auto ${
          isClosing ? 'w3-animate-zoom-out' : 'w3-animate-zoom'
        }`}
      >
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-700 text-white shadow-xl mb-3 border border-sky-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2 flex-wrap">
            <span className="bg-sky-600 text-white px-2 py-0.5 rounded text-sm font-black">
              Admin
            </span>
            <span>{t(settings.shortName || settings.districtName)}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            {t("Ta'lim tashkiloti boshqaruv tizimi")}
          </p>
        </div>

        {/* Card Component */}
        <div className="bg-white rounded-xl shadow-2xl border-t-4 border-t-sky-700 border-x border-b border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                {t("Xavfsiz Avtorizatsiya")}
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {t("Faqat ruxsat berilgan Gmail hisobi orqali kiring")}
              </p>
            </div>

            {/* Lockout Warning Banner */}
            {lockSeconds > 0 && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs space-y-2 animate-pulse">
                <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{t("Xavfsizlik Tizimi Bloklandi")}</span>
                </div>
                <p className="leading-relaxed">
                  {t("5 marta ketma-ket xato parol kiritilganligi sababli kirish vaqtincha cheklandi.")}
                </p>
                <div className="flex items-center gap-1.5 font-mono font-bold text-red-800 text-sm bg-red-100 px-2.5 py-1.5 rounded border border-red-200">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>{t("Qolgan vaqt")}: {formatLockTime(lockSeconds)}</span>
                </div>
              </div>
            )}

            {/* Error Message Callout */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold leading-relaxed">{t(errorMessage)}</div>
                  {remainingAttempts !== null && remainingAttempts > 0 && lockSeconds <= 0 && (
                    <div className="text-[11px] text-red-600">
                      {t("Urinishlar tugagach login-parol 15 daqiqaga bloklanadi.")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gmail Login Section */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isGoogleLoading || isLoading}
                onClick={() => handleGmailLogin('popup')}
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
              >
                {isGoogleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-700" />
                    <span>{t("Gmail tekshirilmoqda...")}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-rose-600" />
                    <span>{t("Gmail bilan kirish (Google)")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isGoogleLoading || isLoading}
                onClick={() => handleGmailLogin('redirect')}
                className="w-full py-1.5 px-3 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-[11px] border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{t("Oyna bloklansa: Gmail orqali yo‘naltirib kirish")}</span>
              </button>
            </div>

            {/* XAVFSIZLIK: login-parol orqali kirish o'chirildi — faqat ruxsat berilgan Gmail */}
            {false && (<>
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink mx-3 text-[11px] font-semibold uppercase text-slate-400">
                {t("yoki login va parol")}
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("Ma’muriy Login")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={lockSeconds > 0 || isLoading || isGoogleLoading}
                    placeholder={t("Loginni kiriting")}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-hidden disabled:bg-slate-100 disabled:cursor-not-allowed font-medium transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t("Maxfiy Parol")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={lockSeconds > 0 || isLoading || isGoogleLoading}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-hidden disabled:bg-slate-100 disabled:cursor-not-allowed font-mono transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={lockSeconds > 0}
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 absolute right-3 top-2.5 transition-colors"
                    title={showPassword ? t("Parolni yashirish") : t("Parolni ko‘rsatish")}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Anti-Bot Math CAPTCHA */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-sky-700" />
                    <span>{t("Robotlarga qarshi tekshiruv:")}</span>
                  </span>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-sky-700 hover:text-sky-900 flex items-center gap-1 text-[11px]"
                    title={t("Boshqa misol olish")}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t("Yangilash")}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-white px-3 py-1.5 rounded border border-slate-300 text-slate-800 shadow-2xs select-none">
                    {captchaNum1} + {captchaNum2} = ?
                  </span>
                  <input
                    type="number"
                    required
                    disabled={lockSeconds > 0 || isLoading || isGoogleLoading}
                    placeholder={t("Javobi")}
                    value={captchaAnswer}
                    onChange={e => setCaptchaAnswer(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded border border-slate-300 text-sm font-mono text-center focus:border-sky-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Remember me & Security badge */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded text-sky-700 focus:ring-sky-600"
                  />
                  <span>{t("Meni eslab qolish (24 soat)")}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={lockSeconds > 0 || isLoading || isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("Xavfsiz tekshirilmoqda...")}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t("Login bilan kirish")}</span>
                  </>
                )}
              </button>
            </form>
            </>)}
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("Gmail & PBKDF2 Himoyasi")}</span>
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              {t("Yopish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
