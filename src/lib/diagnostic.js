// Estado de providers a partir de import.meta.env. Solo expone booleanos,
// nunca las claves. Sirve para alimentar el DiagnosticPill y el menu.

export function getDiagnostic() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const llm         = !!(env.VITE_MINIMAX_API_KEY || env.VITE_AI_PROXY_URL);
  const llmMode     = env.VITE_AI_PROXY_URL
    ? 'proxy'
    : (env.VITE_MINIMAX_API_KEY ? 'direct' : 'mock');
  const hf          = !!env.VITE_HUGGINGFACE_TOKEN;
  const together    = !!env.VITE_TOGETHER_API_KEY;
  const customImage = !!(
    env.VITE_IMAGE_API_URL &&
    env.VITE_IMAGE_API_KEY &&
    env.VITE_IMAGE_MODEL
  );

  // Estado resumido para el pill (4 chars máximo OK + 4 of OFF)
  const hasAny = llm || hf || together || customImage;
  return {
    isDev:        !!env.DEV,
    llm,
    llmMode,
    hf,
    together,
    customImage,
    hasAny,
    ok: hf || together || customImage, // alguna imagen real cargada
  };
}

export function diagnosticText(d = getDiagnostic()) {
  return [
    `Modo: ${d.isDev ? 'Dev local' : 'Producción'}`,
    `LLM: ${d.llm ? d.llmMode : 'mock'}`,
    `HF: ${d.hf ? 'ON' : 'off'}`,
    `Together: ${d.together ? 'ON' : 'off'}`,
    `Custom: ${d.customImage ? 'ON' : 'off'}`,
  ].join(' · ');
}
