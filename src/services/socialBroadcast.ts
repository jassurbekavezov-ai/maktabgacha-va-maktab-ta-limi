import { NewsItem, PortalSettings } from '../types';

export interface BroadcastResult {
  telegram?: {
    success: boolean;
    messageId?: string;
    error?: string;
  };
  facebook?: {
    success: boolean;
    postId?: string;
    error?: string;
  };
  instagram?: {
    success: boolean;
    mediaId?: string;
    error?: string;
  };
}

/**
 * Format news item for Telegram Channel with HTML formatting and tags (Using Uzbek orthography)
 */
export const formatTelegramMessage = (news: NewsItem, settings: PortalSettings): string => {
  const currentUrl = window.location.origin;
  return `📢 <b>${escapeHtml(news.title)}</b>\n\n` +
    `${escapeHtml(news.summary)}\n\n` +
    `📁 <b>Kategoriya:</b> #${news.category.replace(/[^a-zA-Z0-9]/g, '_')}\n` +
    `🗓 <b>Sana:</b> ${news.date}\n` +
    `✍️ <b>Muallif:</b> ${escapeHtml(news.author)}\n\n` +
    `🌐 <b>Batafsil portalda o‘qish:</b>\n` +
    `<a href="${currentUrl}">Qo‘shko‘pir tumani MMTB rasmiy portali</a>\n\n` +
    `📲 Bölimning rasmiy sahifalariga obuna böling!\n` +
    `🌐 <a href="https://qoshkopirtalim.uz/">Web sayt</a> | ` +
    `✅ <a href="https://t.me/qoshmmtbkanal">Telegram</a> | ` +
    `🌐 <a href="https://www.instagram.com/qoshkopirtalim">Instagram</a> | ` +
    `✅ <a href="https://www.facebook.com/groups/693971028087553">Facebook</a> | ` +
    `📹 <a href="https://www.youtube.com/@QoshkopirtMMTB">YouTube</a>`;
};

/**
 * Format caption for Instagram with hashtags and clean formatting
 */
export const formatInstagramCaption = (news: NewsItem): string => {
  return `${news.title}\n\n` +
    `${news.summary}\n\n` +
    `🗓 Sana: ${news.date}\n` +
    `📍 Qo‘shko‘pir tumani maktabgacha va maktab ta’limi bo‘limi rasmiy axborot xizmati\n\n` +
    `Batafsil veb-saytimizda: profil sarlavhasidagi havola orqali\n\n` +
    `#Qoshkopir #Xorazm #Talim #Maktab #Bogcha #MMTB #Yangiliklar #Olimpiada #XalqTalimi`;
};

/**
 * Send news to Telegram channel using official Telegram Bot API
 */
export const postToTelegram = async (
  botToken: string,
  channelUsernameOrId: string,
  news: NewsItem,
  settings: PortalSettings
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  if (!botToken || !channelUsernameOrId) {
    return {
      success: false,
      error: "Telegram Bot Tokeni yoki Kanal ID si ko‘rsatilmagan"
    };
  }

  let targetChat = channelUsernameOrId.trim();
  if (!targetChat.startsWith('@') && !targetChat.startsWith('-')) {
    targetChat = `@${targetChat}`;
  }

  const messageText = formatTelegramMessage(news, settings);

  try {
    if (news.imageUrl && (news.imageUrl.startsWith('http://') || news.imageUrl.startsWith('https://'))) {
      const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          photo: news.imageUrl,
          caption: messageText,
          parse_mode: 'HTML'
        })
      });

      const photoData = await photoRes.json();
      if (photoData.ok) {
        return { success: true, messageId: String(photoData.result.message_id) };
      }
    }

    const textRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChat,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    const textData = await textRes.json();
    if (textData.ok) {
      return { success: true, messageId: String(textData.result.message_id) };
    } else {
      return {
        success: false,
        error: textData.description || "Telegram API xatolik qaytardi"
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Telegram serveri bilan bog‘lanib bo‘lmadi"
    };
  }
};

/**
 * Test Telegram bot connection and channel post permission
 */
export const testTelegramConnection = async (
  botToken: string,
  channelUsernameOrId: string
): Promise<{ success: boolean; botName?: string; error?: string }> => {
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData = await meRes.json();

    if (!meData.ok) {
      return { success: false, error: "Bot tokeni noto‘g‘ri: " + meData.description };
    }

    const botName = meData.result.first_name + ` (@${meData.result.username})`;

    if (channelUsernameOrId) {
      let targetChat = channelUsernameOrId.trim();
      if (!targetChat.startsWith('@') && !targetChat.startsWith('-')) {
        targetChat = `@${targetChat}`;
      }

      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          text: `🟢 <b>Qo‘shko‘pir tumani MMTB rasmiy portali</b>\n\nTelegram integratsiyasi muvaffaqiyatli sinovdan o‘tkazildi.\nSana: ${new Date().toLocaleString('uz-UZ')}`,
          parse_mode: 'HTML'
        })
      });

      const sendData = await sendRes.json();
      if (!sendData.ok) {
        return {
          success: false,
          botName,
          error: `Bot to‘g‘ri, lekin kanalga yuborib bo‘lmadi: ${sendData.description}. Bot kanalda 'Administrator' ekanligini tekshiring!`
        };
      }
    }

    return { success: true, botName };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Post to Instagram via Instagram Graph API
 * Note: Instagram Graph API requires an Instagram Professional/Creator account connected to a Facebook Page.
 */
export const postToInstagram = async (
  instagramAccountId: string,
  accessToken: string,
  news: NewsItem
): Promise<{ success: boolean; mediaId?: string; error?: string }> => {
  if (!instagramAccountId || !accessToken) {
    return {
      success: false,
      error: "Instagram Account ID yoki Access Token kiritilmagan"
    };
  }

  // Instagram requires a valid publicly accessible image URL
  const imageUrl = news.imageUrl?.startsWith('http')
    ? news.imageUrl
    : `${window.location.origin}${news.imageUrl}`;

  const caption = formatInstagramCaption(news);

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        })
      }
    );

    const containerData = await containerRes.json();
    if (!containerData.id) {
      return {
        success: false,
        error: containerData.error?.message || "Instagram media konteyneri yaratilmadi"
      };
    }

    const creationId = containerData.id;

    // Step 2: Publish media container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken
        })
      }
    );

    const publishData = await publishRes.json();
    if (publishData.id) {
      return { success: true, mediaId: publishData.id };
    } else {
      return {
        success: false,
        error: publishData.error?.message || "Instagram postini nashr qilishda xatolik"
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Instagram serveriga ulanib bo‘lmadi" };
  }
};

/**
 * Test Instagram account connection
 */
export const testInstagramConnection = async (
  instagramAccountId: string,
  accessToken: string
): Promise<{ success: boolean; username?: string; error?: string }> => {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,username,name&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.id) {
      return { success: true, username: data.username || data.name || data.id };
    } else {
      return { success: false, error: data.error?.message || "Instagram hisobi tasdiqlanmadi" };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Post to Facebook Page Graph API
 */
export const postToFacebook = async (
  pageId: string,
  pageToken: string,
  news: NewsItem
): Promise<{ success: boolean; postId?: string; error?: string }> => {
  if (!pageId || !pageToken) {
    return {
      success: false,
      error: "Facebook Page ID yoki Access Token kiritilmagan"
    };
  }

  const message = `${news.title}\n\n${news.summary}\n\nQo‘shko‘pir tumani maktabgacha va maktab ta’limi bo‘limi`;

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: pageToken,
        link: window.location.origin
      })
    });

    const data = await res.json();
    if (data.id) {
      return { success: true, postId: data.id };
    } else {
      return { success: false, error: data.error?.message || "Facebook xatolik qaytardi" };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Generate manual share URL for Telegram
 */
export const getTelegramShareUrl = (news: NewsItem): string => {
  const url = window.location.origin;
  const text = `${news.title}\n\n${news.summary}`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
};

/**
 * Generate manual share URL for Facebook
 */
export const getFacebookShareUrl = (): string => {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
