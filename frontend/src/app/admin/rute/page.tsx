'use client';

import { useState } from 'react';
import { RuteFormModal } from '@/components/admin/rute/RuteFormModal';
import ConfirmEditModal from '@/components/admin/ConfirmEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Alert from '@/components/ui/Alert';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Rute, RuteInput, RuteStatus } from '@/lib/types/rute';

const modaOptions = ['Bus Metro Jabar', 'Kereta', 'Motor'];

const halteOptions = [
    'Bandung Electronic Centre (BEC)',
    'Museum Kota Bandung',
    'Puskesmas Bojongsoang',
    'Bluebird A',
];

const initialRutes: Rute[] = [
    {
        id: 'rute-1',
        namaJalur: 'Koridor 3D (BEC - Baleendah)',
        moda: 'Bus Metro Jabar',
        halte: [
            'Bandung Electronic Centre (BEC)',
            'Bluebird A',
            'Puskesmas Bojongsoang',
        ],
        jumlahHalte: 12,
        status: 'AKTIF',
    },
    {
        id: 'rute-2',
        namaJalur: 'Bandung - Padalarang',
        moda: 'Kereta',
        halte: [],
        jumlahHalte: 6,
        status: 'AKTIF',
    },
];

function StatusBadge({ status }: { status: RuteStatus }) {
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

export default function AdminRutePage() {
    const [rutes, setRutes] = useState<Rute[]>(initialRutes);
    const [query, setQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Rute | null>(null);
    const [pendingEdit, setPendingEdit] = useState<RuteInput | null>(null);
    const [deleting, setDeleting] = useState<Rute | null>(null);
    const [successAlert, setSuccessAlert] = useState<SuccessAlert | null>(null);

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = rutes.filter(
        (rute) =>
            rute.namaJalur.toLowerCase().includes(normalizedQuery) ||
            rute.moda.toLowerCase().includes(normalizedQuery),
    );

    function handleAdd() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleEdit(rute: Rute) {
        setEditing(rute);
        setFormOpen(true);
    }

    function handleCloseForm() {
        setFormOpen(false);
        setEditing(null);
    }

    function applySave(input: RuteInput) {
        if (editing) {
            setRutes((prev) =>
                prev.map((rute) =>
                    rute.id === editing.id
                        ? { ...rute, ...input, jumlahHalte: input.halte.length }
                        : rute,
                ),
            );
        } else {
            setRutes((prev) => [
                ...prev,
                {
                    id: `rute-${Date.now()}`,
                    jumlahHalte: input.halte.length,
                    ...input,
                },
            ]);
        }
    }

    function handleWizardSave(input: RuteInput) {
        if (editing) {
            setPendingEdit(input);
            return;
        }

        applySave(input);
        handleCloseForm();
        setSuccessAlert({
            title: 'Rute Berhasil Ditambahkan',
            description: `Rute ${input.namaJalur} berhasil ditambahkan`,
        });
    }

    function handleConfirmEdit() {
        if (!pendingEdit) return;
        applySave(pendingEdit);
        setSuccessAlert({
            title: 'Perubahan Berhasil Disimpan',
            description: `Data rute ${pendingEdit.namaJalur} telah diperbarui`,
        });
        setPendingEdit(null);
        handleCloseForm();
    }

    function handleDelete() {
        if (!deleting) return;
        setRutes((prev) => prev.filter((rute) => rute.id !== deleting.id));
        setSuccessAlert({
            title: 'Rute Berhasil Dihapus',
            description: `Rute ${deleting.namaJalur} berhasil dihapus`,
        });
        setDeleting(null);
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Kelola Data Rute
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Atur rute transportasi yang tersedia di Otewe
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
                        placeholder="Cari nama jalur, moda, atau koridor ..."
                        aria-label="Cari nama jalur, moda, atau koridor"
                        className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pr-5 pl-14 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-primary-600 px-7 text-base font-semibold text-white transition hover:bg-primary-700 sm:w-auto"
                >
                    <PlusIcon />
                    Tambah Rute
                </button>
            </div>

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
                                    {rute.namaJalur}
                                </td>
                                <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                    {rute.moda}
                                </td>
                                <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                    {rute.jumlahHalte}
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <StatusBadge status={rute.status} />
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(rute)}
                                            aria-label={`Edit rute ${rute.namaJalur}`}
                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700"
                                        >
                                            <AdminEditIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleting(rute)}
                                            aria-label={`Hapus rute ${rute.namaJalur}`}
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
                <RuteFormModal
                    key={editing?.id}
                    isOpen={formOpen}
                    initial={editing}
                    modaOptions={modaOptions}
                    halteOptions={halteOptions}
                    onCancel={handleCloseForm}
                    onSave={handleWizardSave}
                />
            )}

            <ConfirmEditModal
                isOpen={pendingEdit != null}
                description={
                    <>
                        Apakah kamu yakin ingin menyimpan perubahan rute{' '}
                        <strong>{pendingEdit?.namaJalur}</strong>? Data yang telah diubah tidak
                        dapat dikembalikan.
                    </>
                }
                onCancel={() => setPendingEdit(null)}
                onConfirm={handleConfirmEdit}
            />

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Rute?"
                description={
                    <>
                        Apakah kamu yakin ingin menghapus rute <strong>{deleting?.namaJalur}</strong>?
                        Data yang telah dihapus tidak dapat dipulihkan.
                    </>
                }
                confirmLabel="Hapus Rute"
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
