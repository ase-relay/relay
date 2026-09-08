'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/cara-kerja', label: 'Cara Kerja' },
    { href: '/tentang', label: 'Tentang' },
];

export function LandingPageNavbar() {
    const pathname = usePathname();

    return (
        <div className="sticky top-5 z-50 px-4 sm:px-6 lg:px-8">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-3xl border border-neutral-100 bg-white px-6 shadow-sm">
                <Link href="/" className="flex shrink-0 items-center">
                    <Image
                        src="/logo/logo.png"
                        alt="otewe"
                        width={120}
                        height={36}
                        className="h-auto w-28"
                        priority
                    />
                </Link>

                <div className="hidden items-center gap-10 md:flex">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-base transition-colors hover:text-primary-600 ${isActive
                                    ? 'font-semibold text-neutral-900'
                                    : 'font-normal text-neutral-700'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex shrink-0 items-center gap-6">
                    <Link
                        href="/login"
                        className="text-base font-medium text-primary-600 transition-colors hover:text-primary-700"
                    >
                        Masuk
                    </Link>
                    <Link
                        href="/register"
                        className="rounded-full bg-primary-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-700"
                    >
                        Daftar
                    </Link>
                </div>
            </nav>
        </div>
    );
}
