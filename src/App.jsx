import { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Result from './components/Result.jsx';
import { INITIAL_PRODUCTS } from './data/products.js';
import { mockRefine } from './lib/matchAndRespond.js';
import { callMinimax, getAIConfig, getImageConfig } from './lib/minimax.js';
import { generateAfter } from './lib/image.js';

// Estado de configuración de APIs (lee import.meta.env una sola vez).
const AI_CFG = getAIConfig();
const IMG_CFG = getImageConfig();
const LLM_LABEL = AI_CFG.mode === 'proxy' ? 'Proxy IA' : 'MiniMax';

export default function App() {
  const [stage, setStage] = useState('hero');            // 'hero' | 'result'
  const [lines, setLines] = useState(INITIAL_PRODUCTS);
  const [messages, setMessages] = useState([]);          // [{role, text, ts}]
  const [pending, setPending] = useState(false);
  const [beforeSrc, setBeforeSrc] = useState(null);      // dataURL del usuario
  const [afterSrc, setAfterSrc] = useState(null);        // generada por la API

  const goHero = useCallback(() => setStage('hero'), []);

  // --- Carga de foto del usuario -----------------------------------------
  const handleFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setBeforeSrc(dataUrl);
      setStage('result');

      // Regenera el "después" si la API de imagen está disponible.
      if (IMG_CFG.enabled) {
        try {
          setPending(true);
          const url = await generateAfter(dataUrl);
          if (url) setAfterSrc(url);
        } catch (err) {
          console.warn('Image API falló, se mantiene el mock:', err);
        } finally {
          setPending(false);
        }
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDemo = useCallback(() => setStage('result'), []);

  // --- Mutadores del recibo ---------------------------------------------
  const addLine = (line) => setLines(curr => {
    const existing = curr.find(l => l.id === line.id);
    if (existing) {
      return curr.map(l => l.id === line.id
        ? { ...l, qty: l.qty + (line.qty || 1) }
        : l);
    }
    return [...curr, { ...line, qty: line.qty || 1 }];
  });

  const replaceLine = (id, newLine) => setLines(curr => {
    const target = curr.find(l => l.id === id);
    const others = curr.filter(l => l.id !== id);
    return [
      ...others,
      { ...newLine, qty: newLine.qty ?? target?.qty ?? 1 },
    ];
  });

  const addQty = (id, by = 1) => setLines(curr =>
    curr.map(l => l.id === id ? { ...l, qty: Math.max(1, l.qty + by) } : l)
  );

  const removeLine = (id) => setLines(curr => curr.filter(l => l.id !== id));

  // --- Prompt (texto o atajo) -------------------------------------------
  const handlePrompt = useCallback(async (input) => {
    const userMsg = { role: 'user', text: input, ts: Date.now() };
    setMessages(m => [...m, userMsg]);
    setPending(true);

    let response;
    try {
      if (AI_CFG.enabled) {
        response = await callMinimax({
          prompt: input,
          currentLines: lines,
          beforeImage: beforeSrc,
        });
      } else {
        await new Promise(r => setTimeout(r, 550));   // simula latencia
        response = mockRefine(input, lines);
      }
    } catch (err) {
      console.error(err);
      response = {
        reply: 'No he podido conectar con el modelo. Inténtalo de nuevo.',
        action: null,
      };
    }

    if (response.action) {
      switch (response.action.type) {
        case 'ADD':      addLine(response.action.line); break;
        case 'REPLACE':  replaceLine(response.action.id, response.action.line); break;
        case 'ADD_QTY':  addQty(response.action.id, response.action.by || 1); break;
        case 'REMOVE':   removeLine(response.action.id); break;
      }
    }
    setMessages(m => [...m, { role: 'ai', text: response.reply, ts: Date.now() }]);
    setPending(false);
  }, [lines, beforeSrc]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header stage={stage} onHome={goHero} />
      <main className="flex-1 flex flex-col min-h-0">
        {stage === 'hero' ? (
          <Hero onDemo={handleDemo} onFile={handleFile} />
        ) : (
          <Result
            lines={lines}
            onPrompt={handlePrompt}
            messages={messages}
            pending={pending}
            beforeSrc={beforeSrc}
            afterSrc={afterSrc}
            onReset={goHero}
          />
        )}
      </main>
      <footer className="border-t border-ink/10 px-4 md:px-8 py-3 font-sans text-[10px] uppercase tracking-[0.22em] text-mute flex flex-wrap gap-x-6 gap-y-1 justify-between">
        <span>Es-Vert SL · {new Date().getFullYear()}</span>
        <span>
          {AI_CFG.enabled
            ? `Conectado · ${LLM_LABEL} · ${AI_CFG.mode}`
            : 'Demo · datos mock'}
          {IMG_CFG.enabled ? ' + Image API' : ''}
        </span>
        <span>{lines.length} SKUs · presupuesto vivo</span>
      </footer>
    </div>
  );
}
