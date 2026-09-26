'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export function Navbar() {
  const { user, checkingAuth } = useAuth();
  const pathname = usePathname();

  // Scroll-aware: transparan saat di puncak halaman agar efek glow landing page tetap terlihat,
  // diberi background frosted saat di-scroll agar konten tidak bocor terlihat di sekitar pill navbar.
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
        <nav className="mx-auto flex h-19.5 max-w-292.5 items-center justify-between rounded-[20px] border border-neutral-200/80 bg-white px-7 shadow-[0_10px_25px_rgba(15,23,42,0.10)] sm:px-11">
          <Link href="/" aria-label="Otewe Beranda">
            <Image
              src="/logo/logo.svg"
              alt="Otewe"
              width={120}
              height={36}
              priority
              className="h-auto w-28"
            />
          </Link>

          <div className="hidden items-center gap-16 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-md transition-colors hover:text-primary-600 ${link.href === pathname ? 'font-semibold text-primary-600' : 'text-neutral-900'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {!mounted || checkingAuth ? (
            <Skeleton variant="rounded" className="h-8 w-32" />
          ) : user ? (
            <UserDropdown />
          ) : (
            <AuthNavButtons />
          )}
        </nav>
      </header>
    </>
  );
}