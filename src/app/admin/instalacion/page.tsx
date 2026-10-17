"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiGet, apiPatch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { RUBROS_TEMA, TEMAS, type FuenteTema, type RubroTema } from "@/lib/tema/tema";
import { PROVINCIAS } from "@/lib/region/provincias";

type Fila = {
  rubro: string | null;
  nombre: string | null;
  eslogan: string | null;
  descripcion: string | null;
  logoUrl: string | null;
  provincia: string | null;
};
type Respuesta = {
  guardado: Fila;
  efectivo: { rubro: RubroTema; marca: string; eslogan: string; descripcion: string; logoUrl: string | null; provincia: string };
};

// Carácter de cada tema, para elegir (21-temas.md).
const CARACTER: Record<RubroTema, string> = {
  almacen: "Cálido, de barrio",
  bebidas: "Moderno y joven",
  vinos: "Sobrio y elegante",
  vivero: "Vibrante y verde",
};
const NOMBRE_RUBRO: Record<RubroTema, string> = {
  almacen: "Almacén",
  bebidas: "Bebidas",
  vinos: "Vinos",
  vivero: "Vivero",
};
const NOMBRE_FUENTE: Record<FuenteTema, string> = {
  bricolage: "Bricolage Grotesque",
  "plus-jakarta": "Plus Jakarta Sans",
  unbounded: "Unbounded",
  manrope: "Manrope",
  cormorant: "Cormorant Garamond",
  jost: "Jost",
  outfit: "Outfit",
  "nunito-sans": "Nunito Sans",
};

// Tema, marca, logo y provincia de la instalación (22-instalacion.md §1).
export default function AdminInstalacionPage() {
  const { status } = useSession();
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [form, setForm] = useState<Fila | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    apiGet<Respuesta>("/api/admin/instalacion")
      .then((r) => {
        setDatos(r);
        setForm(r.guardado);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "FORBIDDEN") setForbidden(true);
        else setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración.");
      });
  }, [status]);

  if (status === "unauthenticated" || forbidden) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-text-2">Esta sección es solo para administradores.</p>
        <Link href="/" className="font-semibold text-accent-text">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const rubroElegido: RubroTema = (form?.rubro as RubroTema | null) ?? datos?.efectivo.rubro ?? "almacen";
  const cambiar = (campo: keyof Fila, valor: string | null) => setForm((f) => (f ? { ...f, [campo]: valor } : f));

  async function guardar() {
    if (!form) return;
    setGuardando(true);
    setError(null);
    try {
      await apiPatch<Respuesta>("/api/admin/instalacion", form);
      // El tema se aplica en el layout (server): se recarga para verlo.
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.");
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" aria-label="Volver al panel" className="flex h-8 w-8 items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-display text-[20px] font-bold text-primary-dark">Marca y tema</h1>
      </div>

      {!form || !datos ? (
        <div className="h-60 animate-pulse rounded-card bg-placeholder" aria-label="Cargando" />
      ) : (
        <>
          <section aria-labelledby="t-tema" className="flex flex-col gap-2.5">
            <h2 id="t-tema" className="text-[12px] font-bold uppercase tracking-wide text-text-2">
              Tema
            </h2>
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-labelledby="t-tema">
              {RUBROS_TEMA.map((rubro) => {
                const t = TEMAS[rubro];
                const elegido = rubro === rubroElegido;
                return (
                  <button
                    key={rubro}
                    type="button"
                    role="radio"
                    aria-checked={elegido}
                    onClick={() => cambiar("rubro", rubro)}
                    className={`flex flex-col gap-2 rounded-card border bg-surface p-3 text-left ${
                      elegido ? "border-primary ring-[3px] ring-primary/20" : "border-border"
                    }`}
                  >
                    <span className="flex gap-1" aria-hidden="true">
                      {[t.colores.primary, t.colores.accent, t.colores.bg].map((color) => (
                        <span key={color} className="h-6 w-6 rounded-pill border border-border" style={{ background: color }} />
                      ))}
                    </span>
                    <span className="text-[15px] font-semibold text-text">{NOMBRE_RUBRO[rubro]}</span>
                    <span className="text-[12px] leading-snug text-text-2">
                      {CARACTER[rubro]} · {NOMBRE_FUENTE[t.fuentes.display]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="t-marca" className="flex flex-col gap-3">
            <h2 id="t-marca" className="text-[12px] font-bold uppercase tracking-wide text-text-2">
              Marca
            </h2>
            <Input
              id="nombre"
              label="Nombre"
              maxLength={60}
              value={form.nombre ?? ""}
              placeholder={TEMAS[rubroElegido].marca}
              onChange={(e) => cambiar("nombre", e.target.value)}
            />
            <Input
              id="eslogan"
              label="Eslogan"
              maxLength={80}
              value={form.eslogan ?? ""}
              placeholder={TEMAS[rubroElegido].eslogan}
              onChange={(e) => cambiar("eslogan", e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="descripcion" className="text-[13px] font-semibold text-text">
                Descripción
              </label>
              <textarea
                id="descripcion"
                maxLength={240}
                rows={3}
                value={form.descripcion ?? ""}
                placeholder={TEMAS[rubroElegido].descripcion}
                onChange={(e) => cambiar("descripcion", e.target.value)}
                className="rounded-control border border-border bg-surface px-3.5 py-3 text-[15px] text-text placeholder:text-text-2 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/12"
              />
            </div>
            <p className="text-[12px] text-text-2">Si dejás un campo vacío se usa el texto del tema.</p>
          </section>

          <section aria-labelledby="t-logo" className="flex flex-col gap-2.5">
            <h2 id="t-logo" className="text-[12px] font-bold uppercase tracking-wide text-text-2">
              Logo
            </h2>
            <ImageUploadField
              tipo="logo"
              entidadId="instalacion"
              valorActual={form.logoUrl}
              onSubido={(url) => cambiar("logoUrl", url)}
              textoSubir="Subir logo"
            />
            {form.logoUrl && (
              <button type="button" onClick={() => cambiar("logoUrl", null)} className="self-start text-[13px] font-semibold text-accent-text">
                Quitar logo (usar el ícono del rubro)
              </button>
            )}
          </section>

          <section aria-labelledby="t-provincia" className="flex flex-col gap-2.5">
            <h2 id="t-provincia" className="text-[12px] font-bold uppercase tracking-wide text-text-2">
              Provincia
            </h2>
            <select
              aria-labelledby="t-provincia"
              value={form.provincia ?? datos.efectivo.provincia}
              onChange={(e) => cambiar("provincia", e.target.value)}
              className="rounded-control border border-border bg-surface px-3 py-3 text-[15px] text-text"
            >
              {PROVINCIAS.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <p className="text-[12px] text-text-2">Centra el mapa y define &quot;toda la provincia&quot; del plan Plata.</p>
          </section>

          {error && <p className="text-[13px] text-estado-rechazado-text">{error}</p>}
          <Button type="button" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </>
      )}
    </div>
  );
}
