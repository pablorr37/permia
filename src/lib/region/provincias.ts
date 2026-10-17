// Provincias argentinas para la región de la instalación (22-instalacion.md §2).
// Los bbox son rectángulos aproximados que contienen cada provincia; alcanzan para
// "toda la provincia" del plan plata (18-alcance.md) y el centro del mapa.

export interface Provincia {
  codigo: string;
  nombre: string;
  capital: { lat: number; lon: number };
  bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number };
}

export const PROVINCIA_POR_DEFECTO = "san-juan";

export const PROVINCIAS: readonly Provincia[] = [
  { codigo: "buenos-aires", nombre: "Buenos Aires", capital: { lat: -34.9214, lon: -57.9545 }, bbox: { latMin: -41.1, latMax: -33.2, lonMin: -63.4, lonMax: -56.6 } },
  { codigo: "caba", nombre: "Ciudad Autónoma de Buenos Aires", capital: { lat: -34.6037, lon: -58.3816 }, bbox: { latMin: -34.71, latMax: -34.52, lonMin: -58.54, lonMax: -58.33 } },
  { codigo: "catamarca", nombre: "Catamarca", capital: { lat: -28.4696, lon: -65.7795 }, bbox: { latMin: -30.1, latMax: -25.1, lonMin: -69.1, lonMax: -64.9 } },
  { codigo: "chaco", nombre: "Chaco", capital: { lat: -27.4512, lon: -58.9866 }, bbox: { latMin: -28.1, latMax: -24.0, lonMin: -63.4, lonMax: -58.3 } },
  { codigo: "chubut", nombre: "Chubut", capital: { lat: -43.3002, lon: -65.1023 }, bbox: { latMin: -46.0, latMax: -42.0, lonMin: -72.2, lonMax: -63.5 } },
  { codigo: "cordoba", nombre: "Córdoba", capital: { lat: -31.4201, lon: -64.1888 }, bbox: { latMin: -35.0, latMax: -29.5, lonMin: -65.8, lonMax: -61.8 } },
  { codigo: "corrientes", nombre: "Corrientes", capital: { lat: -27.4692, lon: -58.8306 }, bbox: { latMin: -30.8, latMax: -27.2, lonMin: -59.7, lonMax: -55.6 } },
  { codigo: "entre-rios", nombre: "Entre Ríos", capital: { lat: -31.7319, lon: -60.5238 }, bbox: { latMin: -34.1, latMax: -30.1, lonMin: -60.8, lonMax: -57.8 } },
  { codigo: "formosa", nombre: "Formosa", capital: { lat: -26.1775, lon: -58.1781 }, bbox: { latMin: -26.9, latMax: -22.0, lonMin: -62.4, lonMax: -57.5 } },
  { codigo: "jujuy", nombre: "Jujuy", capital: { lat: -24.1858, lon: -65.2995 }, bbox: { latMin: -24.6, latMax: -21.7, lonMin: -67.2, lonMax: -64.1 } },
  { codigo: "la-pampa", nombre: "La Pampa", capital: { lat: -36.6203, lon: -64.2906 }, bbox: { latMin: -39.3, latMax: -35.0, lonMin: -68.3, lonMax: -63.3 } },
  { codigo: "la-rioja", nombre: "La Rioja", capital: { lat: -29.4131, lon: -66.8558 }, bbox: { latMin: -32.0, latMax: -27.7, lonMin: -69.7, lonMax: -65.4 } },
  { codigo: "mendoza", nombre: "Mendoza", capital: { lat: -32.8895, lon: -68.8458 }, bbox: { latMin: -37.6, latMax: -32.0, lonMin: -70.6, lonMax: -66.5 } },
  { codigo: "misiones", nombre: "Misiones", capital: { lat: -27.3671, lon: -55.8961 }, bbox: { latMin: -28.2, latMax: -25.5, lonMin: -56.1, lonMax: -53.6 } },
  { codigo: "neuquen", nombre: "Neuquén", capital: { lat: -38.9516, lon: -68.0591 }, bbox: { latMin: -41.1, latMax: -36.0, lonMin: -71.95, lonMax: -68.0 } },
  { codigo: "rio-negro", nombre: "Río Negro", capital: { lat: -40.8135, lon: -62.9967 }, bbox: { latMin: -42.0, latMax: -37.5, lonMin: -71.95, lonMax: -62.7 } },
  { codigo: "salta", nombre: "Salta", capital: { lat: -24.7821, lon: -65.4232 }, bbox: { latMin: -26.4, latMax: -22.0, lonMin: -68.6, lonMax: -62.3 } },
  { codigo: "san-juan", nombre: "San Juan", capital: { lat: -31.5375, lon: -68.5364 }, bbox: { latMin: -32.6, latMax: -28.4, lonMin: -70.6, lonMax: -66.9 } },
  { codigo: "san-luis", nombre: "San Luis", capital: { lat: -33.295, lon: -66.3356 }, bbox: { latMin: -36.0, latMax: -31.8, lonMin: -67.5, lonMax: -64.9 } },
  { codigo: "santa-cruz", nombre: "Santa Cruz", capital: { lat: -51.623, lon: -69.2168 }, bbox: { latMin: -52.4, latMax: -46.0, lonMin: -73.6, lonMax: -65.7 } },
  { codigo: "santa-fe", nombre: "Santa Fe", capital: { lat: -31.6333, lon: -60.7 }, bbox: { latMin: -34.4, latMax: -28.0, lonMin: -62.9, lonMax: -58.8 } },
  { codigo: "santiago-del-estero", nombre: "Santiago del Estero", capital: { lat: -27.7951, lon: -64.2615 }, bbox: { latMin: -30.0, latMax: -25.6, lonMin: -65.2, lonMax: -61.6 } },
  { codigo: "tierra-del-fuego", nombre: "Tierra del Fuego", capital: { lat: -54.8019, lon: -68.303 }, bbox: { latMin: -55.1, latMax: -52.6, lonMin: -68.7, lonMax: -63.7 } },
  { codigo: "tucuman", nombre: "Tucumán", capital: { lat: -26.8083, lon: -65.2176 }, bbox: { latMin: -28.0, latMax: -26.0, lonMin: -66.2, lonMax: -64.4 } },
];

function slug(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
}

export function parsearProvincia(valor: string | undefined | null): Provincia | null {
  if (!valor?.trim()) return null;
  const s = slug(valor);
  return PROVINCIAS.find((p) => p.codigo === s || slug(p.nombre) === s) ?? null;
}
