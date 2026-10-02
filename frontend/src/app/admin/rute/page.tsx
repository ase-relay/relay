'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RuteFormModal } from '@/components/admin/rute/RuteFormModal';
import ConfirmEditModal from '@/components/admin/ConfirmEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Alert from '@/components/ui/Alert';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Rute, RuteInput } from '@/lib/types/rute';
import type { Halte } from '@/lib/types/halte';
import type { Moda } from '@/lib/types/moda';
import { useAdminList } from '@/hooks/useAdminList';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils/apiError';

function StatusBadge({ isActive }: { isActive: boolean }) {
    if (isActive) {
        return (
            <span className="inline-flex rounded-lg bg-green-100 px-3.5 py-1.5 text-sm font-semibold text-green-700">
                Aktif
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-lg bg-red-100 px-3.5 py-1.5 text-sm font-semibold text-red-700">
            Tidak Aktif
        </span>
    );
}

export default function AdminRutePage() {
    const router = useRouter();
    const { data: rutes, loading, error, refetch } = useAdminList<Rute>({ endpoint: '/transport/rute' });
    const { data: haltes } = useAdminList<Halte>({ endpoint: '/transport/halte' });
    const { data: modas } = useAdminList<Moda>({ endpoint: '/transport/moda' });
    const [query, setQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Rute | null>(null);
    const [pendingEdit, setPendingEdit] = useState<RuteInput | null>(null);
    const [deleting, setDeleting] = useState<Rute | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ title: string; description: string; type?: 'success' | 'error' } | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = rutes.filter(
        (rute) =>
            rute.namaRute.toLowerCase().includes(normalizedQuery) ||
            (rute.kodeRute?.toLowerCase().includes(normalizedQuery) ?? false) ||
            rute.moda.namaModa.toLowerCase().includes(normalizedQuery),
    );

    function handleAdd() {
        setEditing(null);
        setFormOpen(true);
    }

    async function handleEdit(rute: Rute) {
        try {
            setLoadingDetail(true);
            const response = await api.get<{ success: boolean; data: Rute; message: string }>(
                `/transport/rute/${rute.id}`,
            );
            if (response.data.success) {
                setEditing(response.data.data);
                setFormOpen(true);
            } else {
                throw new Error(response.data.message || 'Gagal mengambil detail rute');
            }
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Gagal mengambil detail rute');
            setAlert({
                title: 'Gagal Memuat Data',
                description: message,
                type: 'error',
            });
        } finally {
            setLoadingDetail(false);
        }
    }

    function handleCloseForm() {
        setFormOpen(false);
        setEditing(null);
    }

    async function handleFormSave(input: RuteInput) {
        try {
            setSubmitting(true);

            if (editing) {
                setPendingEdit(input);
                return;
            }

            const response = await api.post<{ success: boolean; data: Rute; message: string }>(
                '/transport/rute',
                input,
            );
            if (response.data.success) {
                refetch();
                handleCloseForm();
                setAlert({
                    title: 'Rute Berhasil Ditambahkan',
                    description: `Rute ${input.namaRute} berhasil ditambahkan`,
                    type: 'success',
                });
                return;
            }
            throw new Error(response.data.message || 'Gagal menambahkan rute');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Gagal menyimpan data rute');
            setAlert({
                title: 'Gagal Menyimpan',
                description: message,
                type: 'error',
            });
            if ((err as { response?: { status?: number } }).response?.status === 401) {
                setAlert({
                    title: 'Sesi Login Habis',
                    description: 'Silakan login ulang untuk melanjutkan.',
                    type: 'error',
                });
                setTimeout(() => router.push('/login'), 2000);
            } else if ((err as { response?: { status?: number } }).response?.status === 403) {
                setAlert({
                    title: 'Akses Ditolak',
                    description: 'Anda tidak memiliki akses untuk mengelola data rute.',
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

            const response = await api.put<{ success: boolean; data: Rute; message: string }>(
                `/transport/rute/${editing.id}`,
                pendingEdit,
            );
            if (response.data.success) {
                refetch();
                setAlert({
                    title: 'Perubahan Rute Berhasil Disimpan',
                    description: `Data rute ${pendingEdit.namaRute} telah diperbarui`,
                    type: 'success',
                });
                setPendingEdit(null);
                handleCloseForm();
                return;
            }
            throw new Error(response.data.message || 'Gagal memperbarui rute');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Gagal memperbarui rute');
            setAlert({
                title: 'Gagal Memperbarui',
                description: message,
                type: 'error',
            });
            if ((err as { response?: { status?: number } }).response?.status === 401) {
                setTimeout(() => router.push('/login'), 2000);
            } else if ((err as { response?: { status?: number } }).response?.status === 403) {
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
                `/transport/rute/${deleting.id}`,
            );
            if (response.data.success) {
                refetch();
                setAlert({
                    title: 'Rute Berhasil Dihapus',
                    description: `Rute ${deleting.namaRute} berhasil dihapus`,
                    type: 'success',
                });
                setDeleting(null);
                return;
            }
            throw new Error(response.data.message || 'Gagal menghapus rute');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Gagal menghapus rute');
            setAlert({
                title: 'Gagal Menghapus',
                description: message,
                type: 'error',
            });
            if ((err as { response?: { status?: number } }).response?.status === 401) {
                setTimeout(() => router.push('/login'), 2000);
            } else if ((err as { response?: { status?: number } }).response?.status === 403) {
                setTimeout(() => router.push('/beranda'), 2000);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Kelola Data Rute
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Atur rute transportasi yang tersedia di Otewe
            </p>

            {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-110">
                    <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2">
                        <SearchIcon />
                    </span>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari nama jalur, kode, atau moda ..."
                        aria-label="Cari nama jalur, kode, atau moda"
                        disabled={loading}
                        className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pr-5 pl-14 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none disabled:opacity-50"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={loading || submitting || loadingDetail}
                    className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-primary-600 px-7 text-base font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                >
                    <PlusIcon />
                    Tambah Rute
                </button>
            </div>

            {loading ? (
                <div className="mt-9 flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                </div>
            ) : (
                <div className="mt-9 overflow-x-auto rounded-2xl border border-neutral-200">
                    <table className="w-full min-w-225 border-collapse text-left">
                        <thead className="bg-primary-600 text-white">
                            <tr>
                                <th className="w-19 px-6 py-5 text-[17px] font-semibold">
                                    No.
                                </th>
                                <th className="px-6 py-5 text-[17px] font-semibold">
                                    Nama Jalur / Koridor
                                </th>
                                <th className="w-47.5 px-6 py-5 text-[17px] font-semibold">
                                    Moda
                                </th>
                                <th className="w-40 px-6 py-5 text-[17px] font-semibold whitespace-nowrap">
                                    Jumlah Halte
                                </th>
                                <th className="w-41.25 px-6 py-5 text-[17px] font-semibold">
                                    Status
                                </th>
                                <th className="w-30 px-6 py-5 text-[17px] font-semibold">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-10 text-center text-base text-neutral-500"
                                    >
                                        Tidak ada data rute yang cocok.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((rute, index) => (
                                <tr
                                    key={rute.id}
                                    className={index > 0 ? 'border-t border-neutral-200' : ''}
                                >
                                    <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-5 align-middle text-base font-medium text-neutral-900">
                                        {rute.namaRute}
                                    </td>
                                    <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                        {rute.moda.namaModa}
                                    </td>
                                    <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                        {rute._count?.stops ?? 0}
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <StatusBadge isActive={rute.isActive} />
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(rute)}
                                                aria-label={`Edit rute ${rute.namaRute}`}
                                                disabled={submitting || loadingDetail}
                                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <AdminEditIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(rute)}
                                                aria-label={`Hapus rute ${rute.namaRute}`}
                                                disabled={submitting}
                                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-600 transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {formOpen && (
                <RuteFormModal
                    key={editing?.id ?? 'baru'}
                    isOpen
                    haltes={haltes}
                    modas={modas}
                    initial={editing}
                    onCancel={handleCloseForm}
                    onSubmit={handleFormSave}
                    submitting={submitting}
                />
            )}

            <ConfirmEditModal
                isOpen={pendingEdit != null}
                title="Simpan Rute?"
                description={
                    <>
                        Apakah kamu yakin ingin menyimpan perubahan rute{' '}
                        <strong>{pendingEdit?.namaRute}</strong>? Data yang telah diubah tidak dapat
                        dikembalikan.
                    </>
                }
                onCancel={() => setPendingEdit(null)}
                onConfirm={handleConfirmEdit}
                disabled={submitting}
            />

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Rute?"
                description={
                    <>
                        Apakah kamu yakin ingin menghapus rute <strong>{deleting?.namaRute}</strong>?
                        Data yang telah dihapus tidak dapat dipulihkan.
                    </>
                }
                confirmLabel="Hapus Rute"
                onCancel={() => setDeleting(null)}
                onConfirm={handleDelete}
                disabled={submitting}
            />

            {alert && (
                <Alert
                    status={alert.type || 'success'}
                    title={alert.title}
                    description={alert.description}
                    onClose={() => setAlert(null)}
                    autoDismissMs={4000}
                    className="fixed top-28 right-6 z-40 shadow-[0_10px_25px_rgba(15,23,42,0.14)]"
                />
            )}
        </>
    );
}
