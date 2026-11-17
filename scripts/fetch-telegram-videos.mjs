// Telegram kanaldagi OXIRGI 3 ta videoni saytga yuklab oladi (public/tg-videos/<id>.mp4).
// Telegram'ning ommaviy sahifasi katta videolarni bermaydi, shuning uchun bot (MTProto) orqali olinadi.
// Qolgan (eski) videolar uchun saytda "Videoni Telegramda ko'rish" tugmasi qoladi.
//
// Kerakli GitHub Secrets: TG_API_ID, TG_API_HASH, TG_BOT_TOKEN (bot kanalga admin qilingan bo'lishi kerak).
// Secrets bo'lmasa yoki xatolik bo'lsa — deploy to'xtamaydi, shunchaki o'tkazib yuboriladi.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, renameSync } from 'node:fs';

const CHANNEL = process.env.TELEGRAM_CHANNEL || 'qoshkopirtalim';
const KEEP = Number(process.env.TELEGRAM_VIDEO_KEEP || 3);
const MAX_MB = Number(process.env.TELEGRAM_VIDEO_MAX_MB || 300);
const NEWS = 'public/telegram-news.json';
const DIR = 'public/tg-videos';

const msgIdOf = (url, fallback) => {
  const m = String(url || '').match(/t\.me\/[^/]+\/(\d+)/);
  return m ? m[1] : String(fallback);
};

const main = async () => {
  if (!existsSync(NEWS)) return console.log('telegram-news.json yo\'q — videolar o\'tkazib yuborildi');
  const news = JSON.parse(readFileSync(NEWS, 'utf8'));
  mkdirSync(DIR, { recursive: true });

  // Eng yangi postlardan boshlab, birinchi KEEP ta videoni tanlaymiz
  const targets = [];
  for (const post of news) {
    for (const vid of post.videos || []) {
      if (targets.length >= KEEP) break;
      targets.push({ post, vid, id: msgIdOf(vid.url, post.telegramMessageId) });
    }
    if (targets.length >= KEEP) break;
  }

  const wanted = new Set(targets.map((t) => `${t.id}.mp4`));
  // Endi kerak bo'lmagan eski videolarni o'chirish
  for (const f of readdirSync(DIR)) if (!wanted.has(f)) unlinkSync(`${DIR}/${f}`);

  const missing = targets.filter((t) => !existsSync(`${DIR}/${t.id}.mp4`));
  if (missing.length > 0) {
    const { TG_API_ID, TG_API_HASH, TG_BOT_TOKEN } = process.env;
    if (!TG_API_ID || !TG_API_HASH || !TG_BOT_TOKEN) {
      console.log('TG_API_ID / TG_API_HASH / TG_BOT_TOKEN sozlanmagan — videolar yuklanmadi');
    } else {
      const { TelegramClient } = await import('telegram');
      const { StringSession } = await import('telegram/sessions/index.js');
      const client = new TelegramClient(new StringSession(''), Number(TG_API_ID), TG_API_HASH, { connectionRetries: 3 });
      client.setLogLevel('error');
      await client.start({ botAuthToken: TG_BOT_TOKEN });
      try {
        const msgs = await client.getMessages(CHANNEL, { ids: missing.map((t) => Number(t.id)) });
        for (const t of missing) {
          const msg = msgs.find((m) => m && String(m.id) === t.id);
          const doc = msg && (msg.video || msg.document);
          if (!doc) {
            console.log(`#${t.id}: video topilmadi`);
            continue;
          }
          const sizeMb = Number(doc.size || 0) / 1024 / 1024;
          if (sizeMb > MAX_MB) {
            console.log(`#${t.id}: ${sizeMb.toFixed(0)} MB — juda katta, o'tkazib yuborildi`);
            continue;
          }
          const tmp = `${DIR}/${t.id}.part`;
          await client.downloadMedia(msg, { outputFile: tmp });
          if (existsSync(tmp) && statSync(tmp).size > 0) {
            renameSync(tmp, `${DIR}/${t.id}.mp4`);
            console.log(`#${t.id}: yuklandi (${sizeMb.toFixed(1)} MB)`);
          } else if (existsSync(tmp)) unlinkSync(tmp);
        }
      } finally {
        await client.disconnect();
      }
    }
  }

  // Saytda yuklangan videolar o'z serverimizdan o'ynaydi
  let n = 0;
  for (const t of targets) {
    if (existsSync(`${DIR}/${t.id}.mp4`)) {
      t.vid.src = `/tg-videos/${t.id}.mp4`;
      n++;
    }
  }
  writeFileSync(NEWS, JSON.stringify(news, null, 1));
  console.log(`Saytda ${n} ta video (oxirgi ${KEEP} tadan) o'ynaydi`);
};

const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('vaqt tugadi (10 daqiqa)')), 10 * 60 * 1000).unref());
Promise.race([main(), timeout])
  .catch((err) => console.warn('Videolarni olishda xatolik (deploy davom etadi):', err.message))
  .finally(() => process.exit(0));
