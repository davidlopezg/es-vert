// Catálogo seed y placeholders visuales.
// Cuando se conecte al LLM real, estos productos sirven como ancla de
// consistencia: el modelo debería mantener coherencia con estas SKUs.

export const INITIAL_PRODUCTS = [
  { id: 'pergola-kave',      name: 'Pérgola Madera Kave Home', qty: 1,  price: 1250.00 },
  { id: 'jardinera-stone',   name: 'Jardinera Stone · Gris',   qty: 2,  price:   90.00 },
  { id: 'olivo-vidri',       name: 'Olivo Vidri · Ø 40 cm',    qty: 3,  price:   65.00 },
  { id: 'suelo-iroko',       name: 'Suelo Iroko · m²',        qty: 12, price:   78.00 },
];

// Atajos del prompt: se muestran como chips en el panel derecho.
export const SUGGESTIONS = [
  'Maceteros grises',
  'Cambiar suelo',
  'Más verde',
  'Añadir iluminación',
  'Quitar pérgola',
];

// Imágenes de demo (Antes/Después). Sustitúyelas por renders generados
// reales cuando el adaptador de imagen esté conectado.
export const IMAGES = {
  before: 'https://picsum.photos/seed/esvert-terraza-vacia/1600/1100',
  after:  'https://picsum.photos/seed/esvert-terraza-diseno/1600/1100',
};

// Formateador monetario único (estilo editorial es-ES).
export const eur = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
