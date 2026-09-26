'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiXMark, HiOutlineUser, HiOutlineArrowRightOnRectangle, HiBars3 } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/tentang', label: 'Tentang' },
];

export function MobileNav() {
  const { user, checkingAuth, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }

    handleScroll();
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  function handleOverlayClick() {
    setIsOpen(false);
  }

  function handleLogout() {
    logout();
    setIsOpen(false);
  }

  function handleLinkClick() {
    setIsOpen(false);
  }

  if (checkingAuth) {
    return (
      <header className="sticky top-0 z-40 px-4 pt-8 sm:px-8 sm:pt-8 md:hidden">
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
          <div className="h-8 w-32 animate-pulse rounded-full bg-neutral-200" />
        </nav>
      </header>
    );
  }

  return (
    <>
      {/* Hamburger Button - only visible on mobile (<md) */}
      <header className="sticky top-0 z-40 px-4 pt-8 sm:px-8 sm:pt-8 md:hidden">
        {/* Layer frosted di belakang navbar: muncul saat di-scroll, dengan mask memudar di tepi
            bawah supaya tidak ada garis pemisah antara blur navbar dan background halaman. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 bg-white/85 backdrop-blur-md transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'
            } [mask-image:linear-gradient(to_bottom,black_75%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_75%,transparent)]`}
        />
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

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Buka menu navigasi"
            aria-expanded={isOpen}
            aria-controls="mobile-sidebar"
            className="flex shrink-0 items-center justify-center w-10 h-10 rounded-lg text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-600"
          >
            <HiBars3 className="h-6 w-6" />
          </button>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out md:hidden animate-fadeIn"
          />

          {/* Sidebar */}
          <aside
            ref={sidebarRef}
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)] transform transition-transform duration-300 ease-out md:hidden animate-slideIn"
          >
            <div className="flex h-full flex-col overflow-y-auto">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
                <Link href="/" aria-label="Otewe Beranda" onClick={handleLinkClick}>
                  <Image
                    src="/logo/logo.svg"
                    alt="Otewe"
                    width={120}
                    height={36}
                    className="h-auto w-24"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Tutup menu navigasi"
                  className="flex shrink-0 items-center justify-center w-10 h-10 rounded-lg text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-600"
                >
                  <HiXMark className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-6 py-6 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${link.href === pathname
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-900 hover:bg-neutral-100 hover:text-primary-600'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* User Section / Auth Buttons */}
              <div className="border-t border-neutral-200 p-6">
                {user ? (
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                        <HiOutlineUser className="h-7 w-7 text-primary-600 stroke-[1.25]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-neutral-900 truncate">{user.username}</p>
                        <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="h-px bg-neutral-200" />

                    {/* Profile Link */}
                    <Link
                      href="/profil"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-neutral-900 hover:bg-neutral-100 hover:text-primary-600 transition-colors"
                    >
                      <HiOutlineUser className="h-5 w-5" />
                      Profil Saya
                    </Link>

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      onClick={handleLinkClick}
                      className="flex w-full items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      onClick={handleLinkClick}
                      className="flex w-full items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Daftar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}