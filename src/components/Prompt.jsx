import { useEffect, useRef, useState } from 'react';
import { SUGGESTIONS } from '../data/products.js';

// Zona inferior del panel derecho: atajos (chips ghost), historial breve,
// input libre. Cambia a sans, baja el mono, mantiene la legibilidad.
// El botón Enviar usa verde corporativo — único punto de color del panel.

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
    <div className="border-t border-ink/10">
      {/* Atajos */}
      <div className="px-5 md:px-6 pt-6 pb-4 border-b border-ink/5">
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-mute mb-3">
          Atajos · iteración rápida
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => send(s)}
              className="font-sans text-[10px] uppercase tracking-[0.22em] border border-ink/30 px-3 py-1.5 text-ink hover:bg-ink hover:text-cream disabled:opacity-40 transition-colors"
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
              <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-mute mr-2">
                {m.role === 'user' ? 'Tú' : 'IA'}
              </span>
              <span className={`font-sans text-[13px] md:text-sm text-ink ${m.role === 'user' ? '' : 'italic'}`}>
                {m.text}
              </span>
            </div>
          ))}
          {pending && (
            <div className="mt-2 text-left">
              <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-mute mr-2">IA</span>
              <span className="font-sans text-sm italic text-mute animate-pulse">
                Calculando…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="px-5 md:px-6 py-5 border-t border-ink/15">
        <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-mute mb-2">
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
            placeholder='Ej: "Maceteros grises"'
            className="flex-1 min-w-0 bg-transparent border border-ink/30 px-3 py-2.5 font-sans text-[15px] italic text-ink placeholder:text-mute placeholder:opacity-60 focus:outline-none focus:border-ink disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!text.trim() || pending}
            aria-label="Enviar"
            className="border border-ink border-l-0 px-4 py-2.5 font-sans text-[12px] uppercase tracking-[0.22em] text-cream bg-accent hover:bg-accent/90 disabled:opacity-30 transition-colors"
          >
            ↩
          </button>
        </div>
      </div>
    </div>
  );
}
