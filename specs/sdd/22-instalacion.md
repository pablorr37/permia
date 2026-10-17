# Módulo: instalación (tienda única, provincia, marca y tema desde el admin)

Convenciones comunes: ver [`00-overview.md`](00-overview.md). Extiende
[`21-temas.md`](21-temas.md).

Cada VPS de Permia es **un solo negocio**: el del cliente. No es un marketplace de
tiendas de terceros como Almacenia. El negocio puede tener **sucursales** (varias
tiendas del mismo dueño, `19-equipo-tienda.md`), pero nadie más puede abrir una
tienda en la instalación.

Decisiones del usuario (2026-10-17):
1. Cada instalación es una **tienda única** (con sus sucursales).
2. **Sin datos demo**: Permia no trae seed de tiendas ni productos.
3. **Región configurable por provincia** argentina.
4. **Logo propio** del cliente y **selector de tema** desde el panel admin.

## 1. Configuración de la instalación

### Modelo de datos

```sql
CREATE TABLE instalacion (
  id             INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- fila única
  rubro          TEXT,          -- uno de RUBROS_TEMA (21-temas.md)
  nombre         TEXT,          -- marca
  eslogan        TEXT,
  descripcion    TEXT,
  logo_url       TEXT,
  provincia      TEXT,          -- código de PROVINCIAS (sección 2)
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`NULL` en una columna = "sin valor del admin". La fila puede no existir: equivale a
todas las columnas en `NULL`.

### Precedencia

Para cada valor: **lo que guardó el admin** → si no hay, **variable de entorno** →
si no hay, **valor del tema o del sistema**.

| Valor | Admin (`instalacion`) | Variable de entorno | Por defecto |
| --- | --- | --- | --- |
| rubro | `rubro` | `PERMIA_RUBRO` | `almacen` |
| marca | `nombre` | `PERMIA_NOMBRE` | la del tema |
| eslogan | `eslogan` | `PERMIA_ESLOGAN` | el del tema |
| descripción | `descripcion` | `PERMIA_DESCRIPCION` | la del tema |
| logo | `logo_url` | — | sin logo: ícono del rubro |
| provincia | `provincia` | `PERMIA_PROVINCIA` | `san-juan` |

Así, las variables de entorno siguen sirviendo para dejar el VPS listo al
instalarlo, y el cliente después lo ajusta desde el admin sin redeploy.

Un rubro o una provincia desconocidos (por ejemplo, un valor viejo en la variable de
entorno) se ignoran con una advertencia en el log, y se pasa al siguiente nivel de
la precedencia.

Si la DB no responde al resolver la instalación, el sitio usa las variables de
entorno y los valores por defecto (advertencia en el log); no se cae.

### Firmas TypeScript (`src/lib/instalacion/`)

```ts
export interface FilaInstalacion {
  rubro: string | null; nombre: string | null; eslogan: string | null;
  descripcion: string | null; logoUrl: string | null; provincia: string | null;
}

export interface Instalacion {
  tema: Tema;               // 21-temas.md, con marca/eslogan/descripcion ya resueltos
  logoUrl: string | null;
  provincia: Provincia;     // sección 2
  advertencias: string[];
}

/** Pura: aplica la precedencia. `fila` null = sin fila. */
export function resolverInstalacion(fila: FilaInstalacion | null, env: Record<string, string | undefined>): Instalacion;

/** Lee la fila (si hay) y resuelve. Ante error de DB, resuelve sin fila y agrega la advertencia. */
export function obtenerInstalacion(env?: Record<string, string | undefined>): Promise<Instalacion>;

/** Valores que guardó el admin (lo que se edita en /admin/instalacion). Solo admin. */
export function obtenerConfigAdmin(usuario: Usuario): Promise<FilaInstalacion>;

export interface ActualizarInstalacionInput {
  rubro?: string | null; nombre?: string | null; eslogan?: string | null;
  descripcion?: string | null; logoUrl?: string | null; provincia?: string | null;
}
/** Solo admin. Campo ausente = no cambia; null o "" = vuelve al valor por defecto. */
export function actualizarInstalacion(usuario: Usuario, input: ActualizarInstalacionInput): Promise<FilaInstalacion>;
```

Validaciones de `actualizarInstalacion`:

| Campo | Regla | Código de error |
| --- | --- | --- |
| `rubro` | uno de `RUBROS_TEMA` (normalizado como `parsearRubro`) | `RUBRO_TEMA_INVALIDO` |
| `provincia` | código de `PROVINCIAS` (normalizado como `parsearProvincia`) | `PROVINCIA_INVALIDA` |
| `nombre` | hasta 60 caracteres | `TEXTO_DEMASIADO_LARGO` |
| `eslogan` | hasta 80 caracteres | `TEXTO_DEMASIADO_LARGO` |
| `descripcion` | hasta 240 caracteres | `TEXTO_DEMASIADO_LARGO` |
| `logoUrl` | URL `http(s)://` | `LOGO_INVALIDO` |
| (usuario) | no es admin | `FORBIDDEN` |

Los textos se recortan (`trim`); `""` cuenta como `null`.

### Endpoints

| Método | Ruta | Auth | Qué hace |
| --- | --- | --- | --- |
| `GET` | `/api/admin/instalacion` | admin | `{ data: { guardado: FilaInstalacion, efectivo: { rubro, marca, eslogan, descripcion, logoUrl, provincia } } }` |
| `PATCH` | `/api/admin/instalacion` | admin | body `ActualizarInstalacionInput`; devuelve lo mismo que el `GET` |
| `POST` | `/api/archivos/upload?tipo=logo` | admin | sube el logo (`08-archivos.md`), sin `entidadId`; la carpeta es `logo/instalacion/` |

### Cómo se aplica

- `src/app/layout.tsx` usa `obtenerInstalacion()` (con `cache` de React: una lectura
  por request) en vez de `resolverTema(process.env)`.
- `useTema()` devuelve el tema y además `logoUrl`; `useProvincia()` devuelve la
  provincia.
- `<LogoMarca />` muestra el logo si hay y, si no, el ícono del rubro en su cuadrado
  de color primario. Se usa en la portada. Los pines del mapa siguen con el ícono del
  rubro.
- Después de guardar, `/admin/instalacion` recarga la página para ver el tema nuevo.

### Panel `/admin/instalacion`

- **Tema:** una tarjeta por rubro con su nombre, carácter, muestras de color
  (primario, acento, fondo) y tipografía. Se elige uno; el actual queda marcado.
- **Marca:** nombre, eslogan y descripción. Cada campo muestra como placeholder el
  valor que se usa si queda vacío.
- **Logo:** subir o quitar. Vista previa sobre el fondo del tema.
- **Provincia:** selector con las 24 jurisdicciones.
- Un solo botón "Guardar". Link desde la portada del admin.

## 2. Provincias

`src/lib/region/provincias.ts`:

```ts
export interface Provincia {
  codigo: string;                       // slug: "san-juan", "caba", "tierra-del-fuego"…
  nombre: string;                       // "San Juan", "Ciudad Autónoma de Buenos Aires"…
  capital: { lat: number; lon: number }; // centro por defecto del mapa
  bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number }; // aproximado
}
export const PROVINCIAS: readonly Provincia[];   // las 24 jurisdicciones
export const PROVINCIA_POR_DEFECTO = "san-juan";
/** Acepta código o nombre, sin importar mayúsculas, tildes ni espacios ("Córdoba" → "cordoba"). */
export function parsearProvincia(valor: string | undefined | null): Provincia | null;
```

Reglas:
- Son 24 jurisdicciones; los códigos no se repiten; la capital cae dentro del `bbox`.
- El `bbox` es aproximado (rectángulo que contiene la provincia). Tierra del Fuego:
  solo la isla, sin Antártida.

Dónde se usa la provincia (reemplaza a la constante `SAN_JUAN` de Almacenia):
- `18-alcance.md`, plan **plata**: "toda la provincia" = el `bbox` de la provincia
  de la instalación (`/api/tiendas/cercanas`).
- El chip del mapa dice "Toda {nombre}".
- El mapa usa la capital como centro cuando el navegador no da la ubicación.

## 3. Tienda única

### Quién puede crear una tienda

```ts
// src/lib/tiendas/tiendas.ts
/** 22-instalacion.md: admin, o propietario de alguna tienda (sucursal nueva). */
export function exigirPuedeCrearTienda(usuario: Usuario): Promise<void>;
```

- Admin (el cliente, promovido al instalar): siempre. Para el admin no rige el tope
  de tiendas por plan (`20-precios-facturacion.md`).
- Propietario de alguna tienda: puede sumar sucursales, con el tope de su plan.
- Cualquier otro usuario → `CREAR_TIENDA_NO_PERMITIDO` (403): "En {marca} solo el
  negocio puede abrir sucursales."
- Lo exige `POST /api/tiendas` antes de `crearTienda`. `crearTienda` no lo chequea,
  así los tests de otros módulos siguen armando tiendas de prueba.

### Sucursales del negocio (público)

```ts
/** Tiendas activas de dueños con cuenta activa, de la más antigua a la más nueva. */
export function listarSucursales(): Promise<Tienda[]>;
```

`GET /api/tiendas` (pública, sin paginación: son pocas) → `{ data: Tienda[] }`.

### Pantallas

- **Inicio sin sesión:** portada del negocio (logo o ícono, marca, eslogan,
  descripción) y la lista de sucursales con su estado de apertura. Cada sucursal
  lleva a `/tiendas/[id]` (pública). Con una sola sucursal, el botón principal es
  "Ver productos" (a esa tienda); con varias, "Ver sucursales en el mapa"
  (`/login`). Sin sucursales: "Muy pronto" y nada más.
- **Menú con sesión, "Comprar":** el primer acceso es "Productos" (una sucursal:
  `/tiendas/[id]`) o "Sucursales" (varias: `/mapa`). Siguen Listas, Mis pedidos y Mis
  puntos.
- **"¿Tenés un comercio? Publicá tu tienda"** no se muestra. Un admin sin tiendas ve
  "Abrí la tienda de {marca}" → `/mi-tienda?nueva=1`.
- "Nueva sucursal" sigue igual para el propietario.

## 4. Sin datos demo

Permia no trae seed de demo: se quitan `prisma/seed.ts`, `src/lib/seed/` y la opción
`RUN_SEED` del contenedor. Cada cliente carga sus productos.
