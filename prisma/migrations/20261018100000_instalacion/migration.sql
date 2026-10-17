-- CreateTable
CREATE TABLE "instalacion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "rubro" TEXT,
    "nombre" TEXT,
    "eslogan" TEXT,
    "descripcion" TEXT,
    "logo_url" TEXT,
    "provincia" TEXT,
    "actualizada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instalacion_pkey" PRIMARY KEY ("id")
);

-- 22-instalacion.md: fila única.
ALTER TABLE "instalacion" ADD CONSTRAINT "instalacion_fila_unica" CHECK ("id" = 1);
