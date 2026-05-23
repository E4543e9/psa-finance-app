import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PSA Finance",
  description: "ระบบจัดการการเงินส่วนตัว",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${kanit.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
