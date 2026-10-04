'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ModaFormModal } from '@/components/admin/moda/ModaFormModal';
import ConfirmEditModal from '@/components/admin/ConfirmEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { Alert } from '@/components/ui/Alert';
import { AlertViewport } from '@/components/ui/AlertViewport';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Moda, ModaInput } from '@/lib/types/moda';
import { TIPE_MODA_LABELS } from '@/lib/types/moda';
import { useAdminList } from '@/hooks/useAdminList';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

const SKELETON_ROWS = 5;

// Ukuran tabel responsif. Sidebar admin baru tampil permanen mulai `lg` (memakan ~280px),
// jadi ruang tabel justru paling sempit di `lg`: padding & font dikecilkan lagi di sana,
// lalu dilonggarkan kembali di `xl`. Header sengaja tanpa nowrap bawaan: "Kecepatan Rata-rata"
// boleh turun ke dua baris, kolom lain yang pendek diberi `whitespace-nowrap` sendiri.
const cellPad = 'px-3 py-3 sm:px-4 sm:py-4 md:px-5 lg:px-4 xl:px-6 xl:py-5';
const headText = 'text-sm font-semibold md:text-base lg:text-sm xl:text-[17px]';
const bodyText = 'text-sm md:text-base lg:text-sm xl:text-base';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
        status?: number;
    };
    message?: string;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    if (isActive) {
        return (
            <span className="inline-flex rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-green-700 sm:px-3.5 sm:py-1.5 sm:text-sm">
                Aktif
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-red-700 sm:px-3.5 sm:py-1.5 sm:text-sm">
            Tidak Aktif
        </span>
    );
}

function labelTipeModa(tipeModa: string | null): string {
    if (tipeModa == null) return '-';
    if (tipeModa in TIPE_MODA_LABELS) {
        return TIPE_MODA_LABELS[tipeModa as keyof typeof TIPE_MODA_LABELS];
    }
    const legacy: Record<string, string> = {
        BRT: 'Bus',
        FEEDER: 'Angkot',
        COMMUTER_TRAIN: 'Kereta',
        RIDE_HAILING: 'Ojek online',
    };
    return legacy[tipeModa] ?? tipeModa;
}

export default function AdminModaPage() {
    const router = useRouter();
    const { data: modas, loading, error, refetch } = useAdminList<Moda>({ endpoint: '/transport/moda' });
    const [query, setQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Moda | null>(null);
    const [pendingEdit, setPendingEdit] = useState<ModaInput | null>(null);
    const [deleting, setDeleting] = useState<Moda | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ title: string; description: string; type?: 'success' | 'error' } | null>(null);

    const handleCloseAlert = useCallback(() => setAlert(null), []);

    const filtered = modas.filter((moda) =>
        moda.namaModa.toLowerCase().includes(query.trim().toLowerCase()),
    );

    function handleAdd() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleEdit(moda: Moda) {
        setEditing(moda);
        setFormOpen(true);
    }

    async function handleFormSave(input: ModaInput) {
        if (editing) {
            // Update: langsung tampilkan konfirmasi, PUT menyusul di handleConfirmEdit
            setPendingEdit(input);
            return;
        }
        try {
            setSubmitting(true);

            // Create
            const response = await api.post<{ success: boolean; data: Moda; message: string }>(
                '/transport/moda',
                input
            );
            if (response.data.success) {
                refetch();
                setFormOpen(false);
                setEditing(null);
                setAlert({
                    title: 'Moda Berhasil Ditambahkan',
                    description: `Moda ${input.namaModa} berhasil ditambahkan`,
                    type: 'success',
                });
                return;
            }
            throw new Error(response.data.message || 'Gagal menambahkan moda');
        } catch (err: unknown) {
            const error = err as ApiError;
            const message = error.response?.data?.message || error.message || 'Gagal menyimpan data moda';
            setAlert({
                title: 'Gagal Menyimpan',
                description: message,
                type: 'error',
            });
            if (error.response?.status === 401) {
                setAlert({
                    title: 'Sesi Login Habis',
                    description: 'Silakan login ulang untuk melanjutkan.',
                    type: 'error',
                });
                setTimeout(() => router.push('/login'), 2000);
            } else if (error.response?.status === 403) {
                setAlert({
                    title: 'Akses Ditolak',
                    description: 'Anda tidak memiliki akses untuk mengelola data moda.',
                    type: 'error',
                });
                setTimeout(() => router.push('/beranda'), 2000);
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleConfirmEdit() {
        if (!pendingEdit || !editing) return;
        try {
            setSubmitting(true);

            const response = await api.put<{ success: boolean; data: Moda; message: string }>(
                `/transport/moda/${editing.id}`,
                pendingEdit
            );
            if (response.data.success) {
                refetch();
                setAlert({
                    title: 'Perubahan Moda Berhasil Disimpan',
                    description: `Data moda ${pendingEdit.namaModa} telah diperbarui`,
                    type: 'success',
                });
                setPendingEdit(null);
                setFormOpen(false);
                setEditing(null);
                return;
            }
            throw new Error(response.data.message || 'Gagal memperbarui moda');
        } catch (err: unknown) {
            const error = err as ApiError;
            const message = error.response?.data?.message || error.message || 'Gagal memperbarui moda';
            setAlert({
                title: 'Gagal Memperbarui',
                description: message,
                type: 'error',
            });
            if (error.response?.status === 401) {
                setTimeout(() => router.push('/login'), 2000);
            } else if (error.response?.status === 403) {
                setTimeout(() => router.push('/beranda'), 2000);
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!deleting) return;
        try {
            setSubmitting(true);

            const response = await api.delete<{ success: boolean; message: string }>(
                `/transport/moda/${deleting.id}`
            );
            if (response.data.success) {
                refetch();
                setAlert({
                    title: 'Moda Berhasil Dihapus',
                    description: `Moda ${deleting.namaModa} berhasil dihapus`,
                    type: 'success',
                });
                setDeleting(null);
                return;
            }
            throw new Error(response.data.message || 'Gagal menghapus moda');
        } catch (err: unknown) {
            const error = err as ApiError;
            const message = error.response?.data?.message || error.message || 'Gagal menghapus moda';
            setAlert({
                title: 'Gagal Menghapus',
                description: message,
                type: 'error',
            });
            if (error.response?.status === 401) {
                setTimeout(() => router.push('/login'), 2000);
            } else if (error.response?.status === 403) {
                setTimeout(() => router.push('/beranda'), 2000);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl xl:text-4xl">
                Kelola Data Moda
            </h1>
            <p className="mt-2 text-base text-neutral-500 sm:text-lg xl:text-xl">
                Atur moda yang tersedia di Otewe
            </p>

            {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
                {/* Pencarian boleh mengecil (flex-1) supaya tombol "Tambah Moda" tidak terjepit di layar sm/md */}
                <div className="relative w-full sm:w-auto sm:max-w-md sm:flex-1 xl:max-w-110">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 sm:left-5">
                        <SearchIcon />
                    </span>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari moda ..."
                        aria-label="Cari moda"
                        disabled={loading}
                        className="h-12 w-full rounded-2xl border border-neutral-300 bg-white pr-4 pl-12 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none disabled:opacity-50 sm:h-14 sm:pr-5 sm:pl-14 sm:text-base"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={loading || submitting}
                    className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-primary-600 px-6 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:h-14 sm:w-auto sm:shrink-0 sm:px-7 sm:text-base"
                >
                    <PlusIcon />
                    Tambah Moda
                </button>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 sm:mt-9">
                {/* Layout tabel otomatis (bukan table-fixed): kolom No., Tipe Moda, Status, dan Aksi menyesuaikan
                    isinya, sisanya dibagi otomatis, jadi tombol aksi tidak ikut terjepit. */}
                <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead className="bg-primary-600 text-white">
                        <tr>
                            <th className={`w-px whitespace-nowrap ${cellPad} ${headText}`}>
                                No.
                            </th>
                            <th className={`${cellPad} ${headText}`}>
                                Nama Moda
                            </th>
                            <th className={`whitespace-nowrap ${cellPad} ${headText}`}>
                                Tipe Moda
                            </th>
                            <th className={`${cellPad} ${headText}`}>
                                Kecepatan Rata-rata
                            </th>
                            <th className={`w-px whitespace-nowrap ${cellPad} ${headText}`}>
                                Status
                            </th>
                            <th className={`w-px whitespace-nowrap ${cellPad} ${headText}`}>
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <>
                                <tr>
                                    <td colSpan={6} className="sr-only">
                                        <span role="status">Memuat data moda...</span>
                                    </td>
                                </tr>
                                {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                                    <tr
                                        key={`moda-skeleton-${index}`}
                                        aria-hidden="true"
                                        className={index > 0 ? 'border-t border-neutral-200' : ''}
                                    >
                                        <td className={`${cellPad} align-middle`}>
                                            <Skeleton variant="text" className="h-5 w-8" />
                                        </td>
                                        <td className={`${cellPad} align-middle`}>
                                            <Skeleton variant="text" className="h-5 w-32 max-w-full sm:w-40" />
                                        </td>
                                        <td className={`${cellPad} align-middle`}>
                                            <Skeleton variant="text" className="h-5 w-20 sm:w-24" />
                                        </td>
                                        <td className={`${cellPad} align-middle`}>
                                            <Skeleton variant="text" className="h-5 w-24 sm:w-28" />
                                        </td>
                                        <td className={`${cellPad} align-middle`}>
                                            <Skeleton variant="rounded" className="h-7 w-20 sm:h-8 sm:w-24" />
                                        </td>
                                        <td className={`${cellPad} align-middle`}>
                                            <div className="flex items-center gap-2">
                                                <Skeleton variant="rounded" className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
                                                <Skeleton variant="rounded" className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ) : (
                            <>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className={`px-4 py-10 text-center text-neutral-500 ${bodyText}`}
                                        >
                                            {query ? 'Tidak ada data moda yang cocok.' : 'Tidak ada data moda.'}
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((moda, index) => (
                                    <tr
                                        key={moda.id}
                                        className={index > 0 ? 'border-t border-neutral-200' : ''}
                                    >
                                        <td className={`${cellPad} ${bodyText} align-middle whitespace-nowrap text-neutral-900`}>
                                            {index + 1}
                                        </td>
                                        <td className={`${cellPad} ${bodyText} min-w-36 align-middle font-medium text-neutral-900`}>
                                            {moda.namaModa}
                                        </td>
                                        <td className={`${cellPad} ${bodyText} align-middle whitespace-nowrap text-neutral-900`}>
                                            {labelTipeModa(moda.tipeModa)}
                                        </td>
                                        <td className={`${cellPad} ${bodyText} align-middle whitespace-nowrap text-neutral-900`}>
                                            {moda.rataRataKecepatanKmh != null
                                                ? `${moda.rataRataKecepatanKmh} km/jam`
                                                : 'Otomatis'}
                                        </td>
                                        <td className={`${cellPad} align-middle whitespace-nowrap`}>
                                            <StatusBadge isActive={moda.isActive} />
                                        </td>
                                        <td className={`${cellPad} align-middle whitespace-nowrap`}>
                                            <div className="flex items-center gap-2">
                                                {/* shrink-0 + ukuran tetap: tombol tidak boleh ikut mengecil/gepeng saat kolom sempit */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(moda)}
                                                    aria-label={`Edit moda ${moda.namaModa}`}
                                                    disabled={submitting}
                                                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:h-9 sm:w-9"
                                                >
                                                    <AdminEditIcon />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleting(moda)}
                                                    aria-label={`Hapus moda ${moda.namaModa}`}
                                                    disabled={submitting}
                                                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-red-600 transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed sm:h-9 sm:w-9"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {formOpen && (
                <ModaFormModal
                    key={editing?.id ?? 'baru'}
                    isOpen
                    initial={editing}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                    onSave={handleFormSave}
                    disabled={submitting}
                />
            )}

            <ConfirmEditModal
                isOpen={pendingEdit != null}
                title="Simpan Moda?"
                description={
                    <>
                        Apakah kamu yakin ingin menyimpan perubahan moda{' '}
                        <strong>{pendingEdit?.namaModa}</strong>? Data yang telah diubah tidak dapat
                        dikembalikan.
                    </>
                }
                onCancel={() => setPendingEdit(null)}
                onConfirm={handleConfirmEdit}
                disabled={submitting}
            />

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Moda?"
                description={
                    <>
                        Apakah kamu yakin ingin menghapus moda <strong>{deleting?.namaModa}</strong>?
                        Data yang telah dihapus tidak dapat dipulihkan.
                    </>
                }
                confirmLabel="Hapus Moda"
                onCancel={() => setDeleting(null)}
                onConfirm={handleDelete}
                disabled={submitting}
            />

            <AlertViewport>
                {alert && (
                    <Alert
                        status={alert.type || 'success'}
                        title={alert.title}
                        description={alert.description}
                        onClose={handleCloseAlert}
                        autoDismissMs={4000}
                    />
                )}
            </AlertViewport>
        </>
    );
}