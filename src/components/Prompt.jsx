import { useEffect, useRef, useState } from 'react';
import { SUGGESTIONS } from '../data/products.js';

// Zona inferior del panel derecho: atajos + historial breve + input libre.
// El historial se recorta a las últimas 4 entradas para no comerse la UI.

export default function Prompt({ onSubmit, messages, pending }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const send = (raw) => {
    const value = (raw ?? text).trim();
    if (!value || pending) return;
    setText('');
    onSubmit(value);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const recent = messages.slice(-4);

  return (
    <div className="border-t border-ink">
      {/* Atajos */}
      <div className="px-5 md:px-6 pt-5 pb-3 border-b border-ink/15">
        <p className="mono text-[10px] uppercase tracking-[0.25em] mb-3 opacity-70">
          Atajos · iteración rápida
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => send(s)}
              className="mono text-[10px] uppercase tracking-[0.2em] border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper disabled:opacity-40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Historial breve */}
      {(recent.length > 0 || pending) && (
        <div
          ref={scrollRef}
          className="px-5 md:px-6 py-3 max-h-[140px] overflow-y-auto"
        >
          {recent.map((m, i) => (
            <div
              key={`${m.ts}-${i}`}
              className={`mt-2 first:mt-0 ${m.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <span className="mono text-[9px] uppercase tracking-[0.28em] opacity-50 mr-2">
                {m.role === 'user' ? 'Tú' : 'IA'}
              </span>
              <span className={`font-serif text-[13px] md:text-sm ${m.role === 'user' ? '' : 'italic'}`}>
                {m.text}
              </span>
            </div>
          ))}
          {pending && (
            <div className="mt-2 text-left">
              <span className="mono text-[9px] uppercase tracking-[0.28em] opacity-50 mr-2">IA</span>
              <span className="font-serif text-sm italic opacity-60 animate-pulse">
                Calculando…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="px-5 md:px-6 py-4 border-t border-ink">
        <p className="mono text-[10px] uppercase tracking-[0.25em] mb-2 opacity-70">
          ¿Quieres cambiar algo?
        </p>
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            placeholder='Ej: "Pon maceteros grises"'
            className="flex-1 min-w-0 bg-transparent border border-ink px-3 py-2.5 font-serif text-base italic placeholder:opacity-40 focus:outline-none focus:bg-ink focus:text-paper focus:placeholder:text-paper/30 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!text.trim() || pending}
            aria-label="Enviar"
            className="border border-ink border-l-0 px-4 py-2.5 mono text-[12px] uppercase tracking-[0.2em] hover:bg-ink hover:text-paper disabled:opacity-30 transition-colors"
          >
            ↩
          </button>
        </div>
      </div>
    </div>
  );
}
