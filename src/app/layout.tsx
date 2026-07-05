import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/hooks";
import { SpaRedirectHandler } from "@/components/layout/SpaRedirectHandler";
import { LiveActivityFeed } from "@/components/shared/LiveActivityFeed";

const GA_MEASUREMENT_ID = "G-Q63XPNYFTW";

export const metadata: Metadata = {
  title: "ResiGrid — Your Rent. Your Reputation. Zero Fees.",
  description:
    "ResiGrid is the world's only property management platform built on Fair Data. Transform on-time payments into a globally recognized RGE Score. Fee-free rent payments for tenants. Zero-risk leasing for landlords.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ResiGrid",
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "any" },
    ],
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b1f3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh flex flex-col bg-neutral-50">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <AuthProvider>
          <SpaRedirectHandler />
          {children}
          <LiveActivityFeed />
        </AuthProvider>
      </body>
    </html>
  );
}
