/**
 * ai-proxy/worker.js — Proxy serverless para el LLM y la generación
 * de imágenes. Custodia las claves secretas (MiniMax + proveedor de
 * imagen) en el servidor de Cloudflare, de modo que el front público
 * (estático en GitHub Pages) solo conoce la URL del Worker.
 *
 * Endpoints:
 *   POST /chat/completions   → reenvía a https://api.minimax.io/v1/chat/completions
 *                              Authorization: Bearer ${env.MINIMAX_API_KEY}
 *
 *   POST /image/generate     → reenvía a ${env.IMAGE_API_URL}
 *                              Authorization: Bearer ${env.IMAGE_API_KEY}
 *
 * Auth opcional con token compartido (recomendado si la app es pública).
 *   Authorization: Bearer ${env.AI_PROXY_TOKEN}  debe coincidir para usar el proxy.
 *
 * Despliegue (gratis, 1 minuto):
 *   1. dash.cloudflare.com → Workers & Pages → Create → Worker.
 *   2. Pega este archivo como código.
 *   3. Settings → Variables and Secrets:
 *        MINIMAX_API_KEY = tu-clave-de-minimax
 *        IMAGE_API_URL   = (opcional) endpoint del proveedor de imagen
 *        IMAGE_API_KEY   = (opcional) clave del proveedor
 *        AI_PROXY_TOKEN  = (opcional) token compartido
 *   4. Deploy. Copia la URL tipo https://tu-worker.tu-subdominio.workers.dev
 *   5. Configúrala en tu repo como VITE_AI_PROXY_URL (y opcional VITE_AI_PROXY_TOKEN).
 */

const MINIMAX_URL  = 'https://api.minimax.io/v1/chat/completions';

function cors(res) {
  const r = new Response(res.body, res);
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function fail(message, status = 500) {
  return cors(json({ type: 'error', error: { message } }, status));
}
function checkAuth(request, env) {
  if (!env.AI_PROXY_TOKEN) return null;     // auth opcional
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.AI_PROXY_TOKEN}` ? null : fail('Unauthorized', 401);
}
async function readBody(request) {
  try { return await request.json(); }
  catch { return null; }
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    const url = new URL(request.url);
    const path = url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1)
      : url.pathname;

    if (request.method !== 'POST') return fail('Method not allowed', 405);

    // ---- POST /chat/completions ----
    if (path === '/chat/completions') {
      const unauth = checkAuth(request, env); if (unauth) return unauth;
      if (!env.MINIMAX_API_KEY) return fail('MINIMAX_API_KEY no configurado en el Worker', 500);

      const body = await readBody(request);
      if (!body) return fail('Invalid JSON', 400);

      const upstream = await fetch(MINIMAX_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.MINIMAX_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      const text = await upstream.text();
      return cors(new Response(text, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    // ---- POST /image/generate ----
    if (path === '/image/generate') {
      const unauth = checkAuth(request, env); if (unauth) return unauth;
      if (!env.IMAGE_API_URL || !env.IMAGE_API_KEY) {
        return fail('IMAGE_API_URL / IMAGE_API_KEY no configurados en el Worker', 500);
      }

      const body = await readBody(request);
      if (!body) return fail('Invalid JSON', 400);

      const upstream = await fetch(env.IMAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.IMAGE_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      const text = await upstream.text();
      return cors(new Response(text, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    return fail('Not found', 404);
  },
};
