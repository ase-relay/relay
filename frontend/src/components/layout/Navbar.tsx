'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrainIcon } from '@/components/icons/TrainIcon'; // Sesuaikan path import jika berbeda

// Kamu bisa memindahkan ini kembali ke '@/constants/navigation' 
const navigationItems = [
  { name: 'Beranda', href: '/', current: true },
  { name: 'Cari Rute', href: '/cari-rute', current: false },
  { name: 'Tentang', href: '/tentang', current: false },
  { name: 'Bantuan', href: '/bantuan', current: false },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary-900">
              <TrainIcon className="text-accent-blue text-3xl" />
              <span>TransitGo</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-semibold transition-colors pb-1 ${
                  item.current
                    ? 'text-neutral-700 border-b-2 border-accent-blue'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button className="bg-accent-blue text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity ml-4">
              Login
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-600 hover:text-primary-600 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2">
            <div className="flex flex-col space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-base font-medium px-2 py-1 transition-colors ${
                    item.current 
                      ? 'text-accent-blue' 
                      : 'text-neutral-600 hover:text-primary-600'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button className="bg-accent-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity w-fit mt-2 mx-2">
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}