// GitHub Secrets'dagi ADMIN_LOGIN va ADMIN_PASSWORD dan xesh hisoblaydi va
// VITE_ADMIN_USER_HASH / VITE_ADMIN_PASS_HASH qatorlarini chiqaradi ($GITHUB_ENV ga yoziladi).
// Saytga faqat xesh tushadi — login va parolning o'zi hech qayerda saqlanmaydi.
import { pbkdf2Sync } from 'node:crypto';

const login = (process.env.ADMIN_LOGIN || '').trim();
const pass = process.env.ADMIN_PASSWORD || '';

if (!login || !pass) {
  console.error('ADMIN_LOGIN / ADMIN_PASSWORD sozlanmagan — login-parol orqali kirish o\'chiq (faqat Gmail).');
} else {
  if (pass.length < 10) console.error('Diqqat: parol juda qisqa, kamida 10–12 belgi tavsiya etiladi.');
  const u = pbkdf2Sync(login, 'qoshkopir_admin_user_salt_2026', 100000, 32, 'sha256').toString('hex');
  const p = pbkdf2Sync(pass, 'qoshkopir_mmtb_salt_98472918374921', 100000, 64, 'sha512').toString('hex');
  console.log(`VITE_ADMIN_USER_HASH=${u}`);
  console.log(`VITE_ADMIN_PASS_HASH=${p}`);
  console.error('Login-parol orqali kirish yoqildi.');
}
