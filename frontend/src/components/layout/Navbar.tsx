'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthNavButtons } from './AuthNavButtons';
import { UserDropdown } from './UserDropdown';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/tentang', label: 'Tentang' },
];

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <header className="relative z-20 px-4 pt-8 sm:px-8 sm:pt-8">
      <nav className="mx-auto flex h-19.5 max-w-[1170px] items-center justify-between rounded-[20px] border border-neutral-200/80 bg-white px-7 shadow-[0_10px_25px_rgba(15,23,42,0.10)] sm:px-11">
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
              className={`text-md transition-colors hover:text-primary-600 ${link.href === pathname ? 'font-semibold text-primary-600' : 'text-neutral-900'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {user ? <UserDropdown /> : <AuthNavButtons />}
      </nav>
    </header>
  );
}
