'use client';

import Link from 'next/link';
import { HiChevronRight } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import ModaIcon from '@/components/icons/admin/ModaIcon';
import RuteIcon from '@/components/icons/admin/RuteIcon';
import HalteIcon from '@/components/icons/admin/HalteIcon';
import TarifIcon from '@/components/icons/admin/TarifIcon';

const stats = [
    {
        title: 'Moda Transportasi',
        value: 3,
        caption: 'moda tersedia',
        href: '/admin/moda',
        icon: <ModaIcon color="#004BDC" className="h-7 w-7" />,
    },
    {
        title: 'Rute',
        value: 12,
        caption: 'rute tersedia',
        href: '/admin/rute',
        icon: <RuteIcon color="#004BDC" className="h-7 w-7" />,
    },
    {
        title: 'Halte',
        value: 48,
        caption: 'halte tersedia',
        href: '/admin/halte',
        icon: <HalteIcon color="#004BDC" className="h-7 w-7" />,
    },
    {
        title: 'Tarif',
        value: 8,
        caption: 'data tarif tersedia',
        href: '/admin/tarif',
        icon: <TarifIcon color="#004BDC" className="h-7 w-7" />,
    },
];

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const displayName = user?.username ?? 'Budi Eko';

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Selamat datang, {displayName}
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Kelola dan pantau data Otewe
            </p>

            <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.title}
                        href={stat.href}
                        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition hover:border-primary-200 hover:shadow-md"
                    >
                        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eaf2ff] text-primary-600">
                            {stat.icon}
                        </span>
                        <p className="mt-6 text-base font-semibold text-neutral-900">
                            {stat.title}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-4xl font-bold text-neutral-900">
                                {stat.value}
                            </span>
                            <HiChevronRight className="h-5 w-5 text-neutral-400" />
                        </div>
                        <p className="mt-1 text-[15px] text-neutral-500">
                            {stat.caption}
                        </p>
                    </Link>
                ))}
            </div>
        </>
    );
}
