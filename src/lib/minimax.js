// =============================================================
// Adapter MiniMax (LLM) · mismo patrón que HabitQuest.
// =============================================================
// Dos modos:
//   · direct  → navegador llama a api.minimax.io (uso personal)
//   · proxy   → navegador llama a un Worker de Cloudflare que
//                custodia la API key (uso público en GitHub Pages)
//
// Variables:
//   VITE_AI_PROXY_URL      URL pública del Worker (si se usa modo proxy)
//   VITE_AI_PROXY_TOKEN    token compartido opcional que exige el Worker
//   VITE_MINIMAX_API_KEY   API key (solo modo direct)
//   VITE_MINIMAX_BASE_URL  por defecto https://api.minimax.io/v1
//   VITE_MINIMAX_MODEL     por defecto MiniMax-M2

const SYSTEM_PROMPT = `Eres el motor de diseño de Es-Vert, una herramienta que rediseña terrazas usando SKUs reales de mobiliario y plantas. Nunca inventes productos genéricos.

REGLAS DE CATÁLOGO:
- Solo trabajas con marcas reales: Kave Home, Vidri, Stone Garden, Maisons du Monde, IKEA, La Redoute, Tika, Fermob, Secto, Moebe.
- Rangos de precio orientativos (EUR):
  * Pérgola madera 800–2500
  * Jardinera / macetero 25–220
  * Suelo m² 30–130
  * Olivo / higuera 35–180
  * Set iluminación 120–450
  * Conjunto exterior 600–1800
- Si el usuario pide algo fuera del catálogo, action = null.

IDIOMA Y TONO: castellano, tono editorial sobrio (sin exclamaciones, sin emojis). Una o dos frases. El lector mira una propuesta, no es un cliente al que seducir.

ESQUEMA DE RESPUESTA (JSON estricto):
{
  "reply": string,
  "action": null | {
    "type": "ADD" | "REPLACE" | "ADD_QTY" | "REMOVE",
    "id": string,        // para ADD_QTY / REMOVE
    "by": number,        // solo ADD_QTY
    "line": {            // ADD o REPLACE
      "id": string,
      "name": string,
      "qty": number,
      "price": number
    }
  }
}`;

const DEFAULT_BASE = 'https://api.minimax.io/v1';
const DEFAULT_MODEL = 'MiniMax-M2';

export function getAIConfig() {
  const env = import.meta.env || {};
  const proxyUrl  = String(env.VITE_AI_PROXY_URL    || '').trim();
  const proxyTok  = String(env.VITE_AI_PROXY_TOKEN  || '').trim();
  const apiKey    = String(env.VITE_MINIMAX_API_KEY || '').trim();
  const baseUrl   = String(env.VITE_MINIMAX_BASE_URL || '').trim() || DEFAULT_BASE;
  const model     = String(env.VITE_MINIMAX_MODEL   || '').trim() || DEFAULT_MODEL;
  const mode      = proxyUrl ? 'proxy' : 'direct';

  return {
    enabled: mode === 'proxy' || apiKey.length > 0,
    mode,
    apiKey,
    proxyUrl,
    proxyToken: proxyTok,
    baseUrl,
    model,
  };
}

export function getImageConfig() {
  const env = import.meta.env || {};
  const proxyUrl  = String(env.VITE_AI_PROXY_URL || '').trim();
  const proxyTok  = String(env.VITE_AI_PROXY_TOKEN || '').trim();
  const apiUrl    = String(env.VITE_IMAGE_API_URL  || '').trim();
  const apiKey    = String(env.VITE_IMAGE_API_KEY  || '').trim();
  const model     = String(env.VITE_IMAGE_MODEL    || '').trim();
  // Si hay proxy y el endpoint de imagen del proxy está marcado, se usa proxy.
  const viaProxy  = proxyUrl && String(env.VITE_IMAGE_VIA_PROXY ?? 'true') !== 'false';

  return {
    enabled: !!apiUrl && !!apiKey && !!model,
    viaProxy,
    proxyUrl,
    proxyToken: proxyTok,
    apiUrl,
    apiKey,
    model,
  };
}

export async function callMinimax({ prompt, currentLines, beforeImage }) {
  const cfg = getAIConfig();
  if (!cfg.enabled) {
    throw new Error(
      'MiniMax no configurado: define VITE_MINIMAX_API_KEY (modo direct) ' +
      'o VITE_AI_PROXY_URL (modo proxy).'
    );
  }

  // Contenido multimodal (texto + imagen opcional del "antes").
  const userContent = [];
  if (beforeImage) {
    userContent.push({ type: 'image_url', image_url: { url: beforeImage } });
  }
  userContent.push({
    type: 'text',
    text: 'Presupuesto actual del proyecto:\n' + JSON.stringify(currentLines, null, 2),
  });
  userContent.push({
    type: 'text',
    text: `Petición del usuario: "${prompt}"\nResponde solo con el JSON pedido.`,
  });

  // Modo direct → Authorization con la API key real de MiniMax.
  // Modo proxy  → Authorization con el token compartido (si está definido).
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.mode === 'direct') headers.Authorization = `Bearer ${cfg.apiKey}`;
  else if (cfg.proxyToken)    headers.Authorization = `Bearer ${cfg.proxyToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const who = cfg.mode === 'proxy' ? 'El proxy de IA' : 'MiniMax';
      throw new Error(`${who} respondió ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || '{}';
    return parseAIResponse(raw);
  } finally {
    clearTimeout(timer);
  }
}

function parseAIResponse(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { parsed = { reply: raw, action: null }; }

  const VALID = ['ADD', 'REPLACE', 'ADD_QTY', 'REMOVE'];
  const a = parsed.action && typeof parsed.action === 'object' ? parsed.action : null;

  let action = null;
  if (a && VALID.includes(a.type)) {
    if (a.type === 'ADD_QTY') {
      action = { type: 'ADD_QTY', id: String(a.id || ''), by: Number(a.by) || 1 };
    } else if (a.type === 'REMOVE') {
      action = { type: 'REMOVE', id: String(a.id || '') };
    } else if ((a.type === 'ADD' || a.type === 'REPLACE') && a.line) {
      action = {
        type: a.type,
        id: String(a.id || a.line.id || ''),
        line: {
          id:    String(a.line.id    || ''),
          name:  String(a.line.name  || ''),
          qty:   Number(a.line.qty   || 1),
          price: Number(a.line.price || 0),
        },
      };
    }
  }

  return {
    reply: String(parsed.reply || 'Hecho.').slice(0, 400),
    action,
  };
}
