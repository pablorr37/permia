"use client";

import { SessionProvider } from "next-auth/react";
import { TemaProvider, type InstalacionCliente } from "@/components/tema/TemaProvider";

export function Providers({ instalacion, children }: { instalacion: InstalacionCliente; children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TemaProvider instalacion={instalacion}>{children}</TemaProvider>
    </SessionProvider>
  );
}
