import { NextRequest } from "next/server";
import { crearTienda, exigirPuedeCrearTienda, listarSucursales } from "@/lib/tiendas/tiendas";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { respuestaExitosa, respuestaError } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

// Datos vivos (00-overview.md, "Sin caché").
export const dynamic = "force-dynamic";

// Sucursales del negocio, pública (22-instalacion.md §3).
export async function GET() {
  try {
    return respuestaExitosa(await listarSucursales());
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario) {
      throw new AppError("NO_AUTENTICADO", "Necesitás iniciar sesión.");
    }

    // 22-instalacion.md §3: tienda única, solo el negocio abre sucursales.
    await exigirPuedeCrearTienda(usuario);

    const body = await request.json();
    const tienda = await crearTienda(usuario, {
      nombre: body.nombre,
      descripcion: body.descripcion,
      direccion: body.direccion,
      lat: body.lat,
      lon: body.lon,
      mediosDePago: body.mediosDePago,
      abierto24hs: body.abierto24hs,
      horarios: body.horarios,
      rubroId: body.rubroId,
    });
    return respuestaExitosa(tienda, 201);
  } catch (error) {
    return respuestaError(error);
  }
}
