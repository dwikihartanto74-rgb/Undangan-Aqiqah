/**
 * Cloudflare Pages Function: /api
 * Tambahkan environment variable const gasUrl = 'https://script.google.com/macros/s/AKfycbyF9byjELwhetzlhR28Mj3k5y0JE_dcqRVfx_bW8jTjyWEFdoVe2asGYaqDiiFv4799Jw/exec';

 */
const ALLOWED_ACTIONS = new Set(['getInvitationData', 'getGuestMessages', 'submitRSVP']);

export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache'
  };

  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      success: true,
      message: 'Cloudflare API aktif',
      configured: Boolean(env.GAS_WEB_APP_URL)
    }), { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Metode tidak diizinkan.' }), {
      status: 405, headers
    });
  }

  const gasUrl = String(env.GAS_WEB_APP_URL || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(gasUrl)) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Environment variable GAS_WEB_APP_URL belum benar. Gunakan URL Web App Apps Script yang berakhir /exec.'
    }), { status: 500, headers });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ success: false, message: 'Body permintaan bukan JSON valid.' }), {
      status: 400, headers
    });
  }

  if (!payload || !ALLOWED_ACTIONS.has(String(payload.action || ''))) {
    return new Response(JSON.stringify({ success: false, message: 'Aksi API tidak diizinkan.' }), {
      status: 400, headers
    });
  }

  try {
    const upstream = await fetch(gasUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Apps Script tidak mengembalikan JSON. Pastikan Web App sudah dideploy dan aksesnya sesuai.'
      }), { status: 502, headers });
    }

    return new Response(JSON.stringify(data), {
      status: upstream.ok ? 200 : upstream.status,
      headers
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Gagal menghubungi Apps Script: ' + String(error && error.message || error).slice(0, 180)
    }), { status: 502, headers });
  }
}
