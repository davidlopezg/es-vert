import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Menu from './components/Menu.jsx';
import Hero from './components/Hero.jsx';
import Result from './components/Result.jsx';
import Footer from './components/Footer.jsx';
import DiagnosticPill from './components/DiagnosticPill.jsx';
import { INITIAL_PRODUCTS } from './data/products.js';
import { mockRefine } from './lib/matchAndRespond.js';
import { callMinimax, getAIConfig } from './lib/minimax.js';
import { generateAfter, buildImagePrompt } from './lib/image.js';

const AI_CFG = getAIConfig();
const LLM_LABEL = AI_CFG.mode === 'proxy' ? 'Proxy IA' : 'MiniMax';
const FOOTER_STATUS = AI_CFG.enabled
  ? `Conectado · ${LLM_LABEL} · ${AI_CFG.mode}`
  : 'Demo · datos mock · imagen IA';

function applyAction(lines, action) {
  switch (action.type) {
    case 'ADD': {
      const ex = lines.find(l => l.id === action.line.id);
      if (ex) return lines.map(l => l.id === action.line.id
        ? { ...l, qty: l.qty + (action.line.qty || 1) }
        : l);
      return [...lines, { ...action.line, qty: action.line.qty || 1 }];
    }
    case 'REPLACE': {
      const target = lines.find(l => l.id === action.id);
      const others = lines.filter(l => l.id !== action.id);
      return [
        ...others,
        { ...action.line, qty: action.line.qty ?? target?.qty ?? 1 },
      ];
    }
    case 'ADD_QTY':
      return lines.map(l => l.id === action.id
        ? { ...l, qty: Math.max(1, l.qty + (action.by || 1)) }
        : l);
    case 'REMOVE':
      return lines.filter(l => l.id !== action.id);
    default:
      return lines;
  }
}

export default function App() {
  const [stage, setStage] = useState('home');
  const [lines, setLines] = useState(INITIAL_PRODUCTS);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [beforeSrc, setBeforeSrc] = useState(null);
  const [afterSrc, setAfterSrc] = useState(null);
  const [genError, setGenError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const regenIdRef = useRef(0);
  const inflightIdRef = useRef(0);

  // Diagnóstico: qué providers están configurados en este build.
  useEffect(() => {
    const env = import.meta.env || {};
    console.log('[Es-Vert · config]', {
      llm: AI_CFG.enabled
        ? `${LLM_LABEL} · ${AI_CFG.mode}`
        : 'mock (sin VITE_MINIMAX_API_KEY ni VITE_AI_PROXY_URL)',
      imageHF: env.VITE_HUGGINGFACE_TOKEN ? 'ON' : 'off',
      imageCustom:
        env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL
          ? 'ON' : 'off',
      imageDefault: 'Pollinations (1 cola por IP, tier anónimo)',
    });
  }, []);

  const goHome = useCallback(() => setStage('home'), []);

  const handleFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setBeforeSrc(dataUrl);
      setAfterSrc(null);              // limpiamos el "antes" stale
      setGenError(null);              // limpiamos errores previos
      setStage('detalle');

      const myId = ++inflightIdRef.current;
      try {
        setPending(true);
        const url = await generateAfter(dataUrl);
        if (myId === inflightIdRef.current && url) {
          setAfterSrc(url);
          setGenError(null);
        }
      } catch (err) {
        if (myId === inflightIdRef.current) {
          setGenError(err.message || String(err));
          console.warn('[Es-Vert] handleFile:', err);
        }
      } finally {
        if (myId === inflightIdRef.current) setPending(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDemo = useCallback(async () => {
    setStage('detalle');
    setAfterSrc(null);
    setGenError(null);
    const myId = ++inflightIdRef.current;
    try {
      setPending(true);
      const url = await generateAfter(null);
      if (myId === inflightIdRef.current && url) setAfterSrc(url);
    } catch (err) {
      if (myId === inflightIdRef.current) {
        setGenError(err.message || String(err));
        console.warn('[Es-Vert] handleDemo:', err);
      }
    } finally {
      if (myId === inflightIdRef.current) setPending(false);
    }
  }, []);

  const regenerateAfter = useCallback(async (currentLines) => {
    if (!beforeSrc) return;
    const myId = ++regenIdRef.current;
    setGenError(null);
    try {
      setPending(true);
      const prompt = buildImagePrompt(currentLines);
      const url = await generateAfter(beforeSrc, { prompt });
      if (myId === regenIdRef.current && url) {
        setAfterSrc(url);
        setGenError(null);
      }
    } catch (err) {
      if (myId === regenIdRef.current) {
        setGenError(err.message || String(err));
        console.warn('[Es-Vert] regen:', err);
      }
    } finally {
      if (myId === regenIdRef.current) setPending(false);
    }
  }, [beforeSrc]);

  const handlePrompt = useCallback(async (payload) => {
    const { text, attachments } = payload;
    setMessages(m => [
      ...m,
      { role: 'user', text: text || ' ', attachments: attachments || [], ts: Date.now() },
    ]);
    setPending(true);

    let response;
    try {
      if (AI_CFG.enabled) {
        response = await callMinimax({
          prompt: text,
          currentLines: lines,
          beforeImage: beforeSrc,
          attachments,
        });
      } else {
        await new Promise(r => setTimeout(r, 600));
        response = mockRefine(text || '', lines);
      }
    } catch (err) {
      console.error(err);
      response = { reply: 'No he podido conectar con el modelo. Inténtalo de nuevo.', action: null };
    }

    let mutatedLines = lines;
    if (response.action) {
      mutatedLines = applyAction(lines, response.action);
      setLines(mutatedLines);
    }

    setMessages(m => [...m, { role: 'ai', text: response.reply, ts: Date.now() }]);
    setPending(false);

    if (response.action && beforeSrc) {
      regenerateAfter(mutatedLines);
    }
  }, [lines, beforeSrc, regenerateAfter]);

  const handleReservar = useCallback(() => {
    const subject = encodeURIComponent('Es-Vert · Solicitud de diseño 3D');
    const body = encodeURIComponent(
      `Hola,\n\nQuiero continuar con mi diseño.\n\nPresupuesto borrador:\n` +
      lines.map(l => `· ${l.qty}× ${l.name} — ${(l.price * l.qty).toFixed(2)} €`).join('\n') +
      `\n\nTotal estimado: ${lines.reduce((s, l) => s + l.price * l.qty, 0).toFixed(2)} €`
    );
    window.location.href = `mailto:hola@es-vert.com?subject=${subject}&body=${body}`;
  }, [lines]);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      <Header
        stage={stage}
        onHome={goHome}
        onMenu={() => setMenuOpen(true)}
      />

      <main className="flex-1 flex flex-col min-h-0">
        {stage === 'home' ? (
          <Hero onDemo={handleDemo} onFile={handleFile} />
        ) : (
          <Result
            lines={lines}
            onPrompt={handlePrompt}
            messages={messages}
            pending={pending}
            beforeSrc={beforeSrc}
            afterSrc={afterSrc}
            onReset={goHome}
            onReservar={handleReservar}
            onRetryImage={() => regenerateAfter(lines)}
            genError={genError}
          />
        )}
      </main>

      <Footer status={FOOTER_STATUS} />

      <DiagnosticPill />

      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
