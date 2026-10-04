import { AuthHeroSection } from "@/components/auth/AuthHeroSection";

// Layout ini dipakai bersama oleh login, register, lupa-password, dan reset-password.
// Next.js tidak me-mount ulang layout saat berpindah antar halaman di route group ini,
// jadi hero (state carousel, skala kanvas) tetap bertahan.
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="grid min-h-screen bg-white lg:grid-cols-[3fr_2fr]">
            <AuthHeroSection />
            {children}
        </main>
    );
}