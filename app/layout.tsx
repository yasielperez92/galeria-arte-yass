import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")),
  title: {
    default: "Yass — Estudio de arte",
    template: "%s | Yass — Estudio de arte",
  },
  description: "Pintura, grabado, ilustración y escultura de Yasiel Pérez Díaz.",
  applicationName: "Estudio de Arte Yass",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Estudio de Arte Yass",
    title: "Yass — Estudio de arte",
    description: "Pintura, grabado, ilustración y escultura de Yasiel Pérez Díaz.",
    images: [{ url: "/obras/obra1.webp", alt: "Obra del Estudio de Arte Yass" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yass — Estudio de arte",
    description: "Pintura, grabado, ilustración y escultura de Yasiel Pérez Díaz.",
    images: ["/obras/obra1.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
