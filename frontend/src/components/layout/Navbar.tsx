'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AuthNavButtons } from './AuthNavButtons';
import { UserDropdown } from './UserDropdown';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';

const navLinks = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/tentang', label: 'Tentang' },
];

/* -------------------------------------------------------------------------- */
/*  State level-modul: bertahan selama navigasi client-side                    */
/*                                                                            */
/*  Navbar di-render di tiap halaman, jadi komponennya di-mount ulang setiap  */
/*  pindah halaman. Dua variabel di bawah "mengingat" kondisi sebelumnya      */
/*  supaya (1) skeleton tidak muncul lagi dan (2) animasi bisa dimulai dari   */
/*  posisi link yang aktif sebelumnya.                                         */
/*  Aman untuk SSR: nilainya hanya diubah di dalam effect (client saja).      */
/* -------------------------------------------------------------------------- */
let hasHydrated = false;

type NavView = {
  /** Link acuan untuk posisi gradient (tetap ingat link terakhir yang aktif) */
  anchor: number;
  /** Link yang sedang aktif; -1 = halaman lain (warna biru dipudarkan) */
  active: number;
  /** Link yang tadinya dipudarkan di tengah dan baru "dilepas"; -1 = tidak ada */
  ghost: number;
};

let lastNavView: NavView | null = null;

function initialNavView(target: number): NavView {
  // Muat pertama kali: langsung tampil statis, tanpa animasi
  if (!lastNavView) return { anchor: target, active: target, ghost: -1 };
  // Sebelumnya tidak ada link aktif: mulai dari "pudar" di posisi tujuan, lalu fade-in
  if (lastNavView.anchor < 0 && target >= 0) return { anchor: target, active: -1, ghost: -1 };
  return lastNavView;
}

function nextNavView(prev: NavView, target: number): NavView {
  if (prev.active === target) return prev;
  if (target >= 0) {
    return { anchor: target, active: target, ghost: prev.active < 0 ? prev.anchor : -1 };
  }
  return { anchor: prev.anchor, active: -1, ghost: -1 };
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useNavHighlight(target: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<NavView>(() => initialNavView(target));

  useIsoLayoutEffect(() => {
    // Paksa browser menghitung style awal dulu agar perubahan berikutnya benar-benar ditransisikan
    void containerRef.current?.offsetWidth;
    setView((prev) => nextNavView(prev, target));
  }, [target]);

  useEffect(() => {
    lastNavView = view;
  }, [view]);

  return { view, containerRef };
}

/* -------------------------------------------------------------------------- */
/*  Gaya per link                                                              */
/*                                                                            */
/*  Gradient 3 bagian [abu | biru | abu] di-clip ke teks. Posisinya:           */
/*    0%   -> abu (link ada di KIRI link aktif)                                */
/*    50%  -> biru (link aktif)                                                */
/*    100% -> abu (link ada di KANAN link aktif)                               */
/*  Perpindahan nilai inilah yang membuat warna "menyapu" ke kiri/kanan.       */
/*  Saat pindah ke halaman lain, posisi dibiarkan dan warna biru dipudarkan.   */
/* -------------------------------------------------------------------------- */
const IDLE_COLOR = '#0f172a'; // = neutral-900
const ACCENT_COLOR = '#004BDC'; // = primary-600

const SWEEP_MS = 400;
const FADE_MS = 300;
const HOVER_MS = 150;
const ENTER_DELAY_MS = 100;

function getLinkStyle(index: number, view: NavView): CSSProperties {
  const { anchor, active, ghost } = view;
  const faded = active < 0;
  const isGhost = index === ghost;

  const position = anchor < 0 || index < anchor ? 0 : index === anchor ? 50 : 100;
  // Warna biru disembunyikan pada link "ghost" (yang tadinya sudah pudar) agar tidak berkedip biru
  const accent = faded || (isGhost && ghost !== active) ? IDLE_COLOR : ACCENT_COLOR;
  const fadesAccent = faded || isGhost;
  const delay = index === active && ghost < 0 ? ENTER_DELAY_MS : 0;

  return {
    backgroundPosition: `${position}% 0`,
    fontWeight: index === active ? 600 : 400,
    '--nav-accent': accent,
    // urutan: background-position, --nav-accent, --nav-idle, font-weight
    transitionDuration: `${SWEEP_MS}ms, ${fadesAccent ? FADE_MS : 0}ms, ${HOVER_MS}ms, ${FADE_MS}ms`,
    transitionDelay: `${delay}ms, 0ms, 0ms, 0ms`,
  } as CSSProperties;
}

export function Navbar() {
  const { user, checkingAuth } = useAuth();
  const pathname = usePathname();
  const activeIndex = navLinks.findIndex((link) => link.href === pathname);
  const { view, containerRef } = useNavHighlight(activeIndex);

  // Scroll-aware: transparan saat di puncak halaman agar efek glow landing page tetap terlihat,
  // diberi background frosted saat di-scroll agar konten tidak bocor terlihat di sekitar pill navbar.
  const [scrolled, setScrolled] = useState(false);
  // Nilai awal false hanya untuk hydration pertama (harus sama dengan server).
  // Setelah itu (navigasi antar halaman) langsung true supaya skeleton tidak berkedip.
  const [mounted, setMounted] = useState(hasHydrated);

  useEffect(() => {
    hasHydrated = true;
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Mobile Navigation (hamburger + sidebar) - only visible on <md */}
      <MobileNav />

      {/* Desktop Navigation - only visible on md+ */}
      <header className="hidden md:block md:sticky md:top-0 md:z-40 md:px-8 md:pt-8">
        {/* Layer frosted di belakang navbar: muncul saat di-scroll, dengan mask memudar di tepi
            bawah supaya tidak ada garis pemisah antara blur navbar dan background halaman. */}
        {mounted && (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 -z-10 bg-white/85 backdrop-blur-md transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'
              } [-webkit-mask-image:linear-gradient(to_bottom,black_75%,transparent)]`}
          />
        )}
        {/* Grid 3 kolom (1fr | auto | 1fr): link menu selalu tepat di tengah dan tidak bergeser
            walau lebar sisi kanan berubah (skeleton -> dropdown user / tombol Masuk-Daftar). */}
        <nav className="mx-auto grid h-19.5 max-w-292.5 grid-cols-[1fr_auto_1fr] items-center rounded-[20px] border border-neutral-200/80 bg-white px-7 shadow-[0_10px_25px_rgba(15,23,42,0.10)] sm:px-11">
          <Link href="/" aria-label="Otewe Beranda" className="justify-self-start">
            <Image
              src="/logo/logo.svg"
              alt="Otewe"
              width={120}
              height={36}
              priority
              className="h-auto w-28"
            />
          </Link>

          <div ref={containerRef} className="hidden items-center gap-16 md:flex">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                data-label={link.label}
                aria-current={index === activeIndex ? 'page' : undefined}
                className="nav-link text-md"
                style={getLinkStyle(index, view)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex justify-end">
            {!mounted || checkingAuth ? (
              <Skeleton variant="rounded" className="h-8 w-32" />
            ) : user ? (
              <UserDropdown />
            ) : (
              <AuthNavButtons />
            )}
          </div>
        </nav>
      </header>
    </>
  );
}