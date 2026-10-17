// Configuración de la instalación (22-instalacion.md): tema, marca, logo y provincia.
// Precedencia por valor: lo que guardó el admin → variable de entorno → default.
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { requireAdmin, type Usuario } from "@/lib/auth/auth";
import { parsearRubro, resolverTema, type Tema } from "@/lib/tema/tema";
import { parsearProvincia, PROVINCIA_POR_DEFECTO, type Provincia } from "@/lib/region/provincias";

export interface FilaInstalacion {
  rubro: string | null;
  nombre: string | null;
  eslogan: string | null;
  descripcion: string | null;
  logoUrl: string | null;
  provincia: string | null;
}

export interface Instalacion {
  tema: Tema;
  logoUrl: string | null;
  provincia: Provincia;
  advertencias: string[];
}

type Env = Record<string, string | undefined>;

const CAMPOS: (keyof FilaInstalacion)[] = ["rubro", "nombre", "eslogan", "descripcion", "logoUrl", "provincia"];
const LARGO_MAXIMO = { nombre: 60, eslogan: 80, descripcion: 240 } as const;

function texto(valor: string | null | undefined): string | null {
  const t = valor?.trim();
  return t ? t : null;
}

export function resolverInstalacion(fila: FilaInstalacion | null, env: Env): Instalacion {
  const advertencias: string[] = [];

  const rubroAdmin = texto(fila?.rubro);
  if (rubroAdmin && !parsearRubro(rubroAdmin)) {
    advertencias.push(`El rubro guardado "${rubroAdmin}" no es un rubro conocido; se ignora.`);
  }
  const { tema, advertencia } = resolverTema({
    PERMIA_RUBRO: rubroAdmin && parsearRubro(rubroAdmin) ? rubroAdmin : env.PERMIA_RUBRO,
    PERMIA_NOMBRE: texto(fila?.nombre) ?? env.PERMIA_NOMBRE,
    PERMIA_ESLOGAN: texto(fila?.eslogan) ?? env.PERMIA_ESLOGAN,
    PERMIA_DESCRIPCION: texto(fila?.descripcion) ?? env.PERMIA_DESCRIPCION,
  });
  if (advertencia) advertencias.push(advertencia);

  let provincia: Provincia | null = null;
  for (const [origen, valor] of [
    ["guardada", texto(fila?.provincia)],
    ["de PERMIA_PROVINCIA", texto(env.PERMIA_PROVINCIA)],
  ] as const) {
    if (!valor) continue;
    provincia = parsearProvincia(valor);
    if (provincia) break;
    advertencias.push(`La provincia ${origen} "${valor}" no es una provincia conocida; se ignora.`);
  }

  return {
    tema,
    logoUrl: texto(fila?.logoUrl),
    provincia: provincia ?? parsearProvincia(PROVINCIA_POR_DEFECTO)!,
    advertencias,
  };
}

async function leerFila(): Promise<FilaInstalacion | null> {
  return prisma.instalacion.findUnique({
    where: { id: 1 },
    select: { rubro: true, nombre: true, eslogan: true, descripcion: true, logoUrl: true, provincia: true },
  });
}

export async function obtenerInstalacion(env: Env = process.env): Promise<Instalacion> {
  try {
    return resolverInstalacion(await leerFila(), env);
  } catch (error) {
    const instalacion = resolverInstalacion(null, env);
    const detalle = error instanceof Error ? error.message : String(error);
    instalacion.advertencias.push(`No se pudo leer la configuración de la instalación (${detalle}); se usan las variables de entorno.`);
    return instalacion;
  }
}

export async function obtenerConfigAdmin(usuario: Usuario): Promise<FilaInstalacion> {
  requireAdmin(usuario);
  const fila = await leerFila();
  return fila ?? { rubro: null, nombre: null, eslogan: null, descripcion: null, logoUrl: null, provincia: null };
}

export type ActualizarInstalacionInput = Partial<FilaInstalacion>;

function validar(input: ActualizarInstalacionInput): Partial<FilaInstalacion> {
  const datos: Partial<FilaInstalacion> = {};
  for (const campo of CAMPOS) {
    if (input[campo] === undefined) continue;
    if (input[campo] !== null && typeof input[campo] !== "string") {
      throw new AppError("TEXTO_INVALIDO", `"${campo}" tiene que ser un texto.`);
    }
    datos[campo] = texto(input[campo]);
  }

  if (datos.rubro) {
    const rubro = parsearRubro(datos.rubro);
    if (!rubro) throw new AppError("RUBRO_TEMA_INVALIDO", `"${datos.rubro}" no es un rubro de Permia.`);
    datos.rubro = rubro;
  }
  if (datos.provincia) {
    const provincia = parsearProvincia(datos.provincia);
    if (!provincia) throw new AppError("PROVINCIA_INVALIDA", `"${datos.provincia}" no es una provincia argentina.`);
    datos.provincia = provincia.codigo;
  }
  for (const [campo, maximo] of Object.entries(LARGO_MAXIMO) as [keyof typeof LARGO_MAXIMO, number][]) {
    if ((datos[campo]?.length ?? 0) > maximo) {
      throw new AppError("TEXTO_DEMASIADO_LARGO", `El campo "${campo}" admite hasta ${maximo} caracteres.`);
    }
  }
  if (datos.logoUrl && !/^https?:\/\/\S+$/i.test(datos.logoUrl)) {
    throw new AppError("LOGO_INVALIDO", "El logo tiene que ser una URL http(s).");
  }
  return datos;
}

export async function actualizarInstalacion(usuario: Usuario, input: ActualizarInstalacionInput): Promise<FilaInstalacion> {
  requireAdmin(usuario);
  const datos = validar(input);
  await prisma.instalacion.upsert({ where: { id: 1 }, create: { id: 1, ...datos }, update: datos });
  return obtenerConfigAdmin(usuario);
}
