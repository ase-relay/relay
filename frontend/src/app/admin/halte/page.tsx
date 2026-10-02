'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HalteFormModal } from '@/components/admin/halte/HalteFormModal';
import ConfirmEditModal from '@/components/admin/ConfirmEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Alert from '@/components/ui/Alert';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Halte, HalteInput } from '@/lib/types/halte';
import { useAdminList } from '@/hooks/useAdminList';
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

export default function AdminHaltePage() {
    const router = useRouter();
    const { data: haltes, loading, error, refetch } = useAdminList<Halte>({ endpoint: '/transport/halte' });
    const [query, setQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Halte | null>(null);
    const [pendingEdit, setPendingEdit] = useState<HalteInput | null>(null);
    const [deleting, setDeleting] = useState<Halte | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ title: string; description: string; type?: 'success' | 'error' } | null>(null);

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = haltes.filter(
        (halte) =>
            halte.namaHalte.toLowerCase().includes(normalizedQuery) ||
            (halte.alamat ?? '').toLowerCase().includes(normalizedQuery),
    );

    function handleAdd() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleEdit(halte: Halte) {
        setEditing(halte);
        setFormOpen(true);
    }

    function handleCloseForm() {
        setFormOpen(false);
        setEditing(null);
    }

    async function handleFormSave(input: HalteInput) {
        try {
            setSubmitting(true);

            if (editing) {
                setPendingEdit(input);
                return;
            }

            const response = await api.post<{ success: boolean; data: Halte; message: string }>(
                '/transport/halte',
                input,
            );
            if (response.data.success) {
                refetch();
                handleCloseForm();
                setAlert({
                    title: 'Halte Berhasil Ditambahkan',
                    description: `Halte ${input.namaHalte} berhasil ditambahkan`,
                    type: 'success',
                });
                return;
            }
            throw new Error(response.data.message || 'Gagal menambahkan halte');
        } catch (err: unknown) {
            const error = err as ApiError;
            const message = error.response?.data?.message || error.message || 'Gagal menyimpan data halte';
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
                    description: 'Anda tidak memiliki akses untuk mengelola data halte.',
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

            const response = await api.put<{ success: boolean; data: Halte; message: string }>(
                `/transport/halte/${editing.id}`,
                pendingEdit,
            );
            if (response.data.success) {
                refetch();
                setAlert({
                    title: 'Perubahan Halte Berhasil Disimpan',
                    description: `Data halte ${pendingEdit.namaHalte} telah diperbarui`,
                    type: 'success',
                });
                setPendingEdit(null);
                handleCloseForm();
                return;
            }
            throw new Error(response.data.message || 'Gagal memperbarui halte');
        } catch (err: unknown) {
            const error = err as ApiError;
            const message = error.response?.data?.message || error.message || 'Gagal memperbarui halte';
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
                `/transport/halte/${deleting.id}`,
            );
            if (response.data.success) {
                refetch();
                setAlert({
                    title: 'Halte Berhasil Dihapus',
                    description: `Halte ${deleting.namaHalte} berhasil dihapus`,
                    type: 'success',
                });
                setDeleting(null);
                return;
            }
            throw new Error(response.data.message || 'Gagal menghapus halte');
        } catch (err: unknown) {
            const error = err as ApiError;
            const message = error.response?.data?.message || error.message || 'Gagal menghapus halte';
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
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Kelola Data Halte
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Atur halte yang tersedia di Otewe
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
                        placeholder="Cari halte atau alamat ..."
                        aria-label="Cari halte atau alamat"
                        disabled={loading}
                        className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pr-5 pl-14 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none disabled:opacity-50"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={loading || submitting}
                    className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-primary-600 px-7 text-base font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                >
                    <PlusIcon />
                    Tambah Halte
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
                                <th className="w-75 px-6 py-5 text-[17px] font-semibold">
                                    Nama Halte
                                </th>
                                <th className="px-6 py-5 text-[17px] font-semibold">
                                    Alamat
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
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-base text-neutral-500"
                                    >
                                        Tidak ada data halte yang cocok.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((halte, index) => (
                                <tr
                                    key={halte.id}
                                    className={index > 0 ? 'border-t border-neutral-200' : ''}
                                >
                                    <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-5 align-middle text-base font-medium text-neutral-900">
                                        {halte.namaHalte}
                                    </td>
                                    <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                        {halte.alamat}
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <StatusBadge isActive={halte.isActive} />
                                    </td>
                                    <td className="px-6 py-5 align-middle">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(halte)}
                                                aria-label={`Edit halte ${halte.namaHalte}`}
                                                disabled={submitting}
                                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <AdminEditIcon />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(halte)}
                                                aria-label={`Hapus halte ${halte.namaHalte}`}
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
                <HalteFormModal
                    key={editing?.id ?? 'baru'}
                    isOpen
                    initial={editing}
                    onCancel={handleCloseForm}
                    onSave={handleFormSave}
                    disabled={submitting}
                />
            )}

            <ConfirmEditModal
                isOpen={pendingEdit != null}
                title="Simpan Halte?"
                description={
                    <>
                        Apakah kamu yakin ingin menyimpan perubahan halte{' '}
                        <strong>{pendingEdit?.namaHalte}</strong>? Data yang telah diubah tidak dapat
                        dikembalikan.
                    </>
                }
                onCancel={() => setPendingEdit(null)}
                onConfirm={handleConfirmEdit}
                disabled={submitting}
            />

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Halte?"
                description={
                    <>
                        Apakah kamu yakin ingin menghapus halte <strong>{deleting?.namaHalte}</strong>?
                        Data yang telah dihapus tidak dapat dipulihkan.
                    </>
                }
                confirmLabel="Hapus Halte"
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
