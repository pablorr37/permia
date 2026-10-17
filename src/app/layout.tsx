import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { connection } from "next/server";
import "./globals.css";
import { Providers } from "./providers";
import { CLASE_FUENTE } from "./fuentes";
import { variablesCss } from "@/lib/tema/tema";
import { obtenerInstalacion } from "@/lib/instalacion/instalacion";

// Tema, marca, logo y provincia de la instalación (21-temas.md, 22-instalacion.md):
// lo que guardó el admin, o las variables PERMIA_* en runtime. Una lectura por request.
const instalacionDelRequest = cache(async () => {
  await connection();
  const instalacion = await obtenerInstalacion();
  for (const advertencia of instalacion.advertencias) console.warn(`[instalacion] ${advertencia}`);
  return instalacion;
});

export async function generateMetadata(): Promise<Metadata> {
  const { tema, logoUrl } = await instalacionDelRequest();
  return { title: tema.marca, description: tema.descripcion, icons: { icon: logoUrl ?? "/favicon.ico" } };
}

export async function generateViewport(): Promise<Viewport> {
  const { tema } = await instalacionDelRequest();
  return { themeColor: tema.colores.primary };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { tema, logoUrl, provincia } = await instalacionDelRequest();
  const fuentes = `${CLASE_FUENTE[tema.fuentes.display]} ${CLASE_FUENTE[tema.fuentes.sans]}`;
  return (
    <html lang="es" data-tema={tema.rubro} className={fuentes} style={variablesCss(tema) as React.CSSProperties}>
      <body>
        <Providers instalacion={{ tema, logoUrl, provincia }}>{children}</Providers>
      </body>
    </html>
  );
}
