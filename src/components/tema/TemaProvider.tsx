"use client";

// Tema y datos de la instalación para los componentes cliente (21-temas.md,
// 22-instalacion.md). El layout los resuelve en el server y los pasa por Providers.
import { createContext, useContext } from "react";
import { TEMAS, type Tema } from "@/lib/tema/tema";
import { parsearProvincia, PROVINCIA_POR_DEFECTO, type Provincia } from "@/lib/region/provincias";

export interface InstalacionCliente {
  tema: Tema;
  logoUrl: string | null;
  provincia: Provincia;
}

const InstalacionContext = createContext<InstalacionCliente>({
  tema: TEMAS.almacen,
  logoUrl: null,
  provincia: parsearProvincia(PROVINCIA_POR_DEFECTO)!,
});

export function TemaProvider({ instalacion, children }: { instalacion: InstalacionCliente; children: React.ReactNode }) {
  return <InstalacionContext.Provider value={instalacion}>{children}</InstalacionContext.Provider>;
}

export function useTema(): Tema & { logoUrl: string | null } {
  const { tema, logoUrl } = useContext(InstalacionContext);
  return { ...tema, logoUrl };
}

export function useProvincia(): Provincia {
  return useContext(InstalacionContext).provincia;
}
