// =============================================================
// Adapter de generación de imágenes.
// =============================================================
// Sigue el mismo patrón que el LLM: si hay proxy configurado y la
// imagen está marcada para usarlo, se enruta a través del Worker
// (`POST {proxy}/image/generate`); si no, llamada directa.

import { getImageConfig } from './minimax.js';

const DEFAULT_PROMPT =
  'terraza rediseñada con pérgola de madera, plantas mediterráneas, ' +
  'suelo cálido, luz de tarde, foto arquitectónica, editorial';

export async function generateAfter(beforeDataUrl, opts = {}) {
  const cfg = getImageConfig();
  if (!cfg.enabled) {
    throw new Error(
      'Image API no configurada (faltan VITE_IMAGE_API_URL/KEY/MODEL).'
    );
  }

  const prompt = opts.prompt || DEFAULT_PROMPT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);

  try {
    let res;
    if (cfg.viaProxy) {
      const headers = { 'Content-Type': 'application/json' };
      if (cfg.proxyToken) headers.Authorization = `Bearer ${cfg.proxyToken}`;
      res = await fetch(`${cfg.proxyUrl.replace(/\/$/, '')}/image/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: cfg.model,
          input: {
            image: beforeDataUrl,
            prompt,
            strength: 0.65,
            aspect_ratio: '4:3',
          },
        }),
        signal: controller.signal,
      });
    } else {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      };
      res = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: cfg.model,
          input: {
            image: beforeDataUrl,
            prompt,
            strength: 0.65,
            aspect_ratio: '4:3',
          },
        }),
        signal: controller.signal,
      });
    }

    if (!res.ok) {
      const who = cfg.viaProxy ? 'El proxy de imagen' : 'Image API';
      const body = await res.text().catch(() => '');
      throw new Error(`${who} respondió ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    if (typeof data === 'string') return data;
    return (
      data.output?.[0] ||
      data.image ||
      data.url ||
      data.data?.[0]?.url ||
      ''
    );
  } finally {
    clearTimeout(timer);
  }
}
