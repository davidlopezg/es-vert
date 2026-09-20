// Respuestas pre-canned que usa el modo DEMO cuando no hay claves LLM.
// Mapea关键词s en lenguaje natural a acciones sobre el recibo +
// una réplica editorial corta.

// Catálogo extendido (referencia, no cargado en el estado inicial).
const CATALOG = {
  maceta:        { id: 'macetero-gris',    name: 'Macetero Cemento · Gris',     price:  45 },
  macetero:      { id: 'macetero-gris',    name: 'Macetero Cemento · Gris',     price:  45 },
  travertino:    { id: 'suelo-travertino', name: 'Suelo Travertino · m²',       price:  95 },
  madera:        { id: 'suelo-iroko',      name: 'Suelo Iroko · m²',            price:  78 },
  iluminacion:   { id: 'kit-led-calido',   name: 'Kit Iluminación LED Cálida',  price: 320 },
  luz:           { id: 'kit-led-calido',   name: 'Kit Iluminación LED Cálida',  price: 320 },
  sofa:          { id: 'sofateka',         name: 'Sofá Tika · Teca',            price: 890 },
  mueble:        { id: 'conjunto-teka',    name: 'Conjunto Tika · Teca',        price: 890 },
  higuera:       { id: 'higuera',          name: 'Higuera · Ø 50 cm',           price: 145 },
  hibiscus:      { id: 'hibiscus',         name: 'Hibiscus · 80 cm',            price:  72 },
};

// Acciones reutilizables ----------------------------------------------------
const A = {
  addMaceterosGrises:  { type: 'ADD',  line: { id: 'macetero-gris',  name: 'Macetero Cemento · Gris',  qty: 4, price:  45 } },
  addMasVerde:         { type: 'ADD',  line: { id: 'higuera',        name: 'Higuera · Ø 50 cm',       qty: 1, price: 145 } },
  replaceSuelo:        { type: 'REPLACE', id: 'suelo-iroko',    line: { id: 'suelo-travertino', name: 'Suelo Travertino · m²', qty: 12, price:  95 } },
  addIluminacion:      { type: 'ADD',  line: { id: 'kit-led-calido', name: 'Kit Iluminación LED Cálida', qty: 1, price: 320 } },
  addMobiliario:       { type: 'ADD',  line: { id: 'conjunto-teka',  name: 'Conjunto Tika · Teca',   qty: 1, price: 890 } },
  removePergola:       { type: 'REMOVE', id: 'pergola-kave' },
};

function pick(input, keywords) {
  return keywords.some(k => input.includes(k));
}

export function mockRefine(input, currentLines) {
  const t = input.toLowerCase().trim();

  // Saludos y pequeñas cortesías
  if (/^(hola|buenas|buenos dias|buenas tardes|hey)\b/.test(t)) {
    return { reply: 'Hola. Pídeme un cambio concreto: suelo, verde, pérgola, luz o mobiliario.', action: null };
  }

  // Cambios estructurales
  if (pick(t, ['quita', 'quitar', 'sin ', 'eliminar', 'fuera']) && pick(t, ['pergola', 'pérgola'])) {
    return {
      reply: 'Retiro la pérgola del diseño. Quedará un espacio más abierto,我会光照 el presupuesto en consecuencia.',
      action: A.removePergola,
    };
  }
  if (pick(t, ['macetero', 'maceta']) && pick(t, ['gris', 'grises', 'cemento'])) {
    return {
      reply: 'Añado 4 maceteros gris cemento en composición triangular para dar peso visual al lateral este.',
      action: A.addMaceterosGrises,
    };
  }
  if (pick(t, ['suelo', 'pavimento']) && pick(t, ['cambia', 'cambiar', 'sustituye', 'más', 'otro'])) {
    return {
      reply: 'Sustituyo el suelo iroko por travertino cálido; el m² se mantiene, recalculo el subtotal.',
      action: A.replaceSuelo,
    };
  }
  if (pick(t, ['verde', 'planta', 'plantas', 'vegetacion', 'vegetación', 'más verde'])) {
    const hasHiguera = currentLines.some(l => l.id === 'higuera');
    return {
      reply: hasHiguera
        ? 'Refuerzo la masa verde con dos unidades más de higuera y un set de hibiscus.'
        : 'Refuerzo la masa vegetal: añado higuera central y dos hibiscus en flor.',
      action: hasHiguera
        ? { type: 'ADD_QTY', id: 'higuera', by: 2 }
        : A.addMasVerde,
    };
  }
  if (pick(t, ['luz', 'luces', 'ilumin', 'led'])) {
    return {
      reply: 'Añado kit LED cálido bajo pérgola y dos balizas en el sendero de acceso.',
      action: A.addIluminacion,
    };
  }
  if (pick(t, ['pergola', 'pérgola']) && pick(t, ['añad', 'añade', 'otra', 'segunda', 'suma'])) {
    return {
      reply: 'Añado una segunda pérgola en el lateral oeste para generar sombra cruzada.',
      action: { type: 'ADD_QTY', id: 'pergola-kave', by: 1 },
    };
  }
  if (pick(t, ['mueble', 'muebles', 'sofá', 'sofa', 'mesa', 'sentarse'])) {
    return {
      reply: 'Incluyo un conjunto de exterior teca + dos butacas. El presupuesto sube, pero el espacio gana uso.',
      action: A.addMobiliario,
    };
  }

  // Fallback honesto (también editorial)
  return {
    reply: 'No localizo ese cambio en el catálogo seed. Prueba: “maceteros grises”, “cambiar suelo”, “más verde”, “añadir iluminación”.',
    action: null,
  };
}
