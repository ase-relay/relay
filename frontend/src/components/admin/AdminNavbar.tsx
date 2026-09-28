'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HiBars3, HiOutlineUser } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

type AdminNavbarProps = {
  /** Dipanggil saat tombol hamburger (hanya mobile) di-tap. */
  onMenuClick?: () => void;
};

export function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const { user } = useAuth();
  const displayName = user?.username || 'Admin';
  const displayRole = user?.role === 'ADMIN' ? 'Admin' : 'User';

  return (
    <header className="sticky top-0 z-40 flex h-24 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:h-27.75 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Hamburger - hanya tampil di < lg */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu navigasi"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-neutral-900 transition-colors hover:bg-neutral-100 lg:hidden"
        >
          <HiBars3 className="h-7 w-7" />
        </button>

        <Link href="/">
          <Image
            src="/logo/logo.svg"
            alt="Otewe"
            width={176}
            height={82}
            priority
            className="h-12 w-auto sm:h-13.5 lg:h-15"
          />
        </Link>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <HiOutlineUser className="h-6 w-6 shrink-0 text-neutral-800" />
        <div className="leading-tight">
          <p className="text-base font-bold text-neutral-900">{displayName}</p>
          <p className="text-sm text-neutral-500">{displayRole}</p>
        </div>
      </div>
    </header>
  );
}
