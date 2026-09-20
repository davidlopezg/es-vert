// =============================================================
// Adapter de generación de imagen · tres niveles + fallback.
// =============================================================
//  1. HuggingFace (free) cuando VITE_HUGGINGFACE_TOKEN está definida
//     El navegador puede no llegar (CORS / red). Si falla por
//     network/CORS, fallback automático a Pollinations sin error.
//  2. Custom (Replicate / fal.ai / Stability) con sus tres vars
//  3. Pollinations (zero-config, gratis, sin signup). T2I.

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

// Network/CORS / abort → fallback silencioso a Pollinations.
// Error HTTP real (4xx/5xx con cuerpo) → se propaga al usuario.
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

// ---- 1) Hugging Face Inference (free tier) ----------------------------
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

// ---- 2) Provider custom (Replicate, fal.ai, etc.) ---------------------
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

// ---- 3) Pollinations (fallback; default cuando nada más hay) ---------
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

  const maxAttempts = 4;
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let probe;
    try {
      probe = await fetch(url, { method: 'HEAD' });
    } catch (e) {
      lastErr = e;
      await sleep(3000);
      continue;
    }
    if (probe.status === 200) return url;
    if (probe.status === 429 || probe.status === 500 ||
        probe.status === 502 || probe.status === 503 || probe.status === 504) {
      const base = 4000 * (attempt + 1);
      const jitter = Math.random() * 2000;
      await sleep(Math.min(20000, base + jitter));
      lastErr = new Error(`Pollinations ${probe.status}, reintento ${attempt + 1}/${maxAttempts}`);
      continue;
    }
    const t = await probe.text().catch(() => '');
    throw new Error(`Pollinations ${probe.status}: ${t.slice(0, 200)}`);
  }
  throw lastErr || new Error('Pollinations agotó reintentos (rate-limit).');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- Dispatcher con fallback automático --------------------------------
// Cada provider se prueba en orden. Si uno falla por NETWORK/CORS,
// se cae al siguiente SIN propagar error. Solo errores HTTP reales
// del provider principal detienen el flujo (token malo, modelo caído).
export async function generateAfter(beforeDataUrl, opts = {}) {
  const env = import.meta.env || {};
  const prompt = opts.prompt || BASE_PROMPT;

  const chain = [];

  if (env.VITE_HUGGINGFACE_TOKEN && beforeDataUrl) {
    chain.push({
      name: 'huggingface',
      run: () => huggingFace(beforeDataUrl, prompt, opts),
    });
  }
  if (env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL && beforeDataUrl) {
    chain.push({
      name: 'custom',
      run: () => custom(beforeDataUrl, prompt, opts),
    });
  }
  chain.push({
    name: 'pollinations',
    run: () => pollinations(prompt, opts),
  });

  let lastErr = null;
  const tried = [];
  for (const p of chain) {
    try {
      return await p.run();
    } catch (e) {
      tried.push({ name: p.name, error: e });
      if (isNetworkError(e)) {
        console.warn(`[Es-Vert] ${p.name} no responde (${e.message?.slice(0, 60) ?? 'fetch error'}), probando siguiente…`);
        lastErr = e;
        continue;
      }
      // Error real (HTTP 4xx/5xx) — no tiene sentido seguir.
      throw e;
    }
  }

  // Llegamos aquí solo si TODOS fallaron por network/CORS.
  throw new Error(
    `Ningún provider disponible. Probados: ${tried.map(t => t.name).join(', ')}. ` +
    `Último error: ${lastErr?.message ?? 'desconocido'}`
  );
}

export { BASE_PROMPT as DEFAULT_PROMPT };
