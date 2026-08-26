import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://monolith.adithyakrishnan.com";
const SITE_TITLE = "Monolith — Central Audit Telemetry & MCP Server";
const SITE_DESCRIPTION =
  "Documentation portal and Model Context Protocol server for Monolith — the audit trail and BigQuery data warehouse behind continuum-home, Chayakudikanpooyalo, and every app that streams through monolith-api.";

export const viewport: Viewport = {
  themeColor: "#F5F1E7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Monolith",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Monolith",
  authors: [{ name: "Adithya Krishnan", url: "https://adithyakrishnan.com" }],
  keywords: [
    "Monolith",
    "Audit Telemetry",
    "Data Warehouse",
    "BigQuery Analytics",
    "Event Ingestion Engine",
    "Model Context Protocol",
    "MCP Server",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Monolith",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Monolith",
              operatingSystem: "Web",
              applicationCategory: "DeveloperApplication",
              description: SITE_DESCRIPTION,
              url: SITE_URL,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
