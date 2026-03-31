import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AppThemeProvider from "@/components/providers/AppThemeProvider";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BarakaFlow — Halal Personal Finance",
  description: "Track your income, expenses, and Zakat with BarakaFlow — the halal budgeting app for Muslims in the UAE.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarakaFlow",
  },
  icons: {
    apple: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
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
          {children}
          <SpeedInsights />
        </AppThemeProvider>
      </body>
    </html>
  );
}
