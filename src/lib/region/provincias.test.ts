import { describe, expect, it } from "vitest";
import { parsearProvincia, PROVINCIA_POR_DEFECTO, PROVINCIAS } from "./provincias";

describe("provincias (22-instalacion.md §2)", () => {
  it("son las 24 jurisdicciones, sin códigos repetidos", () => {
    expect(PROVINCIAS).toHaveLength(24);
    expect(new Set(PROVINCIAS.map((p) => p.codigo)).size).toBe(24);
  });

  it.each(PROVINCIAS.map((p) => [p.codigo, p] as const))("%s: bbox válido y la capital adentro", (_codigo, p) => {
    const { latMin, latMax, lonMin, lonMax } = p.bbox;
    expect(latMin).toBeLessThan(latMax);
    expect(lonMin).toBeLessThan(lonMax);
    expect(latMin).toBeGreaterThanOrEqual(-56);
    expect(latMax).toBeLessThanOrEqual(-21);
    expect(lonMin).toBeGreaterThanOrEqual(-74);
    expect(lonMax).toBeLessThanOrEqual(-53);
    expect(p.capital.lat).toBeGreaterThan(latMin);
    expect(p.capital.lat).toBeLessThan(latMax);
    expect(p.capital.lon).toBeGreaterThan(lonMin);
    expect(p.capital.lon).toBeLessThan(lonMax);
  });

  it("la provincia por defecto es San Juan, con el rectángulo que usaba Almacenia", () => {
    const sj = parsearProvincia(PROVINCIA_POR_DEFECTO);
    expect(sj?.nombre).toBe("San Juan");
    expect(sj?.bbox).toEqual({ latMin: -32.6, latMax: -28.4, lonMin: -70.6, lonMax: -66.9 });
  });

  it("parsea código o nombre sin importar mayúsculas, tildes ni espacios", () => {
    expect(parsearProvincia("cordoba")?.codigo).toBe("cordoba");
    expect(parsearProvincia(" Córdoba ")?.codigo).toBe("cordoba");
    expect(parsearProvincia("ENTRE RÍOS")?.codigo).toBe("entre-rios");
    expect(parsearProvincia("Tierra del Fuego")?.codigo).toBe("tierra-del-fuego");
    expect(parsearProvincia("caba")?.nombre).toBe("Ciudad Autónoma de Buenos Aires");
  });

  it("devuelve null para vacío o desconocido", () => {
    expect(parsearProvincia(undefined)).toBeNull();
    expect(parsearProvincia(null)).toBeNull();
    expect(parsearProvincia("  ")).toBeNull();
    expect(parsearProvincia("Uruguay")).toBeNull();
  });
});
