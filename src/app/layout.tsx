import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai_Looped, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

const thai = IBM_Plex_Sans_Thai_Looped({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
});

const latin = Geist({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PSA Finance",
  description: "ระบบจัดการการเงินส่วนตัว",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${thai.variable} ${latin.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
