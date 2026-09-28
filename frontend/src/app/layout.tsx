import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Otewe - Rekomendasi Rute Transportasi Umum Bandung-Cimahi",
  description: "Aplikasi rekomendasi rute transportasi umum wilayah Bandung-Cimahi",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo/favicon-180.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Otewe',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#004BDC',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden font-sans">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <AuthProvider>
            <main className="flex-1">{children}</main>
          </AuthProvider>
        </GoogleOAuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
