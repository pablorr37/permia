import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrarUsuario, type Usuario } from "@/lib/auth/auth";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { GET, POST } from "./route";
import { crearTienda } from "@/lib/tiendas/tiendas";

vi.mock("@/lib/auth/session", () => ({ obtenerUsuarioActual: vi.fn() }));
const obtenerUsuarioActualMock = vi.mocked(obtenerUsuarioActual);

function req(body: unknown) {
  return new NextRequest("http://localhost/api/tiendas", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

let usuario: Usuario;

async function crearUsuarioDePrueba(): Promise<Usuario> {
  return registrarUsuario({
    email: `test-tiendas-route-${Date.now()}@almacenia.test`,
    password: "password123",
    nombre: "Vendedor de prueba",
  });
}

describe("POST /api/tiendas", () => {
  beforeEach(async () => {
    usuario = await crearUsuarioDePrueba();
  });

  afterEach(async () => {
    await prisma.tienda.deleteMany({ where: { vendedorId: usuario.id } });
    await prisma.usuario.deleteMany({ where: { id: usuario.id } });
    vi.clearAllMocks();
  });

  it("401 NO_AUTENTICADO sin sesión", async () => {
    obtenerUsuarioActualMock.mockResolvedValue(null);

    const res = await POST(req({ nombre: "X", direccion: "Y", lat: 0, lon: 0 }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("NO_AUTENTICADO");
  });

  it("403 CREAR_TIENDA_NO_PERMITIDO si no es admin ni propietario (22-instalacion.md)", async () => {
    obtenerUsuarioActualMock.mockResolvedValue(usuario);

    const res = await POST(req({ nombre: "X", direccion: "Y", lat: -34.6, lon: -58.38 }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("CREAR_TIENDA_NO_PERMITIDO");
    expect(await prisma.tienda.count({ where: { vendedorId: usuario.id } })).toBe(0);
  });

  it("201 crea la tienda si es admin", async () => {
    await prisma.usuario.update({ where: { id: usuario.id }, data: { esAdmin: true } });
    obtenerUsuarioActualMock.mockResolvedValue({ ...usuario, esAdmin: true });

    const res = await POST(
      req({
        nombre: "Almacén Don José",
        direccion: "Av. Siempre Viva 123",
        lat: -34.6037,
        lon: -58.3816,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.nombre).toBe("Almacén Don José");
    expect(body.data.vendedorId).toBe(usuario.id);
  });

  it("400 UBICACION_INVALIDA con lat fuera de rango", async () => {
    obtenerUsuarioActualMock.mockResolvedValue({ ...usuario, esAdmin: true });

    const res = await POST(req({ nombre: "X", direccion: "Y", lat: 999, lon: 0 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("UBICACION_INVALIDA");
  });
});

describe("GET /api/tiendas (22-instalacion.md §3)", () => {
  let dueno: Usuario;
  afterEach(async () => {
    await prisma.tienda.deleteMany({ where: { vendedorId: dueno.id } });
    await prisma.usuario.deleteMany({ where: { id: dueno.id } });
  });

  it("200 público con las sucursales del negocio", async () => {
    dueno = await crearUsuarioDePrueba();
    const tienda = await crearTienda(dueno, { nombre: "Casa central", direccion: "D", lat: -31.5375, lon: -68.5364 });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.map((t: { id: string }) => t.id)).toContain(tienda.id);
  });
});
