import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miru-Ecommerce",
  description:
    "Plataforma centralizada de pedidos, garantías, transportadoras y finanzas para dropshipping.",
  icons: {
    icon: "/brand/logo-mark.svg",
    shortcut: "/brand/logo-mark.svg",
    apple: "/brand/logo-mark.svg",
  },
  openGraph: {
    title: "Miru-Ecommerce — Panel Centralizado de Dropshipping",
    description:
      "Plataforma centralizada de pedidos, garantías, transportadoras y finanzas para dropshipping (Dropi, MasterShop, Effi).",
    type: "website",
    locale: "es_CO",
  },
};

export const viewport: Viewport = {
  themeColor: "#006A6A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-surface-canvas)] text-[var(--color-neutral-900)] antialiased">
        {children}
      </body>
    </html>
  );
}
