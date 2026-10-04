"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthSlideBudget } from "@/components/auth/AuthSlideBudget";
import { AuthSlideRoute } from "@/components/auth/AuthSlideRoute";
import { AuthSlideTransport } from "@/components/auth/AuthSlideTransport";
import { CarouselNavButton } from "@/components/ui/CarouselNavButton";

const slides = [AuthSlideBudget, AuthSlideTransport, AuthSlideRoute];

// Kolom kiri pada desain acuan (frame 1440x1024, kolom kiri 3/5 lebar).
// Semua elemen diposisikan dalam piksel desain ini, lalu seluruh "kanvas"
// di-scale agar muat di section (lihat heroScale di bawah).
const HERO_DESIGN_WIDTH = 863;
const HERO_DESIGN_HEIGHT = 1024;

// Slide berganti otomatis setiap 3 detik dengan transisi pudar (crossfade).
const SLIDE_INTERVAL_MS = 3000;

export function AuthHeroSection() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [heroScale, setHeroScale] = useState<number | null>(null);
    const heroRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = heroRef.current;
        if (!el) return;
        const update = () => {
            if (el.clientWidth === 0 || el.clientHeight === 0) return; // tersembunyi di bawah breakpoint lg
            setHeroScale(Math.min(el.clientWidth / HERO_DESIGN_WIDTH, el.clientHeight / HERO_DESIGN_HEIGHT));
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Autoplay. Efek dijalankan ulang setiap activeSlide berubah, sehingga timer
    // otomatis mulai dari 3 detik lagi saat user menekan tombol prev/next/dots.
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((current) => (current + 1) % slides.length);
        }, SLIDE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [activeSlide]);

    function moveSlide(direction: number) {
        setActiveSlide((current) => (current + direction + slides.length) % slides.length);
    }

    return (
        <section
            ref={heroRef}
            className="relative hidden min-h-screen overflow-hidden border-r border-neutral-200 bg-[linear-gradient(180deg,#fff_0%,#edf6ff_100%)] lg:block"
        >
            {/* Kanvas desain 863x1024, di-scale proporsional & dipusatkan di section */}
            <div
                className="absolute top-1/2 left-1/2 transition-opacity duration-300"
                style={{
                    width: HERO_DESIGN_WIDTH,
                    height: HERO_DESIGN_HEIGHT,
                    transform: `translate(-50%, -50%) scale(${heroScale ?? 1})`,
                    opacity: heroScale === null ? 0 : 1,
                }}
            >
                <Link href="/" className="absolute top-[61px] left-[58px] z-10">
                    <Image src="/logo/logo.svg" alt="Otewe" width={176} height={53} priority className="h-auto w-44 cursor-pointer" />
                </Link>

                <div className="pointer-events-none absolute top-[212px] left-[26px] h-[534px] w-[793px]">
                    <Image src="/images/Login_Onboard.png" alt="Ilustrasi bus Otewe" fill priority className="object-contain object-center" sizes="60vw" />
                </div>

                <div className="absolute top-[215px] left-[102px] z-10">
                    <h1 className="text-5xl leading-[56px] font-extrabold tracking-tight text-black">Selamat datang di<br />otewe!</h1>
                    <p className="mt-[17px] max-w-sm text-base leading-[30px] text-neutral-600">Temukan rute transportasi terbaik untuk perjalananmu dengan mudah, cepat, dan hemat.</p>
                </div>

                <div className="absolute top-[685px] left-[84px] z-10 h-[257px] w-[699px] rounded-[20px] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
                    <div className="relative h-full overflow-hidden rounded-[20px]">
                        {/* Semua slide ditumpuk; yang aktif opacity-100, lainnya pudar ke opacity-0 */}
                        {slides.map((Slide, index) => (
                            <div
                                key={index}
                                aria-hidden={index !== activeSlide}
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            >
                                <Slide />
                            </div>
                        ))}
                    </div>
                    <CarouselNavButton direction="previous" size="sm" onClick={() => moveSlide(-1)} className="absolute top-1/2 -left-[44.5px] -translate-y-1/2" />
                    <CarouselNavButton direction="next" size="sm" onClick={() => moveSlide(1)} className="absolute top-1/2 -right-[44.5px] -translate-y-1/2" />
                </div>

                <div className="absolute top-[969px] left-[392px] z-10 flex gap-[19.5px]">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            aria-label={`Pilih slide ${index + 1}`}
                            onClick={() => setActiveSlide(index)}
                            className={`h-3 w-3 cursor-pointer rounded-full transition ${index === activeSlide ? "bg-primary-600" : "bg-[#d9d9d9]"}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}