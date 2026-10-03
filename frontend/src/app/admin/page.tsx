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
            icon: <ModaIcon color="#004BDC" className="h-7 w-7" />,
        },
        {
            title: 'Rute',
            value: counts.rute,
            caption: 'rute aktif',
            href: '/admin/rute',
            icon: <RuteIcon color="#004BDC" className="h-7 w-7" />,
        },
        {
            title: 'Halte',
            value: counts.halte,
            caption: 'halte aktif',
            href: '/admin/halte',
            icon: <HalteIcon color="#004BDC" className="h-7 w-7" />,
        },
        {
            title: 'Tarif',
            value: counts.tarif,
            caption: 'data tarif',
            href: '/admin/tarif',
            icon: <TarifIcon color="#004BDC" className="h-7 w-7" />,
        },
    ];

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Selamat datang{user?.username ? `, ${user.username}` : ''}
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Kelola dan pantau data Otewe
            </p>

            {loading ? (
                <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <span role="status" className="sr-only">
                        Memuat ringkasan data...
                    </span>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`dashboard-skeleton-${index}`}
                            aria-hidden="true"
                            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
                        >
                            <Skeleton variant="rounded" className="h-14 w-14" />
                            <Skeleton variant="text" className="mt-6 h-5 w-32" />
                            <div className="mt-2 flex items-center justify-between">
                                <Skeleton variant="text" className="h-10 w-16" />
                                <Skeleton variant="circle" className="h-5 w-5" />
                            </div>
                            <Skeleton variant="text" className="mt-1 h-4 w-24" />
                        </div>
                    ))}
                </div>
            ) : (
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
                                    {stat.value ?? '-'}
                                </span>
                                <HiChevronRight className="h-5 w-5 text-neutral-400" />
                            </div>
                            <p className="mt-1 text-[15px] text-neutral-500">
                                {stat.caption}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
