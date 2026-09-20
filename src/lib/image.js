// =============================================================
// Adapter de generación de imagen · cadena con fallback garantizado.
// =============================================================
//   1. HuggingFace (si VITE_HUGGINGFACE_TOKEN + foto subida) — img2img
//      real vía router.huggingface.co. SD 2.1 con `strength`.
//   2. Replicate (si VITE_REPLICATE_API_TOKEN + foto subida) — img2img
//      real, CORS-enabled. Solo si el usuario lo configura.
//   3. Together.ai img2img (si VITE_TOGETHER_API_KEY + foto subida) —
//      SDXL con `image` + `image_strength`. Mismo endpoint que T2I.
//   4. Custom provider (Replicate / fal / Stability) — solo si
//      VITE_IMAGE_API_URL/KEY/MODEL están definidos.
//   5. Si hay foto subida y nadie pudo transformarla: ERROR HONESTO.
//   6. Solo en modo demo (sin foto): Together.ai T2I → Pollinations → Stock.

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

// Redimensiona y recomprime la foto ANTES de mandarla a cualquier provider.
// 10 MB de subida -> 13 MB en base64 -> HF/Together/Reject (límite típico ~5 MB).
// Salida: JPEG max 1024 px en el lado largo, calidad 0.85 (~150-300 KB).
async function prepareForApi(dataUrl, maxSide = 1024, quality = 0.85) {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const longest = Math.max(width, height);
        if (longest > maxSide) {
          const r = maxSide / longest;
          width  = Math.round(width  * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

let lastSource = 'idle';
export function getLastImageSource() { return lastSource; }

// ---- 1) Hugging Face Inference (router.huggingface.co · SD 2.1) -------
async function huggingFace(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const token = env.VITE_HUGGINGFACE_TOKEN;
  if (!token) throw new Error('HF: VITE_HUGGINGFACE_TOKEN no definido.');
  if (!beforeDataUrl) throw new Error('HF: requiere foto subida.');

  // SD 2.1 implementa img2img real con `strength`. SDXL-base en Inference API es T2I puro.
  const model = opts.model
    || env.VITE_HUGGINGFACE_MODEL
    || 'stabilityai/stable-diffusion-2-1';

  const base64 = beforeDataUrl.split(',')[1];

  // Endpoint migrado a router.huggingface.co (api-inference.* está deprecado desde 2024).
  const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
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

// ---- 3a) Together.ai img2img (browser-direct, USA tu foto) -------------
//    Mismo endpoint que el T2I pero con `image` (data URL) + `image_strength`.
//    SDXL hace img2img de verdad: tu foto entra como conditioning, prompt la
//    transforma. ~$0.005/imagen con créditos Together.
async function togetherImg2Img(beforeDataUrl, prompt, opts = {}) {
  const env = import.meta.env || {};
  const apiKey = env.VITE_TOGETHER_API_KEY;
  if (!apiKey) throw new Error('Together-i2i: VITE_TOGETHER_API_KEY no definido.');
  if (!beforeDataUrl) throw new Error('Together-i2i: requiere foto subida.');

  const model = env.VITE_TOGETHER_IMG2IMG_MODEL
    || 'stabilityai/stable-diffusion-xl-base-1.0';

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
      image: beforeDataUrl,
      image_strength: 0.35,           // bajo = conserva más la foto original
      steps: 30,
      n: 1,
      width:  opts.width  || 1024,
      height: opts.height ||  768,
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Together-i2i ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  if (typeof data === 'string') return data;
  if (Array.isArray(data?.data) && data.data[0]?.url) return data.data[0].url;
  return data?.url || (Array.isArray(data?.data) ? data.data[0] : null) || '';
}

// ---- 3b) Together.ai T2I (browser-direct, NO usa tu foto) ----------------
//    Solo se usa como último recurso si NO hay foto subida (modo demo).
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

// ---- 5b) Pollinations img2img (SIN clave, USA tu foto) ------------------
//    Único provider img2img que funciona sin registro, sin token, sin
//    tarjeta. POST con la imagen en el body, prompt en la URL. Tier
//    gratuito con rate-limit por IP — si se pasa, lanza y cae al T2I.
async function pollinationsImg2Img(beforeDataUrl, prompt, opts = {}) {
  if (!beforeDataUrl) throw new Error('Pollinations-i2i: requiere foto subida.');
  const w = opts.width  || 1024;
  const h = opts.height ||  768;
  const strength = Number(opts.strength ?? 0.5);
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&model=flux&seed=${seed}&nologo=true`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: beforeDataUrl, strength }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Pollinations-i2i ${res.status}: ${txt.slice(0, 200) || 'forbidden'}`);
  }

  // Si devuelve la imagen directa (image/*) la reempaquetamos como data URL.
  const ct = res.headers.get('content-type') || '';
  if (ct.startsWith('image/')) {
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result);
      r.onerror = () => reject(new Error('Pollinations-i2i: no se pudo codificar'));
      r.readAsDataURL(blob);
    });
  }

  // Si devuelve JSON con URL, la devolvemos tal cual.
  const data = await res.json().catch(() => null);
  if (typeof data === 'string') return data;
  return data?.url || data?.image || '';
}

// ---- Stable Horde (gratis, anónimo, sin registro · img2img real) ------
//    CORS-enabled, distributed computing. apikey '0000000000' = anónimo.
//    Más lento que el resto porque los workers voluntarios eligen jobs
//    por kudos; los anónimos van al final de la cola (1-10 min típico).
async function stableHorde(beforeDataUrl, prompt, opts = {}) {
  if (!beforeDataUrl) throw new Error('StableHorde: requiere foto subida.');
  const env = import.meta.env || {};
  const apiUrl = env.VITE_STABLE_HORDE_URL || 'https://stablehorde.net/api/v2';
  const apiKey = env.VITE_STABLE_HORDE_KEY || '0000000000';   // anónimo
  const base64 = beforeDataUrl.split(',')[1];
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const w = opts.width  || 1024;
  const h = opts.height ||  768;

  // 1) Submit
  const submitRes = await fetch(`${apiUrl}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      prompt,
      params: {
        sampler_name: 'k_dpmpp_2m',
        cfg_scale: 7.5,
        denoising_strength: 0.55,
        width: w,
        height: h,
        steps: 25,
        n: 1,
        post_processing: [],
        karras: true,
      },
      source_image: base64,
      source_processing: 'img2img',
      models: ['AlbedoBase XL (SDXL)'],
    }),
  });

  if (!submitRes.ok) {
    const txt = await submitRes.text().catch(() => '');
    throw new Error(`submit ${submitRes.status}: ${txt.slice(0, 200)}`);
  }

  const submit = await submitRes.json();
  const id = submit.id;
  if (!id) throw new Error(`sin id en respuesta: ${JSON.stringify(submit).slice(0, 150)}`);

  // 2) Poll hasta done o timeout (intervalo 4 s para no martillear la API)
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(4000);
    try {
      const checkRes = await fetch(`${apiUrl}/generate/check/${id}`);
      if (!checkRes.ok) continue;
      const check = await checkRes.json();
      if (check.done) break;
      if (typeof check.queue_position === 'number') {
        console.log(
          `[Es-Vert] StableHorde · cola ${check.queue_position} · ` +
          `${check.waiting ?? 0} esperando · ${check.processing ?? 0} procesando`
        );
      }
    } catch { /* blip de red, sigue */ }
  }

  if (Date.now() >= deadline) {
    throw new Error(`timeout ${Math.round(timeoutMs/1000)} s en cola`);
  }

  // 3) Recoger resultado
  const statusRes = await fetch(`${apiUrl}/generate/status/${id}`);
  if (!statusRes.ok) {
    throw new Error(`status ${statusRes.status}`);
  }
  const status = await statusRes.json();
  if (status.faulted) {
    throw new Error(`job falló: ${status.generations?.[0]?.gen_metadata ?? 'sin detalle'}`);
  }
  if (!status.generations || status.generations.length === 0) {
    throw new Error('sin generaciones en respuesta');
  }
  return status.generations[0].img;
}

// ---- Fallback local ----------------------------------------------------
//    Cuando TODOS los providers img2img fallan y el usuario subió foto,
//    generamos un placeholder honesto con Canvas: dice exactamente qué pasó
//    y cómo arreglarlo. Sin llamadas externas, instantáneo.
function makeFallbackImage(beforeDataUrl) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    // Fondo: gradiente cálido tipo crema (mismo lenguaje que la web)
    const grad = ctx.createLinearGradient(0, 0, 1024, 768);
    grad.addColorStop(0, '#fafaf8');
    grad.addColorStop(1, '#ece8df');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 768);

    // Asimetría: esquinas superiores con radius editorial
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 60); ctx.lineTo(60, 0); ctx.lineTo(1024, 0);
    ctx.lineTo(1024, 60); ctx.lineTo(0, 60);
    ctx.fill();

    // Banda editorial superior
    ctx.fillStyle = '#8D8375';
    ctx.fillRect(0, 0, 1024, 32);

    const drawText = () => {
      // Mini-foto del usuario arriba-izquierda (su contexto no se pierde)
      if (beforeDataUrl) {
        const img = new Image();
        img.onload = () => {
          const max = 180;
          const aspect = img.width / img.height;
          let tw = aspect >= 1 ? max : max * aspect;
          let th = aspect >= 1 ? max / aspect : max;
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 1;
          ctx.strokeRect(60, 80, tw, th);
          ctx.drawImage(img, 60, 80, tw, th);
          // Caption mono
          ctx.fillStyle = '#666666';
          ctx.font = '500 10px ui-monospace, "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText('Tu foto · subida correctamente', 60, 80 + th + 24);
          finish();
        };
        img.onerror = () => finish();
        img.src = beforeDataUrl;
      } else {
        finish();
      }
    };

    const finish = () => {
      // Mensaje principal: serif itálica (lenguaje editorial)
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'italic 600 52px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.fillText('Render no disponible', 512, 380);

      ctx.fillStyle = '#666666';
      ctx.font = '400 19px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.fillText('Los proveedores de IA gratuitos están bloqueados o saturados.', 512, 432);
      ctx.fillText('Tu foto se ha guardado — para ver la transformación:', 512, 462);

      // CTA mono verde (acento corporativo)
      ctx.fillStyle = '#53A548';
      ctx.font = '600 16px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText('REGENERA TU TOKEN DE HF · huggingface.co/settings/tokens', 512, 510);
      ctx.font = '400 13px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillStyle = '#888888';
      ctx.fillText('(gratis · 30 segundos · sin tarjeta)', 512, 534);

      // Meta esquina sup-der
      ctx.fillStyle = '#fafaf8';
      ctx.font = '500 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Es-Vert · fallback local · no se usó ninguna API', 994, 22);

      // Marco editorial (hairline)
      ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 1023, 767);

      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };

    drawText();
  });
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

  // Comprime la foto UNA vez antes de mandarla a cualquier provider.
  // 10 MB → base64 13 MB → rechazo por tamaño (HF, Together, Replicate).
  const preparedImg = beforeDataUrl
    ? await prepareForApi(beforeDataUrl)
    : null;

  const errors = [];   // acumulado de errores reales para mostrar al usuario

  // 1) HuggingFace
  if (env.VITE_HUGGINGFACE_TOKEN && beforeDataUrl) {
    try {
      const url = await huggingFace(preparedImg, prompt, opts);
      lastSource = 'huggingface';
      return url;
    } catch (e) {
      const msg = `HF ${e.message?.slice(0, 180) ?? 'error'}`;
      errors.push(msg);
      console.warn(`[Es-Vert] ${msg}`);
    }
  }

  // 2) Replicate — única opción browser-direct que hace img2img de verdad.
  if (env.VITE_REPLICATE_API_TOKEN && beforeDataUrl) {
    try {
      const url = await replicate(preparedImg, prompt, opts);
      lastSource = 'replicate';
      return url;
    } catch (e) {
      const msg = `Replicate ${e.message?.slice(0, 180) ?? 'error'}`;
      errors.push(msg);
      console.warn(`[Es-Vert] ${msg}`);
    }
  }

  // 3a) Together.ai img2img — USA la foto subida, mismo endpoint que T2I.
  if (env.VITE_TOGETHER_API_KEY && beforeDataUrl) {
    try {
      const url = await togetherImg2Img(preparedImg, prompt, opts);
      lastSource = 'together-img2img';
      return url;
    } catch (e) {
      const msg = `Together-i2i ${e.message?.slice(0, 180) ?? 'error'}`;
      errors.push(msg);
      console.warn(`[Es-Vert] ${msg}`);
    }
  }

  // 3b) Custom provider (img2img si antes + credenciales)
  if (env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL && beforeDataUrl) {
    try {
      const url = await custom(preparedImg, prompt, opts);
      lastSource = 'custom';
      return url;
    } catch (e) {
      const msg = `custom ${e.message?.slice(0, 180) ?? 'error'}`;
      errors.push(msg);
      console.warn(`[Es-Vert] ${msg}`);
    }
  }

  // 3c) Pollinations img2img — sin clave, USA la foto. Último intento
  //     img2img antes de tirar la toalla. Si falla por rate-limit / CORS
  //     cae al T2I de abajo (modo demo con la foto como contexto del prompt).
  if (beforeDataUrl) {
    try {
      const url = await pollinationsImg2Img(preparedImg, prompt, opts);
      lastSource = 'pollinations-img2img';
      return url;
    } catch (e) {
      const msg = `Pollinations-i2i ${e.message?.slice(0, 180) ?? 'error'}`;
      errors.push(msg);
      console.warn(`[Es-Vert] ${msg}`);
    }
  }

  // 3d) Stable Horde — img2img gratis, anónimo, sin clave. CORS-enabled.
  //     Apikey '0000000000' = anonymous, baja prioridad en la cola
  //     (1-10 min típico). Timeout duro 90 s para no dejar al usuario esperando.
  if (beforeDataUrl) {
    try {
      const url = await stableHorde(preparedImg, prompt, { ...opts, timeoutMs: 90_000 });
      lastSource = 'stable-horde';
      return url;
    } catch (e) {
      const msg = `StableHorde ${e.message?.slice(0, 180) ?? 'error'}`;
      errors.push(msg);
      console.warn(`[Es-Vert] ${msg}`);
    }
  }

  // 3e) Si hay foto subida y NADIE pudo hacer img2img, generamos un
  //     placeholder local honesto (sin llamadas externas, instantáneo).
  //     Mejor que un error que no lleva a nada: el usuario ve exactamente
  //     qué pasó y cómo arreglarlo en 30 segundos.
  if (beforeDataUrl) {
    lastSource = 'fallback-placeholder';
    console.warn(`[Es-Vert] Todos los providers img2img fallaron; usando fallback local. Errores: ${errors.join(' · ')}`);
    return await makeFallbackImage(preparedImg);
  }

  // 4) Together.ai T2I — SOLO modo demo (sin foto).
  if (env.VITE_TOGETHER_API_KEY) {
    try {
      const url = await together(prompt, opts);
      lastSource = 'together';
      return url;
    } catch (e) {
      console.warn(`[Es-Vert] Together (${e.message?.slice(0, 80)}) — siguiente.`);
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
