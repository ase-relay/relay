'use client';

import { useState } from 'react';
import { TarifFormModal } from '@/components/admin/tarif/TarifFormModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Alert from '@/components/ui/Alert';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Tarif, TarifInput, TarifSkema, TarifStatus } from '@/lib/types/tarif';

const modaOptions = ['Bus Metro Jabar', 'Kereta', 'Ojek Motor'];

const initialTarifs: Tarif[] = [
    {
        id: 'tarif-1',
        moda: 'Bus Metro Jabar',
        skema: 'FIXED_PRICE',
        hargaPerPerjalanan: 4900,
        status: 'AKTIF',
    },
    {
        id: 'tarif-2',
        moda: 'Kereta',
        skema: 'FIXED_PRICE',
        hargaPerPerjalanan: 5000,
        status: 'AKTIF',
    },
    {
        id: 'tarif-3',
        moda: 'Ojek Motor',
        skema: 'BERDASARKAN_JARAK',
        tarifMinimum: 9000,
        batasJarakAwal: 4,
        tarifKmBerikutnya: 2500,
        biayaLayanan: 1000,
        status: 'AKTIF',
    },
];

const skemaLabels: Record<TarifSkema, string> = {
    FIXED_PRICE: 'Fixed Price',
    BERDASARKAN_JARAK: 'Berdasarkan Jarak',
};

function formatRupiah(value: number) {
    return `Rp${new Intl.NumberFormat('id-ID').format(value)}`;
}

function DetailTarifCell({ tarif }: { tarif: Tarif }) {
    if (tarif.skema === 'FIXED_PRICE') {
        return (
            <p>
                <span className="font-bold">{formatRupiah(tarif.hargaPerPerjalanan ?? 0)}</span>{' '}
                / perjalanan
            </p>
        );
    }

    return (
        <p>
            <span className="font-bold">{formatRupiah(tarif.tarifMinimum ?? 0)}</span> (
            {tarif.batasJarakAwal ?? 0} km pertama){' '}
            <span className="text-neutral-400">|</span>{' '}
            <span className="font-bold">{formatRupiah(tarif.tarifKmBerikutnya ?? 0)}</span> (km
            berikutnya) <span className="text-neutral-400">|</span>{' '}
            <span className="font-bold">{formatRupiah(tarif.biayaLayanan ?? 0)}</span> (Biaya
            layanan)
        </p>
    );
}

function StatusBadge({ status }: { status: TarifStatus }) {
    if (status === 'AKTIF') {
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

type SuccessAlert = {
    title: string;
    description: string;
};

export default function AdminTarifPage() {
    const [tarifs, setTarifs] = useState<Tarif[]>(initialTarifs);
    const [query, setQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Tarif | null>(null);
    const [deleting, setDeleting] = useState<Tarif | null>(null);
    const [successAlert, setSuccessAlert] = useState<SuccessAlert | null>(null);

    const filtered = tarifs.filter((tarif) =>
        tarif.moda.toLowerCase().includes(query.trim().toLowerCase()),
    );

    function handleAdd() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleEdit(tarif: Tarif) {
        setEditing(tarif);
        setFormOpen(true);
    }

    function handleCloseForm() {
        setFormOpen(false);
        setEditing(null);
    }

    function handleSave(input: TarifInput) {
        if (editing) {
            setTarifs((prev) =>
                prev.map((tarif) => (tarif.id === editing.id ? { ...tarif, ...input } : tarif)),
            );
            setSuccessAlert({
                title: 'Data Tarif Berhasil Diperbarui',
                description: `Data tarif ${input.moda} berhasil diperbarui`,
            });
        } else {
            setTarifs((prev) => [...prev, { id: `tarif-${Date.now()}`, ...input }]);
            setSuccessAlert({
                title: 'Data Tarif Berhasil Ditambahkan',
                description: `Data tarif ${input.moda} berhasil ditambahkan`,
            });
        }
        handleCloseForm();
    }

    function handleDelete() {
        if (!deleting) return;
        setTarifs((prev) => prev.filter((tarif) => tarif.id !== deleting.id));
        setSuccessAlert({
            title: 'Data Tarif Berhasil Dihapus',
            description: `Data tarif ${deleting.moda} berhasil dihapus`,
        });
        setDeleting(null);
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Kelola Data Tarif
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Atur tarif untuk setiap moda transportasi yang tersedia di Otewe.
            </p>

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
                        className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pr-5 pl-14 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-primary-600 px-7 text-base font-semibold text-white transition hover:bg-primary-700 sm:w-auto"
                >
                    <PlusIcon />
                    Tambah Tarif
                </button>
            </div>

            <div className="mt-9 overflow-x-auto rounded-2xl border border-neutral-200">
                <table className="w-full min-w-225 border-collapse text-left">
                    <thead className="bg-primary-600 text-white">
                        <tr>
                            <th className="w-19 px-6 py-5 text-[17px] font-semibold">
                                No.
                            </th>
                            <th className="w-46.5 px-6 py-5 text-[17px] font-semibold">
                                Moda
                            </th>
                            <th className="w-44 px-6 py-5 text-[17px] font-semibold">
                                Skema Tarif
                            </th>
                            <th className="px-6 py-5 text-[17px] font-semibold">
                                Detail Tarif
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
                                    Tidak ada data tarif yang cocok.
                                </td>
                            </tr>
                        )}
                        {filtered.map((tarif, index) => (
                            <tr
                                key={tarif.id}
                                className={index > 0 ? 'border-t border-neutral-200' : ''}
                            >
                                <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-5 align-middle text-base font-medium text-neutral-900">
                                    {tarif.moda}
                                </td>
                                <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                    {skemaLabels[tarif.skema]}
                                </td>
                                <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                    <DetailTarifCell tarif={tarif} />
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <StatusBadge status={tarif.status} />
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(tarif)}
                                            aria-label={`Edit tarif ${tarif.moda}`}
                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700"
                                        >
                                            <AdminEditIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleting(tarif)}
                                            aria-label={`Hapus tarif ${tarif.moda}`}
                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-600 transition hover:bg-red-700"
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

            {formOpen && (
                <TarifFormModal
                    key={editing?.id ?? 'baru'}
                    isOpen
                    modaOptions={modaOptions}
                    initial={editing}
                    onCancel={handleCloseForm}
                    onSave={handleSave}
                />
            )}

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Tarif?"
                description={
                    <>
                        Apakah kamu yakin ingin menghapus tarif <strong>{deleting?.moda}</strong>?
                        Data yang telah dihapus tidak dapat dipulihkan.
                    </>
                }
                confirmLabel="Hapus Tarif"
                onCancel={() => setDeleting(null)}
                onConfirm={handleDelete}
            />

            {successAlert && (
                <Alert
                    status="success"
                    title={successAlert.title}
                    description={successAlert.description}
                    onClose={() => setSuccessAlert(null)}
                    autoDismissMs={4000}
                    className="fixed top-28 right-6 z-40 shadow-[0_10px_25px_rgba(15,23,42,0.14)]"
                />
            )}
        </>
    );
}
