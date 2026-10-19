import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "HAIX Nova — Command Center Nacional",
  description: "Sistema Nacional de Control de Agentes de Tránsito — HAIX Technologies Colombia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
