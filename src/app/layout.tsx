import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import AppThemeProvider from "@/components/providers/AppThemeProvider";
import InstallPWAOverlay from "@/components/pwa/InstallPWAOverlay";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BarakahFlow — Halal Personal Finance",
  description: "Track your income, expenses, and Zakat with BarakahFlow — the halal budgeting app for Muslims in the UAE.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarakahFlow",
  },
  icons: {
    icon: [
      { url: "/icon-192.png?v=2" },
      { url: "/icon-512.png?v=2" },
    ],
    apple: [
      { url: "/icon-512.png?v=2" },
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", rel: "apple-touch-icon" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white"
        suppressHydrationWarning
      >
        <AppThemeProvider>
          <InstallPWAOverlay />
          {children}
          <Analytics />
          <SpeedInsights />
        </AppThemeProvider>
      </body>
    </html>
  );
}
