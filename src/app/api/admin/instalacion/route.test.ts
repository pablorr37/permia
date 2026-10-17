import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrarUsuario, type Usuario } from "@/lib/auth/auth";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { GET, PATCH } from "./route";

vi.mock("@/lib/auth/session", () => ({ obtenerUsuarioActual: vi.fn() }));
const obtenerUsuarioActualMock = vi.mocked(obtenerUsuarioActual);

function patch(body: unknown) {
  return new NextRequest("http://localhost/api/admin/instalacion", { method: "PATCH", body: JSON.stringify(body) });
}

describe("/api/admin/instalacion (22-instalacion.md §1)", () => {
  let admin: Usuario;

  beforeEach(async () => {
    await prisma.instalacion.deleteMany({});
    admin = await registrarUsuario({ email: `test-inst-route-${Date.now()}@permia.test`, password: "password123", nombre: "Admin" });
    await prisma.usuario.update({ where: { id: admin.id }, data: { esAdmin: true } });
    admin = { ...admin, esAdmin: true };
  });

  afterEach(async () => {
    await prisma.instalacion.deleteMany({});
    await prisma.usuario.deleteMany({ where: { id: admin.id } });
    vi.clearAllMocks();
  });

  it("401 sin sesión y 403 sin ser admin", async () => {
    obtenerUsuarioActualMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    obtenerUsuarioActualMock.mockResolvedValue({ ...admin, esAdmin: false });
    expect((await PATCH(patch({ rubro: "vinos" }))).status).toBe(403);
  });

  it("GET devuelve lo guardado y lo efectivo", async () => {
    obtenerUsuarioActualMock.mockResolvedValue(admin);
    const body = await (await GET()).json();
    expect(body.data.guardado).toEqual({ rubro: null, nombre: null, eslogan: null, descripcion: null, logoUrl: null, provincia: null });
    expect(body.data.efectivo).toMatchObject({ provincia: expect.any(String), marca: expect.any(String) });
  });

  it("PATCH guarda y devuelve lo efectivo con los cambios", async () => {
    obtenerUsuarioActualMock.mockResolvedValue(admin);
    const res = await PATCH(patch({ rubro: "vinos", nombre: "La Cava", provincia: "Mendoza" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.guardado).toMatchObject({ rubro: "vinos", nombre: "La Cava", provincia: "mendoza" });
    expect(body.data.efectivo).toMatchObject({ rubro: "vinos", marca: "La Cava", provincia: "mendoza" });
  });

  it("400 con un rubro inválido", async () => {
    obtenerUsuarioActualMock.mockResolvedValue(admin);
    const res = await PATCH(patch({ rubro: "ferreteria" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("RUBRO_TEMA_INVALIDO");
  });
});
