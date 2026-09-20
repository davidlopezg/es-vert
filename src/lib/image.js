// =============================================================
// Adapter de generación de imagen · tres niveles de calidad.
// =============================================================
//  1. Pollinations  →  cero-config, gratis, sin signup. T2I.
//                       Limitado por IP (1 cola, tier anónimo).
//  2. HuggingFace  →  free tier, SDXL, image-to-image real.
//  3. Custom       →  Replicate / fal.ai / Stability.

const BASE_PROMPT = [
  'Photorealistic contemporary Mediterranean terrace redesign',
  'premium outdoor furniture in neutral tones',
  'golden hour late afternoon natural sunlight',
  'architectural editorial photography',
  'contemporary Spanish landscape design',
  'sharp focus, magazine quality, ultra detailed',
].join(', ');

export function buildImagePrompt(lines) {
  if (!lines || lines.length === 0) return BASE_PROMPT;
  const items = lines
    .filter(l => l.qty > 0)
    .map(l => `${l.qty}× ${l.name}`)
    .join(', ');
  return [
    'Photorealistic elegant Mediterranean terrace redesign featuring:',
    items,
    BASE_PROMPT,
  ].join(' · ');
}

// ---- 1) Pollinations (default, sin credenciales) ----------------------
//    Tier anónimo = 1 request en cola por IP. Si la cola está
//    ocupada, el servidor responde 429/500 con JSON de error.
//    Solución: HEAD para detectar el estado antes de asignar la URL,
//    retry con backoff si está saturado.
async function pollinations(prompt, opts = {}) {
  const w = opts.width  || 1024;   // 1600 saturaba la cola, bajamos
  const h = opts.height ||  768;
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const params = new URLSearchParams({
    model: 'flux',                 // explícito: evita Sana (más caro)
    width: String(w),
    height: String(h),
    seed: String(seed),
    nologo: 'true',
    // enhance:false → Pollinations va directo al modelo base, no Sana
  });
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

  const maxAttempts = 4;
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let probe;
    try {
      probe = await fetch(url, { method: 'HEAD' });
    } catch (e) {
      // network error → reintentar
      lastErr = e;
      await sleep(3000);
      continue;
    }

    if (probe.status === 200) return url;

    if (probe.status === 429 || probe.status === 500 ||
        probe.status === 502 || probe.status === 503 || probe.status === 504) {
      // Cola llena o servidor saturado → backoff progresivo.
      const base = 4000 * (attempt + 1);
      const jitter = Math.random() * 2000;
      const wait = Math.min(20000, base + jitter);
      lastErr = new Error(`Pollinations ${probe.status}, reintento ${attempt + 1}/${maxAttempts}`);
      await sleep(wait);
      continue;
    }

    // Otro error HTTP (4xx real): no reintentar, mostrar.
    const t = await probe.text().catch(() => '');
    throw new Error(`Pollinations ${probe.status}: ${t.slice(0, 200)}`);
  }

  throw lastErr || new Error('Pollinations agotó reintentos (rate-limit). Prueba HF u otro provider.');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- 2) Hugging Face Inference (free tier) ----------------------------
async function huggingFace(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const token = env.VITE_HUGGINGFACE_TOKEN;
  if (!token) throw new Error('VITE_HUGGINGFACE_TOKEN no definido.');
  if (!beforeDataUrl) throw new Error('HF requiere foto subida.');

  const model = opts.model
    || env.VITE_HUGGINGFACE_MODEL
    || 'stabilityai/stable-diffusion-xl-base-1.0';

  const base64 = beforeDataUrl.split(',')[1];

  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        image: base64,
        prompt,
        strength: 0.65,
        num_inference_steps: 30,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HF ${res.status}: ${txt.slice(0, 200)}`);
  }

  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(new Error('No se pudo codificar la imagen HF'));
    r.readAsDataURL(blob);
  });
}

// ---- 3) Provider custom (Replicate, fal.ai, etc.) ---------------------
async function custom(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const url   = env.VITE_IMAGE_API_URL;
  const key   = env.VITE_IMAGE_API_KEY;
  const model = env.VITE_IMAGE_MODEL;
  if (!url || !key || !model) throw new Error('Image API custom no configurada.');
  if (!beforeDataUrl) throw new Error('Provider custom requiere foto.');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: {
        image: beforeDataUrl,
        prompt,
        strength: 0.65,
        aspect_ratio: '4:3',
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Image API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (
    data.output?.[0]
    || data.image
    || data.url
    || data.data?.[0]?.url
    || ''
  );
}

// ---- Dispatcher principal ---------------------------------------------
export async function generateAfter(beforeDataUrl, opts = {}) {
  const env = import.meta.env || {};
  const prompt = opts.prompt || BASE_PROMPT;

  if (env.VITE_HUGGINGFACE_TOKEN && beforeDataUrl) {
    return huggingFace(beforeDataUrl, prompt, opts);
  }
  if (env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL && beforeDataUrl) {
    return custom(beforeDataUrl, prompt, opts);
  }
  return pollinations(prompt, opts);
}

export { BASE_PROMPT as DEFAULT_PROMPT };
