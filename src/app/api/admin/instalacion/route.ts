import { NextRequest } from "next/server";
import { actualizarInstalacion, obtenerConfigAdmin, resolverInstalacion, type FilaInstalacion } from "@/lib/instalacion/instalacion";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { respuestaExitosa, respuestaError } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

// 22-instalacion.md §1 — tema, marca, logo y provincia de la instalación.
export const dynamic = "force-dynamic";

function respuesta(guardado: FilaInstalacion) {
  const { tema, logoUrl, provincia } = resolverInstalacion(guardado, process.env);
  return {
    guardado,
    efectivo: {
      rubro: tema.rubro,
      marca: tema.marca,
      eslogan: tema.eslogan,
      descripcion: tema.descripcion,
      logoUrl,
      provincia: provincia.codigo,
    },
  };
}

export async function GET() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new AppError("NO_AUTENTICADO", "Necesitás iniciar sesión.");
    return respuestaExitosa(respuesta(await obtenerConfigAdmin(usuario)));
  } catch (error) {
    return respuestaError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) throw new AppError("NO_AUTENTICADO", "Necesitás iniciar sesión.");
    const body = await request.json().catch(() => ({}));
    return respuestaExitosa(respuesta(await actualizarInstalacion(usuario, body ?? {})));
  } catch (error) {
    return respuestaError(error);
  }
}
