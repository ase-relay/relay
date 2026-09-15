'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const navLinks = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/tentang', label: 'Tentang' },
];

export function Navbar() {
  // TODO: Replace with actual auth state
  const [user] = useState<{ username: string } | null>(null);

  return (
    <header className="relative z-20 px-4 pt-3 sm:px-8 sm:pt-4">
      <nav className="mx-auto flex h-19.5 max-w-6xl items-center justify-between rounded-[20px] border border-neutral-200/80 bg-white px-7 shadow-[0_10px_25px_rgba(15,23,42,0.10)] sm:px-11">
        <Link href="/beranda" aria-label="Otewe Beranda">
          <Image
            src="/logo/logo.png"
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
              className={`text-sm transition-colors hover:text-primary-600 ${link.href === '/beranda' ? 'font-semibold text-neutral-900' : 'text-neutral-900'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {!user ? (
          <div className="flex shrink-0 items-center gap-6">
            <Link
              href="/login"
              className="text-base font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary-600 px-10 py-2.5 font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Daftar
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4 20c0-3.5 3.6-5.5 8-5.5s8 2 8 5.5" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">{user.username}</span>
          </div>
        )}
      </nav>
    </header>
  );
}
