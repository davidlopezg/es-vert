// =============================================================
// Adapter MiniMax (LLM) · OpenAI Chat Completions compatible.
// =============================================================
// Dos modos:
//   · direct  →  navegador → api.minimax.io
//   · proxy   →  navegador → Cloudflare Worker que custodia la key

const SYSTEM_PROMPT = `Eres el motor de diseño de Es-Vert, una herramienta que rediseña terrazas usando SKUs reales de mobiliario y plantas. Nunca inventes productos genéricos ni precios descabellados.

REGLAS DE CATÁLOGO:
- Marcas reales: Kave Home, Vidri, Stone Garden, Maisons du Monde, IKEA, La Redoute, Tika, Fermob, Secto, Moebe.
- Rangos de precio orientativos (EUR):
  * Pérgola madera 800–2500
  * Jardinera / macetero 25–220
  * Suelo m² 30–130
  * Olivo / higuera / hibiscus 35–180
  * Set iluminación 120–450
  * Conjunto exterior 600–1800
- Si la petición no encaja con el catálogo, action=null con reply explicando.

IMÁGENES DE PRODUCTO:
- Si el usuario adjunta imágenes de productos, identifícalas (tipo/color/material/forma).
- Devuelve una línea con un id auto-generado (kebab-case), nombre descriptivo, qty 1, precio realista.
- Si no puedes identificar el producto de la imagen, action=null con reply="No identifico el producto de la imagen adjunta. ¿Puedes decirme qué es?".

IDIOMA Y TONO: castellano, editorial sobrio (sin exclamaciones ni emojis). Una o dos frases. El lector mira una propuesta, no es un cliente al que seducir.

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

const DEFAULT_BASE  = 'https://api.minimax.io/v1';
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
  return {
    hasHF: !!env.VITE_HUGGINGFACE_TOKEN,
    hasCustom: !!(env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL),
    hfModel: env.VITE_HUGGINGFACE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0',
  };
}

export async function callMinimax({ prompt, currentLines, beforeImage, attachments }) {
  const cfg = getAIConfig();
  if (!cfg.enabled) {
    throw new Error(
      'MiniMax no configurado: define VITE_MINIMAX_API_KEY o VITE_AI_PROXY_URL.'
    );
  }

  // Contenido multimodal: foto del antes + adjuntos del usuario + JSON + texto.
  const userContent = [];
  if (beforeImage) {
    userContent.push({ type: 'image_url', image_url: { url: beforeImage } });
  }
  if (attachments && attachments.length > 0) {
    for (const a of attachments) {
      if (a?.dataUrl) {
        userContent.push({ type: 'image_url', image_url: { url: a.dataUrl } });
      }
    }
  }
  userContent.push({
    type: 'text',
    text: 'Presupuesto actual del proyecto:\n' + JSON.stringify(currentLines, null, 2),
  });
  userContent.push({
    type: 'text',
    text: `Petición del usuario: "${prompt}"\nResponde solo con el JSON pedido.`,
  });

  const headers = { 'Content-Type': 'application/json' };
  if (cfg.mode === 'direct') headers.Authorization = `Bearer ${cfg.apiKey}`;
  else if (cfg.proxyToken)    headers.Authorization = `Bearer ${cfg.proxyToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

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
