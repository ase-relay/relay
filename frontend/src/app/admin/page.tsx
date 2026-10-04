'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiChevronRight } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import ModaIcon from '@/components/icons/admin/ModaIcon';
import RuteIcon from '@/components/icons/admin/RuteIcon';
import HalteIcon from '@/components/icons/admin/HalteIcon';
import TarifIcon from '@/components/icons/admin/TarifIcon';
import type { Moda } from '@/lib/types/moda';
import type { Halte } from '@/lib/types/halte';
import type { Rute } from '@/lib/types/rute';
import type { Tarif } from '@/lib/types/tarif';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// Grid kartu ringkasan: 1 kolom di mobile, 2 kolom di sm-lg, 4 kolom mulai xl.
// Kartu sengaja tetap 2 kolom di `md` dan `lg`: di `lg` sidebar permanen sudah memakan ~280px,
// jadi 4 kolom baru muat nyaman di `xl`.
const gridClass = 'mt-6 grid grid-cols-1 gap-4 sm:mt-9 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4 xl:gap-6';
const cardClass =
    'min-w-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-6 xl:p-5 2xl:p-6';

interface DashboardCounts {
    moda: number | null;
    rute: number | null;
    halte: number | null;
    tarif: number | null;
}

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<DashboardCounts>({ moda: null, rute: null, halte: null, tarif: null });

    useEffect(() => {
        let cancelled = false;

        const fetchCounts = async () => {
            const [modaRes, ruteRes, halteRes, tarifRes] = await Promise.allSettled([
                api.get<{ success: boolean; data: Moda[] }>('/transport/moda'),
                api.get<{ success: boolean; data: Rute[] }>('/transport/rute'),
                api.get<{ success: boolean; data: Halte[] }>('/transport/halte'),
                api.get<{ success: boolean; data: Tarif[] }>('/transport/tarif'),
            ]);

            if (cancelled) return;

            const handleAuthError = (result: PromiseRejectedResult) => {
                const status = (result.reason as { response?: { status?: number } })?.response?.status;
                if (status === 401) {
                    router.push('/login');
                } else if (status === 403) {
                    router.push('/beranda');
                }
            };

            const next: DashboardCounts = { moda: null, rute: null, halte: null, tarif: null };

            if (modaRes.status === 'fulfilled' && modaRes.value.data.success) {
                next.moda = modaRes.value.data.data.filter((moda) => moda.isActive).length;
            } else if (modaRes.status === 'rejected') {
                handleAuthError(modaRes);
            }

            if (ruteRes.status === 'fulfilled' && ruteRes.value.data.success) {
                next.rute = ruteRes.value.data.data.filter((rute) => rute.isActive).length;
            } else if (ruteRes.status === 'rejected') {
                handleAuthError(ruteRes);
            }

            if (halteRes.status === 'fulfilled' && halteRes.value.data.success) {
                next.halte = halteRes.value.data.data.filter((halte) => halte.isActive).length;
            } else if (halteRes.status === 'rejected') {
                handleAuthError(halteRes);
            }

            if (tarifRes.status === 'fulfilled' && tarifRes.value.data.success) {
                next.tarif = tarifRes.value.data.data.length;
            } else if (tarifRes.status === 'rejected') {
                handleAuthError(tarifRes);
            }

            setCounts(next);
            setLoading(false);
        };

        fetchCounts();
        return () => {
            cancelled = true;
        };
    }, [router]);

    const stats = [
        {
            title: 'Moda Transportasi',
            value: counts.moda,
            caption: 'moda aktif',
            href: '/admin/moda',
            icon: <ModaIcon color="#004BDC" className="h-6 w-6 sm:h-7 sm:w-7" />,
        },
        {
            title: 'Rute',
            value: counts.rute,
            caption: 'rute aktif',
            href: '/admin/rute',
            icon: <RuteIcon color="#004BDC" className="h-6 w-6 sm:h-7 sm:w-7" />,
        },
        {
            title: 'Halte',
            value: counts.halte,
            caption: 'halte aktif',
            href: '/admin/halte',
            icon: <HalteIcon color="#004BDC" className="h-6 w-6 sm:h-7 sm:w-7" />,
        },
        {
            title: 'Tarif',
            value: counts.tarif,
            caption: 'data tarif',
            href: '/admin/tarif',
            icon: <TarifIcon color="#004BDC" className="h-6 w-6 sm:h-7 sm:w-7" />,
        },
    ];

    return (
        <>
            <h1 className="text-2xl font-bold break-words text-neutral-900 sm:text-3xl xl:text-4xl">
                Selamat datang{user?.username ? `, ${user.username}` : ''}
            </h1>
            <p className="mt-2 text-base text-neutral-500 sm:text-lg xl:text-xl">
                Kelola dan pantau data Otewe
            </p>

            {loading ? (
                <div className={gridClass}>
                    <span role="status" className="sr-only">
                        Memuat ringkasan data...
                    </span>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`dashboard-skeleton-${index}`}
                            aria-hidden="true"
                            className={cardClass}
                        >
                            <Skeleton variant="rounded" className="h-12 w-12 sm:h-14 sm:w-14" />
                            <Skeleton variant="text" className="mt-4 h-5 w-32 max-w-full sm:mt-6" />
                            <div className="mt-2 flex items-center justify-between">
                                <Skeleton variant="text" className="h-9 w-14 sm:h-10 sm:w-16" />
                                <Skeleton variant="circle" className="h-5 w-5" />
                            </div>
                            <Skeleton variant="text" className="mt-1 h-4 w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={gridClass}>
                    {stats.map((stat) => (
                        <Link
                            key={stat.title}
                            href={stat.href}
                            className={`${cardClass} transition hover:border-primary-200 hover:shadow-md`}
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf2ff] text-primary-600 sm:h-14 sm:w-14">
                                {stat.icon}
                            </span>
                            <p className="mt-4 text-sm font-semibold text-neutral-900 sm:mt-6 sm:text-base">
                                {stat.title}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                                    {stat.value ?? '-'}
                                </span>
                                <HiChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />
                            </div>
                            <p className="mt-1 text-sm text-neutral-500 sm:text-[15px]">
                                {stat.caption}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}