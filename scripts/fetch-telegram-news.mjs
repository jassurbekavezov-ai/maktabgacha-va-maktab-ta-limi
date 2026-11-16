// Telegram kanalidagi ochiq postlarni (t.me/s/<kanal>) o'qib, public/telegram-news.json yaratadi.
// Deploy oldidan GitHub Actions'da ishga tushadi. Hech qanday token talab qilinmaydi.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const CHANNEL = process.env.TELEGRAM_CHANNEL || 'qoshkopirtalim';
const MAX_PAGES = Number(process.env.TELEGRAM_PAGES || 5);
const OUT = 'public/telegram-news.json';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z#0-9]+);/gi, (m, e) => ENTITIES[e] ?? m);

const htmlToText = (html) =>
  decode(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<i class="emoji"[^>]*><b>([^<]*)<\/b><\/i>/gi, '$1')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const toTashkentDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return new Date().toISOString().slice(0, 10);
  return new Date(d.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
};

const cleanTitle = (line) =>
  line
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍\s#*•\-–—📢]+/u, '')
    .trim();

export const parseChannelHtml = (html, channel = CHANNEL) => {
  const posts = [];
  const chunks = html.split(/data-post="/).slice(1);
  for (const chunk of chunks) {
    const m = chunk.match(/^([^/"]+)\/(\d+)"/);
    if (!m || m[1].toLowerCase() !== channel.toLowerCase()) continue;
    const msgId = Number(m[2]);

    const textMatch = chunk.match(/class="tgme_widget_message_text js-message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (!textMatch || /tgme_widget_service/.test(textMatch[1])) continue; // xizmat xabarlari (kanal nomi o'zgardi va h.k.)
    const text = htmlToText(textMatch[1]);
    if (!text) continue;
    // Saytdan Telegramga yuborilgan postlar saytda allaqachon bor
    if (/Batafsil portalda o.qish/i.test(text)) continue;

    // Matndan oldingi qism — media (rasm/video) shu yerda; matndagi animatsion emoji'lar kirmaydi
    const textStart = chunk.indexOf('tgme_widget_message_text js-message_text');
    const mediaPart = textStart > 0 ? chunk.slice(0, textStart) : chunk;

    const images = [];
    const imgRe = /class="tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g;
    let im;
    while ((im = imgRe.exec(mediaPart))) if (!images.includes(im[1])) images.push(im[1]);

    // Videolar: kichiklari to'g'ridan-to'g'ri o'ynatiladi (src), kattalari faqat Telegramda ochiladi
    const videos = [];
    const vidParts = mediaPart.split('class="tgme_widget_message_video_player').slice(1);
    for (const part of vidParts) {
      const src = part.match(/<video[^>]*\ssrc="([^"]+)"/);
      const thumb = part.match(/background-image:url\('([^']+)'\)/);
      const duration = part.match(/message_video_duration[^"]*"[^>]*>([^<]+)</);
      const href = part.match(/href="(https:\/\/t\.me\/[^"]+)"/);
      videos.push({
        src: src ? decode(src[1]) : '',
        thumb: thumb ? thumb[1] : '',
        duration: duration ? duration[1].trim() : '',
        url: href ? decode(href[1]) : `https://t.me/${channel}/${msgId}`
      });
    }

    const time = chunk.match(/<time[^>]*datetime="([^"]+)"/);
    const views = chunk.match(/tgme_widget_message_views">([^<]+)</);
    const parseViews = (v) => {
      if (!v) return 0;
      const n = parseFloat(v.replace(',', '.'));
      return Math.round(/K/i.test(v) ? n * 1000 : /M/i.test(v) ? n * 1e6 : n) || 0;
    };

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    let title = cleanTitle(lines[0] || '');
    if (title.length > 140) title = title.slice(0, 137).replace(/\s+\S*$/, '') + '…';
    const rest = lines.slice(1).join(' ');
    const summarySrc = rest || text;
    const summary = summarySrc.length > 220 ? summarySrc.slice(0, 217).replace(/\s+\S*$/, '') + '…' : summarySrc;

    posts.push({
      id: `tg-${channel}-${msgId}`,
      title: title || 'Telegram kanal yangiligi',
      category: 'Boshqaruv',
      date: time ? toTashkentDate(time[1]) : new Date().toISOString().slice(0, 10),
      datetime: time ? time[1] : null,
      summary,
      content: text,
      imageUrl: images[0] || (videos[0] && videos[0].thumb) || '',
      images: images.length > 0 ? images : videos.map((v) => v.thumb).filter(Boolean).slice(0, 1),
      videos,
      author: 'Telegram kanal',
      views: parseViews(views && views[1]),
      telegramMessageId: String(msgId),
      sourceUrl: `https://t.me/${channel}/${msgId}`,
      source: 'telegram'
    });
  }
  return posts;
};

const main = async () => {
  const all = new Map();
  let before = '';
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `https://t.me/s/${CHANNEL}${before ? `?before=${before}` : ''}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; qoshkopirtalim-sync)' } });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    const html = await res.text();
    const ids = [...html.matchAll(new RegExp(`data-post="${CHANNEL}/(\\d+)"`, 'gi'))].map((x) => Number(x[1]));
    for (const p of parseChannelHtml(html)) all.set(p.id, p);
    if (ids.length === 0) break;
    const minId = Math.min(...ids);
    if (minId <= 1 || String(minId) === before) break;
    before = String(minId);
  }
  const list = [...all.values()].sort((a, b) => Number(b.telegramMessageId) - Number(a.telegramMessageId));
  if (!existsSync('public')) mkdirSync('public');
  writeFileSync(OUT, JSON.stringify(list, null, 1));
  console.log(`Telegram @${CHANNEL}: ${list.length} ta post -> ${OUT}`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.warn('Telegram postlarini olishda xatolik (deploy davom etadi):', err.message);
    if (!existsSync(OUT)) {
      if (!existsSync('public')) mkdirSync('public');
      writeFileSync(OUT, '[]');
    }
  });
}
