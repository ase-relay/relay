'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TarifFormModal } from '@/components/admin/tarif/TarifFormModal';
import ConfirmEditModal from '@/components/admin/ConfirmEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { Alert } from '@/components/ui/Alert';
import { AlertViewport } from '@/components/ui/AlertViewport';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Tarif, TarifInput } from '@/lib/types/tarif';
import type { Moda } from '@/lib/types/moda';
import { useAdminList } from '@/hooks/useAdminList';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const SKELETON_ROWS = 5;

const skemaLabels: Record<Tarif['tipeTarif'], string> = {
    FLAT: 'Fixed price',
    PER_KM: 'Berdasarkan jarak',
};

function formatRupiah(value: number) {
    return `Rp${new Intl.NumberFormat('id-ID').format(value)}`;
}

function DetailTarifCell({ tarif }: { tarif: Tarif }) {
    if (tarif.tipeTarif === 'FLAT') {
        return (
            <p>
                <span className="font-bold">{formatRupiah(tarif.nominalDasar)}</span>{' '}
                per perjalanan
            </p>
        );
    }

    const minimum = tarif.jarakMinimumKm ?? 0;
    return (
        <p>
            {minimum > 0 ? (
                <>
                    <span className="font-bold">{formatRupiah(tarif.nominalDasar)}</span>{' '}
                    sampai {minimum} km, lalu{' '}
                </>
            ) : (
                <>
                    <span className="font-bold">{formatRupiah(tarif.nominalDasar)}</span>{' '}
                    +{' '}
                </>
            )}
            <span className="font-bold">{formatRupiah(tarif.nominalPerKm ?? 0)}</span>/km
        </p>
    );
}

export default function AdminTarifPage() {
    const router = useRouter();
    const { data: tarifs, loading: loadingTarif, error: tarifError, refetch: refetchTarif } =
        useAdminList<Tarif>({ endpoint: '/transport/tarif' });
    const { data: modas, loading: loadingModa, error: modaError, refetch: refetchModa } =
        useAdminList<Moda>({ endpoint: '/transport/moda' });
    const [query, setQuery] = useState('');
    const [formModa, setFormModa] = useState<Moda | null>(null);
    const [editing, setEditing] = useState<Tarif | null>(null);
    const [pendingEdit, setPendingEdit] = useState<TarifInput | null>(null);
    const [deleting, setDeleting] = useState<Tarif | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ title: string; description: string; type?: 'success' | 'error' } | null>(null);

    const handleCloseAlert = useCallback(() => setAlert(null), []);

    const loading = loadingTarif || loadingModa;
    const error = tarifError ?? modaError;

    const tarifByModa = new Map(tarifs.map((tarif) => [tarif.modaId, tarif]));
    const filtered = modas.filter((moda) =>
        moda.namaModa.toLowerCase().includes(query.trim().toLowerCase()),
    );
    const modasAktifTanpaTarif = modas.filter((moda) => moda.isActive && !tarifByModa.has(moda.id));

    function refetchAll() {
        refetchTarif();
        refetchModa();
    }

    function handleAturTarif(moda: Moda) {
        setEditing(null);
        setFormModa(moda);
    }

    function handleEdit(tarif: Tarif) {
        const moda = modas.find((m) => m.id === tarif.modaId) ?? {
            id: tarif.modaId,
            namaModa: tarif.moda.namaModa,
        };
        setEditing(tarif);
        setFormModa(moda as Moda);
    }

    function handleCloseForm() {
        setFormModa(null);
        setEditing(null);
    }

    function handleAuthError(err: unknown): boolean {
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 401) {
            setTimeout(() => router.push('/login'), 2000);
            return true;
        }
        if (error.response?.status === 403) {
            setTimeout(() => router.push('/beranda'), 2000);
            return true;
        }
        return false;
    }

    async function handleFormSave(input: TarifInput) {
        if (editing) {
            // Update: langsung tampilkan konfirmasi, PUT menyusul di handleConfirmEdit
            setPendingEdit(input);
            return;
        }
        try {
            setSubmitting(true);

            const response = await api.post<{ success: boolean; data: Tarif; message: string }>(
                '/transport/tarif',
                input,
            );
            if (response.data.success) {
                refetchAll();
                handleCloseForm();
                setAlert({
                    title: 'Data Tarif Berhasil Ditambahkan',
                    description: `Data tarif ${formModa?.namaModa ?? ''} berhasil ditambahkan`,
                    type: 'success',
                });
                return;
            }
            throw new Error(response.data.message || 'Gagal menambahkan tarif');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Gagal menyimpan data tarif');
            setAlert({
                title: 'Gagal Menyimpan',
                description: message,
                type: 'error',
            });
            handleAuthError(err);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleConfirmEdit() {
        if (!pendingEdit || !editing) return;
        try {
            setSubmitting(true);

            const response = await api.put<{ success: boolean; data: Tarif; message: string }>(
                `/transport/tarif/${editing.id}`,
                pendingEdit,
            );
            if (response.data.success) {
                refetchAll();
                handleCloseForm();
                setAlert({
                    title: 'Data Tarif Berhasil Diperbarui',
                    description: `Data tarif ${formModa?.namaModa ?? ''} berhasil diperbarui`,
                    type: 'success',
                });
                setPendingEdit(null);
                return;
            }
            throw new Error(response.data.message || 'Gagal memperbarui tarif');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Gagal memperbarui tarif');
            setAlert({
                title: 'Gagal Memperbarui',
                description: message,
                type: 'error',
            });
            handleAuthError(err);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!deleting) return;
        try {
            setSubmitting(true);

            const response = await api.delete<{ success: boolean; message: string }>(
                `/transport/tarif/${deleting.id}`,
            );
            if (response.data.success) {
                refetchAll();
                setAlert({
                    title: 'Data Tarif Berhasil Dihapus',
                    description: `Data tarif ${deleting.moda.namaModa} berhasil dihapus`,
                    type: 'success',
                });
                setDeleting(null);
                return;
            }
            throw new Error(response.data.message || 'Gagal menghapus tarif');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Gagal menghapus tarif');
            setAlert({
                title: 'Gagal Menghapus',
                description: message,
                type: 'error',
            });
            handleAuthError(err);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Kelola Data Tarif
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Tarif berlaku untuk semua rute pada moda ini.
            </p>

            {modasAktifTanpaTarif.length > 0 && !loading && (
                <div className="mt-4">
                    <Alert
                        status="warning"
                        title="Sebagian moda belum punya tarif"
                        description={`Moda ${modasAktifTanpaTarif.map((m) => m.namaModa).join(', ')} memakai tarif standar Rp5.000 sampai tarif dibuat.`}
                    />
                </div>
            )}

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
                        placeholder="Cari moda ..."
                        aria-label="Cari moda"
                        disabled={loading}
                        className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pr-5 pl-14 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="mt-9 overflow-x-auto rounded-2xl border border-neutral-200">
                <table className="w-full min-w-200 table-fixed border-collapse text-left">
                    <thead className="bg-primary-600 text-white">
                        <tr>
                            <th className="w-[7%] px-6 py-5 text-[17px] font-semibold whitespace-nowrap">
                                No.
                            </th>
                            <th className="w-[23%] px-6 py-5 text-[17px] font-semibold">
                                Moda
                            </th>
                            <th className="w-[17%] px-6 py-5 text-[17px] font-semibold whitespace-nowrap">
                                Skema Tarif
                            </th>
                            <th className="w-[41%] px-6 py-5 text-[17px] font-semibold">
                                Detail Tarif
                            </th>
                            <th className="w-[12%] px-6 py-5 text-[17px] font-semibold whitespace-nowrap">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <>
                                <tr>
                                    <td colSpan={5} className="sr-only">
                                        <span role="status">Memuat data tarif...</span>
                                    </td>
                                </tr>
                                {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                                    <tr
                                        key={`tarif-skeleton-${index}`}
                                        aria-hidden="true"
                                        className={index > 0 ? 'border-t border-neutral-200' : ''}
                                    >
                                        <td className="px-6 py-5 align-middle">
                                            <Skeleton variant="text" className="h-5 w-8" />
                                        </td>
                                        <td className="px-6 py-5 align-middle">
                                            <Skeleton variant="text" className="h-5 w-36 max-w-full" />
                                        </td>
                                        <td className="px-6 py-5 align-middle">
                                            <Skeleton variant="text" className="h-5 w-28 max-w-full" />
                                        </td>
                                        <td className="px-6 py-5 align-middle">
                                            <Skeleton variant="text" className="h-5 w-full max-w-80" />
                                        </td>
                                        <td className="px-6 py-5 align-middle">
                                            <div className="flex items-center gap-2">
                                                <Skeleton variant="rounded" className="h-9 w-9" />
                                                <Skeleton variant="rounded" className="h-9 w-9" />
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
                                            colSpan={5}
                                            className="px-6 py-10 text-center text-base text-neutral-500"
                                        >
                                            {query ? 'Tidak ada data moda yang cocok.' : 'Tidak ada data moda.'}
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((moda, index) => {
                                    const tarif = tarifByModa.get(moda.id);
                                    return (
                                        <tr
                                            key={moda.id}
                                            className={index > 0 ? 'border-t border-neutral-200' : ''}
                                        >
                                            <td className="px-6 py-5 align-middle text-base whitespace-nowrap text-neutral-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-5 align-middle text-base font-medium text-neutral-900">
                                                {moda.namaModa}
                                                {!moda.isActive && (
                                                    <span className="ml-2 rounded-lg bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 align-middle text-base whitespace-nowrap text-neutral-900">
                                                {tarif ? skemaLabels[tarif.tipeTarif] : '-'}
                                            </td>
                                            <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                                {tarif ? <DetailTarifCell tarif={tarif} /> : '-'}
                                            </td>
                                            <td className="px-6 py-5 align-middle whitespace-nowrap">
                                                {tarif ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(tarif)}
                                                            aria-label={`Edit tarif ${moda.namaModa}`}
                                                            disabled={submitting}
                                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <AdminEditIcon />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleting(tarif)}
                                                            aria-label={`Hapus tarif ${moda.namaModa}`}
                                                            disabled={submitting}
                                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-600 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAturTarif(moda)}
                                                            disabled={submitting || !moda.isActive}
                                                            title={moda.isActive ? undefined : 'Aktifkan moda dulu'}
                                                            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <PlusIcon />
                                                            Atur tarif
                                                        </button>
                                                        {!moda.isActive && (
                                                            <p className="mt-1 text-xs text-neutral-500">
                                                                Aktifkan moda dulu
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {formModa && (
                <TarifFormModal
                    key={editing?.id ?? `baru-${formModa.id}`}
                    isOpen
                    moda={{ id: formModa.id, namaModa: formModa.namaModa }}
                    initial={editing}
                    onCancel={handleCloseForm}
                    onSubmit={handleFormSave}
                    submitting={submitting}
                />
            )}

            <ConfirmEditModal
                isOpen={pendingEdit != null}
                title="Simpan Tarif?"
                description={
                    <>
                        Apakah kamu yakin ingin menyimpan perubahan tarif{' '}
                        <strong>{formModa?.namaModa}</strong>? Data yang telah diubah tidak dapat
                        dikembalikan.
                    </>
                }
                onCancel={() => setPendingEdit(null)}
                onConfirm={handleConfirmEdit}
                disabled={submitting}
            />

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Tarif?"
                description={
                    <>
                        Tarif <strong>{deleting?.moda.namaModa}</strong> akan dihapus.
                        Moda ini kembali memakai tarif standar Rp5.000 untuk semua rutenya.
                    </>
                }
                confirmLabel="Hapus Tarif"
                onCancel={() => setDeleting(null)}
                onConfirm={handleDelete}
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
