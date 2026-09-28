'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HiXMark } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import DashboardIcon from '@/components/icons/admin/DashboardIcon';
import TarifIcon from '@/components/icons/admin/TarifIcon';
import RuteIcon from '@/components/icons/admin/RuteIcon';
import HalteIcon from '@/components/icons/admin/HalteIcon';
import ModaIcon from '@/components/icons/admin/ModaIcon';
import LogoutIcon from '@/components/icons/admin/LogoutIcon';

type AdminSidebarProps = {
    /** Kontrol drawer sidebar di mobile (default false). Di desktop sidebar selalu tampil. */
    open?: boolean;
    /** Dipanggil saat drawer mobile ditutup (tombol X, backdrop, atau klik link). */
    onClose?: () => void;
};

const dataMenus = [
    { href: '/admin/tarif', label: 'Data Tarif Transum', icon: TarifIcon },
    { href: '/admin/rute', label: 'Data Rute', icon: RuteIcon },
    { href: '/admin/halte', label: 'Data Halte', icon: HalteIcon },
    { href: '/admin/moda', label: 'Data Moda', icon: ModaIcon },
];

export function AdminSidebar({ open = false, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    useEffect(() => {
        if (!open) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose?.();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    function handleLogout() {
        logout();
        onClose?.();
        router.push('/login');
    }

    const isDashboardActive = pathname === '/admin';

    return (
        <>
            {/* Backdrop gelap untuk drawer mobile */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed top-0 left-0 z-50 flex h-screen w-70 shrink-0 flex-col rounded-r-3xl bg-primary-600 px-4 py-6 transition-transform duration-300 ease-out lg:static lg:h-full lg:min-h-0 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Tombol close - hanya tampil di mobile */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup sidebar"
                    className="absolute top-5 right-4 flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
                >
                    <HiXMark className="h-6 w-6" />
                </button>

                <nav className="flex flex-1 flex-col overflow-y-auto">
                    <Link
                        href="/admin"
                        onClick={onClose}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-semibold transition-colors ${isDashboardActive
                            ? 'bg-white text-primary-600'
                            : 'text-white hover:bg-white/10'
                            }`}
                    >
                        <DashboardIcon color={isDashboardActive ? "#004BDC" : "white"} className="h-5 w-5 shrink-0" />
                        Dashboard
                    </Link>

                    <p className="mt-6 mb-2 px-4 text-[13px] font-semibold tracking-wider text-white uppercase">
                        Kelola Data
                    </p>

                    <div className="flex flex-col space-y-2.5">
                        {dataMenus.map((menu) => {
                            const Icon = menu.icon;
                            const isActive = pathname === menu.href;
                            return (
                                <Link
                                    key={menu.href}
                                    href={menu.href}
                                    onClick={onClose}
                                    className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-colors ${isActive
                                        ? 'bg-white text-primary-600'
                                        : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Icon color={isActive ? '#004BDC' : 'white'} className="h-6 w-6 shrink-0" />
                                    {menu.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 pt-4 flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                    <LogoutIcon color="white" className="h-6 w-6 shrink-0" />
                    Keluar
                </button>
            </aside>
        </>
    );
}
