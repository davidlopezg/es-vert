// =============================================================
// Adapter de generación de imagen · cadena con fallback garantizado.
// =============================================================
//   1. HuggingFace (si VITE_HUGGINGFACE_TOKEN + foto subida)
//   2. Together.ai (si VITE_TOGETHER_API_KEY) — browser-direct, FLUX
//   3. Custom provider (Replicate / fal / Stability, si sus 3 vars)
//   4. Pollinations (zero-config, sin signup). T2I. Hoy muy capado.
//   5. Stock curado (picsum con seed) → ÚLTIMO RECURSO, nunca falla.
//
// Esta función SIEMPRE devuelve un string utilizable como <img src>.

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

// Network/CORS / abort → no propagamos; probamos el siguiente provider.
// Error HTTP real (4xx/5xx) → tampoco bloquea la cadena: la app
// siempre debe mostrar algo. Solo errores HTTP reales se loguean.
function isNetworkError(e) {
  return (
    e?.name === 'TypeError' ||
    e?.name === 'AbortError' ||
    (typeof e?.message === 'string' && (
      e.message.includes('Failed to fetch') ||
      e.message.includes('NetworkError') ||
      e.message.includes('fetch failed') ||
      e.message.includes('Network request failed') ||
      e.message.includes('Load failed')
    ))
  );
}

// Estado de la última generación — el DiagnosticPill lo lee.
let lastSource = 'idle';

export function getLastImageSource() {
  return lastSource;
}

// ---- 2) Together.ai (browser-direct, free $5 al registrarse) --------
//    Crear cuenta + API key en https://api.together.xyz (10 s)
//    Soporta CORS, así que funciona desde el navegador sin proxy.
//    ⚠️ T2I: no condiciona sobre la foto del usuario, solo prompt.
async function together(prompt, opts = {}) {
  const env = import.meta.env || {};
  const apiKey = env.VITE_TOGETHER_API_KEY;
  const model  = env.VITE_TOGETHER_MODEL || 'black-forest-labs/FLUX.1-schnell-Free';
  if (!apiKey) throw new Error('Together: VITE_TOGETHER_API_KEY no definido.');

  const url = env.VITE_TOGETHER_BASE_URL || 'https://api.together.xyz/v1/images/generations';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      width:  opts.width  || 1024,
      height: opts.height ||  768,
      steps: 4,
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Together ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  // Together devuelve { data: [{ url: '...' }] }
  const url2 = data?.data?.[0]?.url || data?.url || (Array.isArray(data?.data) ? data.data[0] : null);
  return typeof url2 === 'string' ? url2 : (url2?.url || '');
}

// ---- 1) Hugging Face Inference (free tier) ----------------------------
async function huggingFace(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const token = env.VITE_HUGGINGFACE_TOKEN;
  if (!token) throw new Error('HF: VITE_HUGGINGFACE_TOKEN no definido.');
  if (!beforeDataUrl) throw new Error('HF: requiere foto subida.');

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
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(new Error('HF: no se pudo codificar la imagen'));
    r.readAsDataURL(blob);
  });
}

// ---- 2) Provider custom (Replicate, fal.ai, etc.) ---------------------
async function custom(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const url   = env.VITE_IMAGE_API_URL;
  const key   = env.VITE_IMAGE_API_KEY;
  const model = env.VITE_IMAGE_MODEL;
  if (!url || !key || !model) throw new Error('custom: provider no configurado.');
  if (!beforeDataUrl) throw new Error('custom: requiere foto subida.');

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
    throw new Error(`custom ${res.status}: ${body.slice(0, 200)}`);
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

// ---- 3) Pollinations (T2I, hoy capado) --------------------------------
async function pollinations(prompt, opts = {}) {
  const w = opts.width  || 1024;
  const h = opts.height ||  768;
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const params = new URLSearchParams({
    model: 'flux',
    width: String(w),
    height: String(h),
    seed: String(seed),
    nologo: 'true',
  });
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let probe;
    try {
      probe = await fetch(url, { method: 'HEAD' });
    } catch {
      await sleep(3000);
      continue;
    }
    if (probe.status === 200) return url;

    // 429/5xx: reintento con backoff
    if (probe.status === 429 || probe.status === 500 ||
        probe.status === 502 || probe.status === 503 || probe.status === 504) {
      const base = 4000 * (attempt + 1);
      const jitter = Math.random() * 2000;
      await sleep(Math.min(18000, base + jitter));
      continue;
    }

    // 4xx real (incluido 403) → no reintentamos. Lanzamos para que la
    // cadena caiga al siguiente provider.
    const t = await probe.text().catch(() => '');
    throw new Error(`Pollinations ${probe.status}: ${t.slice(0, 200) || 'forbidden'}`);
  }
  throw new Error('Pollinations agotó reintentos.');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- 4) Stock curado (ÚLTIMO RECURSO) --------------------------------
//    picsum da imágenes estables por seed. Cambiamos cada día para
//    que no parezca la misma foto en todas las demos.
function curatedStock() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
  return `https://picsum.photos/seed/esvert-${stamp}/1600/1100`;
}

// ---- Dispatcher principal ---------------------------------------------
export async function generateAfter(beforeDataUrl, opts = {}) {
  const env = import.meta.env || {};
  const prompt = opts.prompt || BASE_PROMPT;
  lastSource = 'starting';

  // 1) HuggingFace
  if (env.VITE_HUGGINGFACE_TOKEN && beforeDataUrl) {
    try {
      const url = await huggingFace(beforeDataUrl, prompt, opts);
      lastSource = 'huggingface';
      return url;
    } catch (e) {
      const kind = isNetworkError(e) ? 'CORS/red' : e.message?.slice(0, 60) ?? 'error';
      console.warn(`[Es-Vert] HF (${kind}) — siguiente provider.`);
    }
  }

  // 2) Together.ai — funciona desde el navegador (CORS-enabled),
  //    T2I de calidad con FLUX. Si está configurada, va antes de
  //    Pollinations y del custom. Sin foto del usuario, solo prompt.
  if (env.VITE_TOGETHER_API_KEY) {
    try {
      const url = await together(prompt, opts);
      lastSource = 'together';
      return url;
    } catch (e) {
      const kind = isNetworkError(e) ? 'red' : e.message?.slice(0, 60) ?? 'error';
      console.warn(`[Es-Vert] Together (${kind}) — siguiente provider.`);
    }
  }

  // 2) Custom
  if (env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL && beforeDataUrl) {
    try {
      const url = await custom(beforeDataUrl, prompt, opts);
      lastSource = 'custom';
      return url;
    } catch (e) {
      const kind = isNetworkError(e) ? 'CORS/red' : e.message?.slice(0, 60) ?? 'error';
      console.warn(`[Es-Vert] custom (${kind}) — siguiente provider.`);
    }
  }

  // 3) Pollinations
  try {
    const url = await pollinations(prompt, opts);
    lastSource = 'pollinations';
    return url;
  } catch (e) {
    console.warn(`[Es-Vert] Pollinations (${e.message?.slice(0, 80)}) — fallback final.`);
  }

  // 4) Stock curado — siempre funciona
  lastSource = 'curated';
  console.warn('[Es-Vert] Usando stock curado como último recurso.');
  return curatedStock();
}

export { BASE_PROMPT as DEFAULT_PROMPT };
