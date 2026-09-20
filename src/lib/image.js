// =============================================================
// Adapter de generación de imagen · tres niveles de calidad.
// =============================================================
//  1. Pollinations  →  cero-config, gratis, sin signup. T2I.
//                       Bueno para demo, no usa tu foto.
//  2. HuggingFace  →  free tier, SDXL, image-to-image real.
//                       Necesita token gratuito (sin tarjeta).
//  3. Custom       →  Replicate / fal.ai / Stability, lo que tengas.

const DEFAULT_PROMPT = [
  'Elegant contemporary Mediterranean terrace redesign',
  'wooden pergola with horizontal shade slats overhead',
  'large olive trees in minimalist cement planters',
  'warm iroko wood decking with linear grain pattern',
  'natural stone accent walls, subtle textures',
  'premium outdoor furniture in neutral tones',
  'golden hour late afternoon natural sunlight',
  'architectural editorial photography',
  'award-winning landscape design',
  'sharp focus, magazine quality, ultra detailed',
].join(', ');

// ---- 1) Pollinations (default, sin credenciales) ----------------------
//    https://pollinations.ai · Flux por defecto. Resultado directo
//    como URL — se mete en <img src>. Si falla la generación,
//    el componente cae al mock. Tarda 5-30 s según cola.
function pollinationsUrl(prompt, opts = {}) {
  const w = opts.width  || 1600;
  const h = opts.height || 1100;
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const params = new URLSearchParams({
    width: String(w),
    height: String(h),
    seed: String(seed),
    nologo: 'true',
    enhance: 'true',
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

// ---- 2) Hugging Face Inference (free tier; mejor calidad) ------------
//    Crea el token gratis (sin tarjeta) en
//    https://huggingface.co/settings/tokens
//    Modelo por defecto: stabilityai/stable-diffusion-xl-base-1.0
async function huggingFace(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const token = env.VITE_HUGGINGFACE_TOKEN;
  if (!token) throw new Error('VITE_HUGGINGFACE_TOKEN no definido.');
  if (!beforeDataUrl) throw new Error('HF requiere foto subida.');

  const model = opts.model
    || env.VITE_HUGGINGFACE_MODEL
    || 'stabilityai/stable-diffusion-xl-base-1.0';

  // HF acepta JSON con base64 limpio (sin prefijo `data:image/png;base64,`).
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

// ---- 3) Provider custom (Replicate, fal.ai, Stability, etc.) ---------
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
//    Devuelve siempre un string utilizable como <img src>:
//    URL de Pollinations, dataURL de HF/custom, o string vacío.
export async function generateAfter(beforeDataUrl, opts = {}) {
  const env = import.meta.env || {};
  const prompt = opts.prompt || DEFAULT_PROMPT;

  if (env.VITE_HUGGINGFACE_TOKEN && beforeDataUrl) {
    return huggingFace(beforeDataUrl, prompt, opts);
  }
  if (env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL && beforeDataUrl) {
    return custom(beforeDataUrl, prompt, opts);
  }
  // Default sin nada configurado — Pollinations.
  return pollinationsUrl(prompt, opts);
}

export { DEFAULT_PROMPT };
