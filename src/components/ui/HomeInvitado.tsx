"use client";

import { useCallback, useEffect, useState } from "react";
import { useAlVolver } from "@/lib/hooks/useAlVolver";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api-client";
import { estadoApertura, type HorarioTienda } from "@/lib/tiendas/horarios";
import { useAhora } from "@/lib/hooks/useAhora";
import { EstadoAperturaPill } from "./EstadoAperturaPill";
import { IconoMarca, LogoMarca } from "@/components/tema/IconoMarca";
import { useTema } from "@/components/tema/TemaProvider";

type Tienda = {
  id: string;
  nombre: string;
  direccion: string;
  horarios: HorarioTienda[];
  abierto24hs?: boolean;
  imagenUrl: string | null;
};

// Delay de entrada en ms, para la coreografía de la intro.
const d = (ms: number) => ({ animationDelay: `${ms}ms` });

// Portada del negocio para quien no inició sesión (22-instalacion.md §3): marca y
// sucursales. Intro animada (docs/auditoria-ui-ux.md §5): la marca baja desde
// arriba, el texto sube en el sentido de lectura, las sucursales entran escalonadas
// y la barra de acción sube desde el borde inferior.
export function HomeInvitado() {
  const tema = useTema();
  const [tiendas, setTiendas] = useState<Tienda[] | null>(null);
  const ahora = useAhora();

  const cargar = useCallback(() => {
    apiGet<Tienda[]>("/api/tiendas")
      .then(setTiendas)
      .catch((err) => {
        if (err instanceof ApiError) console.error(err.message);
        setTiendas([]);
      });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);
  useAlVolver(cargar);

  const unica = tiendas?.length === 1 ? tiendas[0] : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-bg px-5 pt-8">
      <header className="flex flex-col gap-3 pb-7">
        <div className="flex items-center gap-2.5">
          <LogoMarca className="h-11 w-11 animate-scale-in" style={d(0)} />
          <span
            className="animate-[fade-in-down_520ms_var(--ease-decelerate)_both] font-display text-[34px] font-extrabold leading-none tracking-[-0.02em] text-primary-dark"
            style={d(60)}
          >
            {tema.marca}
          </span>
        </div>
        <h1
          className="animate-fade-up font-display text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-text"
          style={d(180)}
        >
          {tema.eslogan}
        </h1>
        <p className="animate-fade-up text-[15px] leading-relaxed text-text-2" style={d(240)}>
          {tema.descripcion}
        </p>
      </header>

      <div className="relative flex flex-grow flex-col gap-2.5">
        {tiendas !== null && tiendas.length > 0 && (
          <div className="animate-fade-in text-[13px] font-semibold text-text-2" style={d(300)}>
            {tiendas.length === 1 ? "Nuestra tienda" : "Nuestras sucursales"}
          </div>
        )}

        {tiendas === null &&
          [0, 1].map((i) => <div key={i} className="h-[74px] animate-pulse rounded-card bg-placeholder" aria-hidden="true" />)}

        {tiendas?.length === 0 && (
          <p className="animate-fade-in rounded-card border border-border bg-surface p-4 text-[14px] text-text-2" style={d(300)}>
            Muy pronto vas a poder comprar acá.
          </p>
        )}

        {tiendas?.map((t, i) => (
          <Link
            key={t.id}
            href={`/tiendas/${t.id}`}
            style={d(340 + i * 40)}
            className="press-soft flex animate-fade-up items-center gap-3 rounded-card border border-border bg-surface p-3.5 shadow-card"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-control bg-primary-soft text-primary-dark">
              {t.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.imagenUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <IconoMarca />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="truncate text-[15px] font-semibold text-text">{t.nombre}</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-2">
                <EstadoAperturaPill estado={estadoApertura(t.horarios, ahora, { abierto24hs: t.abierto24hs })} />
                <span className="truncate">{t.direccion}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="sticky bottom-0 flex animate-slide-up flex-col gap-2 bg-bg pb-6 pt-4 text-center" style={d(380)}>
        {tiendas !== null && tiendas.length > 0 && (
          <Link
            href={unica ? `/tiendas/${unica.id}` : "/login"}
            className="press w-full rounded-control bg-primary px-5 py-4 text-[16px] font-semibold text-white shadow-cta"
          >
            {unica ? "Ver productos" : "Ver sucursales en el mapa"}
          </Link>
        )}
        <p className="text-[13px] text-text-2">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-semibold text-accent-text underline-offset-2 hover:underline">
            Creá una gratis
          </Link>
          {" · "}
          <Link href="/login" className="font-semibold text-accent-text underline-offset-2 hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
