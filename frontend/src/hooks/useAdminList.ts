import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
        status?: number;
    };
    message?: string;
}

interface UseAdminListOptions {
    endpoint: string;
    on401Redirect?: string;
    on403Redirect?: string;
}

export function useAdminList<T = unknown>({ endpoint, on401Redirect = '/login', on403Redirect = '/beranda' }: UseAdminListOptions) {
    const router = useRouter();
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                if (!cancelled) {
                    setLoading(true);
                    setError(null);
                }
                const response = await api.get<{ success: boolean; data: T[]; message?: string }>(endpoint);

                if (cancelled) return;

                if (response.data.success) {
                    setData(Array.isArray(response.data.data) ? response.data.data : []);
                } else {
                    throw new Error(response.data.message || 'Gagal mengambil data');
                }
            } catch (err: unknown) {
                if (cancelled) return;

                const error = err as ApiError;
                const message = error.response?.data?.message || error.message || 'Gagal mengambil data';
                setError(message);

                if (error.response?.status === 401) {
                    router.push(on401Redirect);
                } else if (error.response?.status === 403) {
                    router.push(on403Redirect);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => {
            cancelled = true;
        };
    }, [reloadKey, endpoint, on401Redirect, on403Redirect, router]);

    const refetch = () => {
        setReloadKey((prev) => prev + 1);
    };

    return { data, loading, error, refetch };
}
