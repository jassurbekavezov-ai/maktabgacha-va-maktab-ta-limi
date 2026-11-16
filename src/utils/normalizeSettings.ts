import { PortalSettings } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';

const ARRAY_KEYS = [
  'quickServices',
  'tasksList',
  'branches',
  'statsItems',
  'governmentLinks',
  'docCategories',
  'newsCategories',
  'receptionTargets',
  'allowedAdminEmails'
] as const;

const LIST_FALLBACK_KEYS = ['tasksList', 'docCategories', 'newsCategories', 'receptionTargets', 'allowedAdminEmails'];

/** Unwraps values that were JSON-encoded one or more times (e.g. "\"[...]\""). */
const unwrapJson = (value: unknown): unknown => {
  let v = value;
  for (let i = 0; i < 5 && typeof v === 'string'; i++) {
    const t = v.trim();
    if (!t) return v;
    try {
      v = JSON.parse(t);
    } catch {
      return v;
    }
  }
  return v;
};

/**
 * Guarantees list/object settings have the right shape so the UI never crashes
 * on `.map` / spreads, whatever comes from localStorage or Google Sheets.
 */
export const normalizeSettings = (raw: any): PortalSettings => {
  const s: any = { ...INITIAL_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };

  for (const key of ARRAY_KEYS) {
    let v = unwrapJson(s[key]);
    if (!Array.isArray(v) && typeof v === 'string' && LIST_FALLBACK_KEYS.includes(key)) {
      v = v.split(/[\n,;]+/).map(x => x.trim()).filter(Boolean);
    }
    s[key] = Array.isArray(v) ? v : (INITIAL_SETTINGS as any)[key] ?? [];
  }

  const nav = unwrapJson(s.navLabels);
  s.navLabels = {
    ...INITIAL_SETTINGS.navLabels,
    ...(nav && typeof nav === 'object' && !Array.isArray(nav) ? nav : {})
  };

  if (!Array.isArray(s.allowedAdminEmails) || s.allowedAdminEmails.length === 0) {
    s.allowedAdminEmails = INITIAL_SETTINGS.allowedAdminEmails;
  }

  return s as PortalSettings;
};
