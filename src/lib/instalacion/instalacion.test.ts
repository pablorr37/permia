import { prisma } from "@/lib/prisma";
import { registrarUsuario, type Usuario } from "@/lib/auth/auth";
import { TEMAS } from "@/lib/tema/tema";
import {
  actualizarInstalacion,
  obtenerConfigAdmin,
  obtenerInstalacion,
  resolverInstalacion,
  type FilaInstalacion,
} from "./instalacion";

const VACIA: FilaInstalacion = { rubro: null, nombre: null, eslogan: null, descripcion: null, logoUrl: null, provincia: null };

describe("resolverInstalacion (22-instalacion.md §1, precedencia)", () => {
  it("sin fila ni variables: almacen, marca Permia, San Juan, sin logo", () => {
    const i = resolverInstalacion(null, {});
    expect(i.tema.rubro).toBe("almacen");
    expect(i.tema.marca).toBe("Permia");
    expect(i.provincia.codigo).toBe("san-juan");
    expect(i.logoUrl).toBeNull();
    expect(i.advertencias).toEqual([]);
  });

  it("las variables de entorno rigen cuando el admin no guardó nada", () => {
    const i = resolverInstalacion(VACIA, { PERMIA_RUBRO: "vinos", PERMIA_NOMBRE: "La Cava", PERMIA_PROVINCIA: "Mendoza" });
    expect(i.tema.rubro).toBe("vinos");
    expect(i.tema.marca).toBe("La Cava");
    expect(i.tema.eslogan).toBe(TEMAS.vinos.eslogan);
    expect(i.provincia.codigo).toBe("mendoza");
  });

  it("lo que guardó el admin le gana a las variables de entorno", () => {
    const i = resolverInstalacion(
      { ...VACIA, rubro: "vivero", nombre: "Las Lilas", eslogan: "Arme su cantero", logoUrl: "https://s3.test/logo.png", provincia: "cordoba" },
      { PERMIA_RUBRO: "bebidas", PERMIA_NOMBRE: "Otro", PERMIA_ESLOGAN: "Otro eslogan", PERMIA_PROVINCIA: "salta" },
    );
    expect(i.tema.rubro).toBe("vivero");
    expect(i.tema.colores).toEqual(TEMAS.vivero.colores);
    expect(i.tema.marca).toBe("Las Lilas");
    expect(i.tema.eslogan).toBe("Arme su cantero");
    expect(i.logoUrl).toBe("https://s3.test/logo.png");
    expect(i.provincia.codigo).toBe("cordoba");
  });

  it("un rubro o provincia desconocidos se saltean con advertencia y rige el siguiente nivel", () => {
    const i = resolverInstalacion({ ...VACIA, rubro: "ferreteria", provincia: "uruguay" }, { PERMIA_RUBRO: "bebidas", PERMIA_PROVINCIA: "atlantida" });
    expect(i.tema.rubro).toBe("bebidas");
    expect(i.provincia.codigo).toBe("san-juan");
    expect(i.advertencias.join(" ")).toContain("ferreteria");
    expect(i.advertencias.join(" ")).toContain("uruguay");
    expect(i.advertencias.join(" ")).toContain("atlantida");
  });
});

describe("instalación en la DB (22-instalacion.md §1)", () => {
  let admin: Usuario;
  let comun: Usuario;

  beforeEach(async () => {
    await prisma.instalacion.deleteMany({});
    admin = await registrarUsuario({ email: `test-inst-a-${Date.now()}@permia.test`, password: "password123", nombre: "Admin" });
    await prisma.usuario.update({ where: { id: admin.id }, data: { esAdmin: true } });
    admin = { ...admin, esAdmin: true };
    comun = await registrarUsuario({ email: `test-inst-c-${Date.now()}@permia.test`, password: "password123", nombre: "Común" });
  });

  afterEach(async () => {
    await prisma.instalacion.deleteMany({});
    await prisma.usuario.deleteMany({ where: { id: { in: [admin.id, comun.id] } } });
  });

  it("obtenerInstalacion sin fila resuelve con las variables", async () => {
    const i = await obtenerInstalacion({ PERMIA_RUBRO: "bebidas" });
    expect(i.tema.rubro).toBe("bebidas");
  });

  it("actualizarInstalacion guarda, normaliza y obtenerInstalacion lo aplica", async () => {
    const fila = await actualizarInstalacion(admin, {
      rubro: " Vivero ",
      nombre: "  Vivero Las Lilas ",
      provincia: "Córdoba",
      logoUrl: "https://s3.test/logo.png",
    });
    expect(fila).toEqual({ ...VACIA, rubro: "vivero", nombre: "Vivero Las Lilas", provincia: "cordoba", logoUrl: "https://s3.test/logo.png" });
    const i = await obtenerInstalacion({ PERMIA_RUBRO: "bebidas" });
    expect(i.tema.rubro).toBe("vivero");
    expect(i.tema.marca).toBe("Vivero Las Lilas");
    expect(i.provincia.codigo).toBe("cordoba");
    expect(await obtenerConfigAdmin(admin)).toEqual(fila);
  });

  it("un campo ausente no cambia; null o vacío vuelve al default", async () => {
    await actualizarInstalacion(admin, { rubro: "vinos", nombre: "La Cava", eslogan: "Salud" });
    const fila = await actualizarInstalacion(admin, { nombre: "", eslogan: null });
    expect(fila).toMatchObject({ rubro: "vinos", nombre: null, eslogan: null });
  });

  it("valida rubro, provincia, largo de textos y logo", async () => {
    await expect(actualizarInstalacion(admin, { rubro: "ferreteria" })).rejects.toMatchObject({ code: "RUBRO_TEMA_INVALIDO" });
    await expect(actualizarInstalacion(admin, { provincia: "Uruguay" })).rejects.toMatchObject({ code: "PROVINCIA_INVALIDA" });
    await expect(actualizarInstalacion(admin, { nombre: "x".repeat(61) })).rejects.toMatchObject({ code: "TEXTO_DEMASIADO_LARGO" });
    await expect(actualizarInstalacion(admin, { eslogan: "x".repeat(81) })).rejects.toMatchObject({ code: "TEXTO_DEMASIADO_LARGO" });
    await expect(actualizarInstalacion(admin, { descripcion: "x".repeat(241) })).rejects.toMatchObject({ code: "TEXTO_DEMASIADO_LARGO" });
    await expect(actualizarInstalacion(admin, { logoUrl: "javascript:alert(1)" })).rejects.toMatchObject({ code: "LOGO_INVALIDO" });
    expect(await prisma.instalacion.count()).toBe(0);
  });

  it("FORBIDDEN si no es admin", async () => {
    await expect(actualizarInstalacion(comun, { rubro: "vinos" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(obtenerConfigAdmin(comun)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
