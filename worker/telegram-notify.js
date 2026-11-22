/**
 * Cloudflare Worker: принимает заявку с формы «Заказать звонок» на
 * drphone-mrpl.ru и пересылает её владельцу в Telegram.
 *
 * Токен бота и chat_id хранятся как секреты Cloudflare (env), а не в коде —
 * поэтому их не видно ни на фронте, ни в этом файле на GitHub.
 *
 * Деплой и настройка — см. worker/README.md рядом с этим файлом.
 */

const ALLOWED_ORIGIN = 'https://drphone-mrpl.ru';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    const origin = request.headers.get('Origin');
    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders() });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response('Bad request', { status: 400, headers: corsHeaders() });
    }

    const name = String(data.name || '').trim().slice(0, 100);
    const phone = String(data.phone || '').trim().slice(0, 30);
    const page = String(data.page || '').trim().slice(0, 200);

    if (!name || !phone) {
      return new Response('Missing fields', { status: 400, headers: corsHeaders() });
    }

    const text =
      `📞 Новая заявка с сайта\n\n` +
      `Имя: ${escapeHtml(name)}\n` +
      `Телефон: ${escapeHtml(phone)}\n` +
      (page ? `Страница: ${escapeHtml(page)}\n` : '');

    const tgRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!tgRes.ok) {
      return new Response('Telegram error', { status: 502, headers: corsHeaders() });
    }

    return new Response('OK', { status: 200, headers: corsHeaders() });
  },
};
