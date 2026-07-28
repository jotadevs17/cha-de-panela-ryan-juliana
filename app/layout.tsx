import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const previewImage = "/hero-table.png";
const previewImageAlt = "Chá de Panela de Ryan e Juliana";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [{ url: previewImage, type: "image/jpeg" }],
    apple: [{ url: previewImage, type: "image/jpeg" }]
  },
  title: "Chá de Panela | Ryan e Juliana",
  description: "Convite, lista de presentes e reservas do Chá de Panela de Ryan e Juliana.",
  openGraph: {
    title: "Chá de Panela de Ryan e Juliana",
    description: "Celebre com Ryan e Juliana em 11/10/2026, às 12h.",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: previewImage,
        width: 900,
        height: 1600,
        alt: previewImageAlt
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Chá de Panela de Ryan e Juliana",
    description: "Convite, lista de presentes e reservas.",
    images: [
      {
        url: previewImage,
        alt: previewImageAlt
      }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
