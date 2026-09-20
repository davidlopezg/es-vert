// =============================================================
// Adapter de generación de imagen · cadena con fallback garantizado.
// =============================================================
//   1. HuggingFace (si VITE_HUGGINGFACE_TOKEN + foto subida)
//   2. Replicate (si VITE_REPLICATE_API_TOKEN + foto subida) — img2img
//      real, CORS-enabled para navegador. Única salida browser-direct
//      que usa tu foto como conditioning.
//   3. Together.ai (si VITE_TOGETHER_API_KEY) — T2I browser-direct.
//   4. Custom provider (Replicate / fal / Stability)
//   5. Pollinations (T2I, hoy capado).
//   6. Stock curado (picsum) — ÚLTIMO RECURSO, nunca falla.

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

let lastSource = 'idle';
export function getLastImageSource() { return lastSource; }

// ---- 1) Hugging Face Inference (free tier; necesita proxy) ------------
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
      inputs: { image: base64, prompt, strength: 0.65, num_inference_steps: 30 },
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

// ---- 2) Replicate (browser-DIRECT, CORS-enabled, img2img REAL) --------
//    Sign up: https://replicate.com (Google login, $5 free credits)
//    API keys: https://replicate.com/account/api-tokens
//
//    ⚠️ Image-to-image DE VERDAD: la imagen del usuario entra al modelo
//    como conditioning. Stability AI SDXL con input.image = tu foto
//    transformada según prompt_strength.
async function replicate(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const token = env.VITE_REPLICATE_API_TOKEN;
  if (!token) throw new Error('Replicate: VITE_REPLICATE_API_TOKEN no definido.');
  if (!beforeDataUrl) throw new Error('Replicate: requiere foto subida.');

  const model = env.VITE_REPLICATE_MODEL || 'stability-ai/sdxl';
  const promptStrength = Number(opts.strength ?? env.VITE_REPLICATE_STRENGTH ?? 0.65);

  const headers = {
    Authorization: `Token ${token}`,
    'Content-Type': 'application/json',
  };

  // Crear predicción
  const createBody = {
    model,
    input: {
      image: beforeDataUrl,
      prompt,
      prompt_strength: promptStrength,
      num_inference_steps: 30,
    },
  };

  // Si el usuario define VITE_REPLICATE_VERSION, usa "version" en vez de "model"
  if (env.VITE_REPLICATE_VERSION) {
    delete createBody.model;
    createBody.version = env.VITE_REPLICATE_VERSION;
  }

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers,
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => '');
    throw new Error(`Replicate submit ${createRes.status}: ${txt.slice(0, 250)}`);
  }

  const prediction = await createRes.json();

  // Caso 1: respuesta síncrona con output directo
  if (prediction.output && !prediction.urls?.get) {
    return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  }

  // Caso 2: hay que poll para obtener resultado
  const pollUrl = prediction.urls?.get;
  if (!pollUrl) throw new Error('Replicate: sin URL de polling ni output');

  const deadline = Date.now() + 90_000; // 90 s máx
  while (Date.now() < deadline) {
    await sleep(2000);
    try {
      const pollRes = await fetch(pollUrl, { headers });
      if (!pollRes.ok) continue;
      const status = await pollRes.json();
      if (status.status === 'succeeded') {
        return Array.isArray(status.output) ? status.output[0] : status.output;
      }
      if (status.status === 'failed' || status.status === 'canceled') {
        throw new Error(`Replicate ${status.status}: ${status.error || 'error'}`);
      }
    } catch (e) {
      if (!isNetworkError(e)) throw e;
      // network blip al hacer polling — sigue intentando
    }
  }
  throw new Error('Replicate: agotó espera (90 s). Modelo frío, prueba ↻ Reintentar.');
}

// ---- 3) Together.ai (browser-direct, T2I, NO usa tu foto) --------------
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
  if (typeof data === 'string') return data;
  if (Array.isArray(data?.data) && data.data[0]?.url) return data.data[0].url;
  return data?.url || (Array.isArray(data?.data) ? data.data[0] : null) || '';
}

// ---- 4) Custom provider -------------------------------------------------
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
    data.output?.[0] ||
    data.image ||
    data.url ||
    data.data?.[0]?.url ||
    ''
  );
}

// ---- 5) Pollinations (T2I, tier anónimo muy capado) --------------------
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

  for (let attempt = 0; attempt < 3; attempt++) {
    let probe;
    try {
      probe = await fetch(url, { method: 'HEAD' });
    } catch {
      await sleep(3000);
      continue;
    }
    if (probe.status === 200) return url;
    if (probe.status === 429 || probe.status === 500 ||
        probe.status === 502 || probe.status === 503 || probe.status === 504) {
      await sleep(Math.min(18000, 4000 * (attempt + 1) + Math.random() * 2000));
      continue;
    }
    const t = await probe.text().catch(() => '');
    throw new Error(`Pollinations ${probe.status}: ${t.slice(0, 200) || 'forbidden'}`);
  }
  throw new Error('Pollinations agotó reintentos.');
}

// ---- 6) Stock curado ----------------------------------------------------
function curatedStock() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
  return `https://picsum.photos/seed/esvert-${stamp}/1600/1100`;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- Dispatcher principal ----------------------------------------------
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
      console.warn(`[Es-Vert] HF (${kind}) — siguiente.`);
    }
  }

  // 2) Replicate — única opción browser-direct que hace img2img de verdad.
  if (env.VITE_REPLICATE_API_TOKEN && beforeDataUrl) {
    try {
      const url = await replicate(beforeDataUrl, prompt, opts);
      lastSource = 'replicate';
      return url;
    } catch (e) {
      const kind = isNetworkError(e) ? 'red' : e.message?.slice(0, 80) ?? 'error';
      console.warn(`[Es-Vert] Replicate (${kind}) — siguiente.`);
    }
  }

  // 3) Together.ai — T2I browser-direct (no usa tu foto)
  if (env.VITE_TOGETHER_API_KEY) {
    try {
      const url = await together(prompt, opts);
      lastSource = 'together';
      return url;
    } catch (e) {
      console.warn(`[Es-Vert] Together (${e.message?.slice(0, 80)}) — siguiente.`);
    }
  }

  // 4) Custom
  if (env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL && beforeDataUrl) {
    try {
      const url = await custom(beforeDataUrl, prompt, opts);
      lastSource = 'custom';
      return url;
    } catch (e) {
      console.warn(`[Es-Vert] custom (${e.message?.slice(0, 80)}) — siguiente.`);
    }
  }

  // 5) Pollinations
  try {
    const url = await pollinations(prompt, opts);
    lastSource = 'pollinations';
    return url;
  } catch (e) {
    console.warn(`[Es-Vert] Pollinations (${e.message?.slice(0, 80)}) — fallback final.`);
  }

  // 6) Stock curado
  lastSource = 'curated';
  console.warn('[Es-Vert] Usando stock curado como último recurso.');
  return curatedStock();
}

export { BASE_PROMPT as DEFAULT_PROMPT };
