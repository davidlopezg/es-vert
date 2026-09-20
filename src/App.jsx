import { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import Menu from './components/Menu.jsx';
import Hero from './components/Hero.jsx';
import Result from './components/Result.jsx';
import Footer from './components/Footer.jsx';
import { INITIAL_PRODUCTS } from './data/products.js';
import { mockRefine } from './lib/matchAndRespond.js';
import { callMinimax, getAIConfig, getImageConfig } from './lib/minimax.js';
import { generateAfter } from './lib/image.js';

const AI_CFG = getAIConfig();
const IMG_CFG = getImageConfig();
const LLM_LABEL = AI_CFG.mode === 'proxy' ? 'Proxy IA' : 'MiniMax';

const FOOTER_STATUS = AI_CFG.enabled
  ? `Conectado · ${LLM_LABEL} · ${AI_CFG.mode}${IMG_CFG.enabled ? ' + Image API' : ''}`
  : 'Demo · datos mock';

export default function App() {
  const [stage, setStage] = useState('hero');
  const [lines, setLines] = useState(INITIAL_PRODUCTS);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [beforeSrc, setBeforeSrc] = useState(null);
  const [afterSrc, setAfterSrc] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const goHero = useCallback(() => setStage('hero'), []);

  const handleFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setBeforeSrc(dataUrl);
      setStage('result');
      if (IMG_CFG.enabled) {
        try {
          setPending(true);
          const url = await generateAfter(dataUrl);
          if (url) setAfterSrc(url);
        } catch (err) {
          console.warn('Image API falló:', err);
        } finally {
          setPending(false);
        }
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDemo = useCallback(() => setStage('result'), []);

  // Mutadores del recibo (idénticos a v0.4.0)
  const addLine = (line) => setLines(curr => {
    const existing = curr.find(l => l.id === line.id);
    if (existing) return curr.map(l => l.id === line.id ? { ...l, qty: l.qty + (line.qty || 1) } : l);
    return [...curr, { ...line, qty: line.qty || 1 }];
  });
  const replaceLine = (id, newLine) => setLines(curr => {
    const target = curr.find(l => l.id === id);
    const others = curr.filter(l => l.id !== id);
    return [...others, { ...newLine, qty: newLine.qty ?? target?.qty ?? 1 }];
  });
  const addQty = (id, by = 1) => setLines(curr =>
    curr.map(l => l.id === id ? { ...l, qty: Math.max(1, l.qty + by) } : l)
  );
  const removeLine = (id) => setLines(curr => curr.filter(l => l.id !== id));

  const handlePrompt = useCallback(async (input) => {
    setMessages(m => [...m, { role: 'user', text: input, ts: Date.now() }]);
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
        await new Promise(r => setTimeout(r, 550));
        response = mockRefine(input, lines);
      }
    } catch (err) {
      console.error(err);
      response = { reply: 'No he podido conectar con el modelo. Inténtalo de nuevo.', action: null };
    }

    if (response.action) {
      switch (response.action.type) {
        case 'ADD':     addLine(response.action.line); break;
        case 'REPLACE': replaceLine(response.action.id, response.action.line); break;
        case 'ADD_QTY': addQty(response.action.id, response.action.by || 1); break;
        case 'REMOVE':  removeLine(response.action.id); break;
      }
    }
    setMessages(m => [...m, { role: 'ai', text: response.reply, ts: Date.now() }]);
    setPending(false);
  }, [lines, beforeSrc]);

  // Placeholder de conversión (envía a un mailto en producción).
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
        onHome={goHero}
        onMenu={() => setMenuOpen(true)}
      />

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
            onReservar={handleReservar}
          />
        )}
      </main>

      <Footer status={FOOTER_STATUS} />

      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
