import { useEffect, useRef, useState } from 'react';
import { SUGGESTIONS } from '../data/products.js';

// Prompt chat con adjuntos de imagen. El usuario puede:
//   - Escribir texto libre ("pon maceteros grises")
//   - Adjuntar imágenes de productos (clip, drag&drop o paste)
//   - Combinar texto + imágenes
// Las imágenes se redimensionan client-side para no inflar el payload.

async function resizeImage(file, { max = 1024, q = 0.85 } = {}) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const ratio = Math.min(max / img.width, max / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return {
      dataUrl: canvas.toDataURL('image/jpeg', q),
      name: file.name,
      width: w,
      height: h,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function AttachmentChip({ a, onRemove }) {
  return (
    <div className="relative group">
      <img
        src={a.dataUrl}
        alt={a.name}
        className="w-14 h-14 object-cover border border-ink/30"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar imagen"
        className="absolute -top-1 -right-1 w-5 h-5 bg-ink text-cream font-mono text-[11px] flex items-center justify-center hover:bg-accent"
      >
        ✕
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-ink/85 text-cream px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {a.width}×{a.height}
      </div>
    </div>
  );
}

function HistoryThumb({ a }) {
  return (
    <img
      src={a.dataUrl}
      alt=""
      className="w-10 h-10 object-cover border border-ink/30"
    />
  );
}

const MAX_ATTACHMENTS = 3;

export default function Prompt({ onSubmit, messages, pending }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const addFiles = async (files) => {
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) return;
    const arr = Array.from(files || [])
      .filter(f => f.type?.startsWith('image/'))
      .slice(0, remaining);
    const imgs = await Promise.all(arr.map(f => resizeImage(f)));
    setAttachments(prev => [...prev, ...imgs]);
  };

  const removeAttachment = (i) =>
    setAttachments(prev => prev.filter((_, idx) => idx !== i));

  // Drag & drop al contenedor del input
  const onDropZone = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const send = (raw) => {
    const value = (raw ?? text).trim();
    if (pending) return;
    if (!value && attachments.length === 0) return;
    onSubmit({ text: value, attachments });
    setText('');
    setAttachments([]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const recent = messages.slice(-6);
  const canSend = (text.trim() || attachments.length > 0) && !pending;

  return (
    <div className="border-t border-ink/15 bg-cream">
      {/* Atajos */}
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

      {/* Historial */}
      {(recent.length > 0 || pending) && (
        <div
          ref={scrollRef}
          className="px-5 py-2 max-h-[160px] overflow-y-auto border-y border-ink/10"
        >
          {recent.map((m, i) => (
            <div
              key={`${m.ts}-${i}`}
              className={`py-2 flex gap-2 items-baseline ${
                m.role === 'user' ? 'flex-row-reverse text-right' : ''
              }`}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute shrink-0">
                {m.role === 'user' ? 'Tú' : 'IA'}
              </span>
              <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.attachments.map((a, j) => (
                      <HistoryThumb key={j} a={a} />
                    ))}
                  </div>
                )}
                {m.text && m.text !== ' ' && (
                  <span className={`font-sans text-[13px] leading-snug text-ink ${m.role === 'user' ? 'italic' : ''}`}>
                    {m.text}
                  </span>
                )}
              </div>
            </div>
          ))}
          {pending && (
            <div className="py-2 flex gap-2 items-baseline">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute shrink-0">IA</span>
              <span className="font-sans text-[13px] italic text-mute animate-pulse">
                Calculando…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-5 pt-3 pb-2 border-b border-ink/10">
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
              Adjuntos ({attachments.length}/{MAX_ATTACHMENTS})
            </span>
            <button
              type="button"
              onClick={() => setAttachments([])}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute hover:text-ink"
            >
              Quitar todos
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <AttachmentChip key={i} a={a} onRemove={() => removeAttachment(i)} />
            ))}
          </div>
        </div>
      )}

      {/* Input + drop zone */}
      <div
        className="px-5 py-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropZone}
      >
        <label
          htmlFor="prompt-input"
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute block mb-1.5"
        >
          ¿Quieres cambiar algo? · Adjunta fotos de productos si quieres
        </label>
        <div className="flex">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending || attachments.length >= MAX_ATTACHMENTS}
            aria-label="Adjuntar imagen"
            className="border border-ink/30 border-r-0 px-3 py-2 font-mono text-[14px] hover:bg-ink/5 disabled:opacity-40 transition-colors"
            title="Adjuntar imagen"
          >
            📎
          </button>
          <input
            id="prompt-input"
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            placeholder='Texto o pega una imagen'
            className="flex-1 min-w-0 bg-transparent border border-ink/30 px-3 py-2 font-sans text-[14px] italic text-ink placeholder:text-mute placeholder:opacity-60 focus:outline-none focus:border-ink disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!canSend}
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
