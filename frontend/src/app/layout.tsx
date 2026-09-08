import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TransitGo - Rekomendasi Rute Transportasi Umum Bandung-Cimahi",
  description: "Aplikasi rekomendasi rute transportasi umum wilayah Bandung-Cimahi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
