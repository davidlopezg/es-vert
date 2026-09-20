import { useEffect, useRef, useState } from 'react';
import { SUGGESTIONS } from '../data/products.js';

// Prompt denso: chips en una sola fila cuando caben, historial
// más compacto, input sin aire vacío. Padding recortado.

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

  const recent = messages.slice(-6);

  return (
    <div className="border-t border-ink/15 bg-cream">

      {/* Atajos — un solo grid horizontal */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
            Atajos
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
            ⌘ intro
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => send(s)}
              className="font-mono text-[10px] uppercase tracking-[0.22em] border border-ink/30 px-2.5 py-1.5 text-ink hover:bg-ink hover:text-cream disabled:opacity-40 transition-colors"
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
          className="px-5 py-2 max-h-[120px] overflow-y-auto border-y border-ink/10"
        >
          {recent.map((m, i) => (
            <div
              key={`${m.ts}-${i}`}
              className={`py-1 flex gap-2 items-baseline ${m.role === 'user' ? 'flex-row-reverse text-right' : ''}`}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute shrink-0">
                {m.role === 'user' ? 'Tú' : 'IA'}
              </span>
              <span className={`font-sans text-[13px] leading-snug text-ink ${m.role === 'user' ? 'italic' : ''}`}>
                {m.text}
              </span>
            </div>
          ))}
          {pending && (
            <div className="py-1 flex gap-2 items-baseline">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute shrink-0">IA</span>
              <span className="font-sans text-[13px] italic text-mute animate-pulse">
                Calculando…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-3">
        <label htmlFor="prompt-input" className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute block mb-1.5">
          ¿Quieres cambiar algo?
        </label>
        <div className="flex">
          <input
            id="prompt-input"
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            placeholder='Ej: "Maceteros grises"'
            className="flex-1 min-w-0 bg-transparent border border-ink/30 px-3 py-2 font-sans text-[14px] italic text-ink placeholder:text-mute placeholder:opacity-60 focus:outline-none focus:border-ink disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!text.trim() || pending}
            aria-label="Enviar"
            className="font-mono text-[11px] uppercase tracking-[0.22em] border border-ink border-l-0 px-4 py-2 bg-ink text-cream hover:bg-ink/90 disabled:opacity-30 transition-colors"
          >
            ↩
          </button>
        </div>
      </div>
    </div>
  );
}
