'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiChevronDown, HiOutlineUser, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

export function UserDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex shrink-0 items-center gap-4 rounded-lg px-2 py-2 text-base font-medium text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-600 cursor-pointer"
        aria-label={`Menu pengguna ${user.username}`}
      >
        <HiOutlineUser aria-hidden="true" className="h-6 w-6" strokeWidth={1.25} />
        <span>{user.username}</span>
        <HiChevronDown aria-hidden="true" className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.15)] border border-neutral-200 z-30">
          <p className="text-lg font-semibold text-neutral-900">{user.username}</p>
          <p className="text-sm text-neutral-500">{user.email}</p>

          <div className="my-3 h-px bg-neutral-200" />

          <Link
            href="/profil"
            className="flex items-center gap-3 py-2 text-sm font-medium text-neutral-900 hover:text-primary-600"
            onClick={() => setIsOpen(false)}
          >
            <HiOutlineUser className="h-5 w-5" />
            Profil Saya
          </Link>

          <div className="my-3 h-px bg-neutral-200" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
          >
            <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
