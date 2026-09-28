'use client';

import { useState } from 'react';
import { HalteFormModal } from '@/components/admin/halte/HalteFormModal';
import ConfirmEditModal from '@/components/admin/ConfirmEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Alert from '@/components/ui/Alert';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Halte, HalteInput, HalteStatus } from '@/lib/types/halte';

const initialHaltes: Halte[] = [
    {
        id: 'halte-1',
        nama: 'Bandung Electronic Centre (BEC)',
        alamat: 'Jl. Aceh No.36, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40117',
        latitude: '-123456',
        longitude: '684.827947',
        status: 'AKTIF',
    },
    {
        id: 'halte-2',
        nama: 'Museum Kota Bandung',
        alamat:
            'Jl. Aceh No.36, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40117',
        latitude: '-6.9145',
        longitude: '107.6195',
        status: 'AKTIF',
    },
    {
        id: 'halte-3',
        nama: 'Puskesmas Bojongsoang',
        alamat:
            'Jl. Terusan Buah Batu No.260-254, Cipagalo, Kec. Bojongsoang, Kabupaten Bandung, Jawa Barat 40287',
        latitude: '-6.9745',
        longitude: '107.6512',
        status: 'AKTIF',
    },
    {
        id: 'halte-4',
        nama: 'Bluebird A',
        alamat:
            'Jl. Terusan Buah Batu No.194, Kujangsari, Kec. Bandung Kidul, Kota Bandung, Jawa Barat 40266',
        latitude: '-7.0018',
        longitude: '107.6295',
        status: 'AKTIF',
    },
];

function StatusBadge({ status }: { status: HalteStatus }) {
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

export default function AdminHaltePage() {
    const [haltes, setHaltes] = useState<Halte[]>(initialHaltes);
    const [query, setQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Halte | null>(null);
    const [pendingEdit, setPendingEdit] = useState<HalteInput | null>(null);
    const [deleting, setDeleting] = useState<Halte | null>(null);
    const [successAlert, setSuccessAlert] = useState<{
        title: string;
        description: string;
    } | null>(null);

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = haltes.filter(
        (halte) =>
            halte.nama.toLowerCase().includes(normalizedQuery) ||
            halte.alamat.toLowerCase().includes(normalizedQuery),
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

    function applySave(input: HalteInput) {
        if (editing) {
            setHaltes((prev) =>
                prev.map((halte) => (halte.id === editing.id ? { ...halte, ...input } : halte)),
            );
        } else {
            setHaltes((prev) => [...prev, { id: `halte-${Date.now()}`, ...input }]);
        }
    }

    function handleFormSave(input: HalteInput) {
        if (editing) {
            setPendingEdit(input);
            return;
        }

        applySave(input);
        handleCloseForm();
        setSuccessAlert({
            title: 'Halte Berhasil Ditambahkan',
            description: `Halte ${input.nama} berhasil ditambahkan`,
        });
    }

    function handleConfirmEdit() {
        if (!pendingEdit) return;
        applySave(pendingEdit);
        setSuccessAlert({
            title: 'Perubahan Berhasil Disimpan',
            description: `Data halte ${pendingEdit.nama} telah diperbarui`,
        });
        setPendingEdit(null);
        handleCloseForm();
    }

    function handleDelete() {
        if (!deleting) return;
        setHaltes((prev) => prev.filter((halte) => halte.id !== deleting.id));
        setSuccessAlert({
            title: 'Halte Berhasil Dihapus',
            description: `Halte ${deleting.nama} berhasil dihapus`,
        });
        setDeleting(null);
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Kelola Data Halte
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Atur halte yang tersedia di Otewe
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
                        placeholder="Cari halte atau alamat ..."
                        aria-label="Cari halte atau alamat"
                        className="h-14 w-full rounded-2xl border border-neutral-300 bg-white pr-5 pl-14 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-primary-600 px-7 text-base font-semibold text-white transition hover:bg-primary-700 sm:w-auto"
                >
                    <PlusIcon />
                    Tambah Halte
                </button>
            </div>

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
                                    {halte.nama}
                                </td>
                                <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                    {halte.alamat}
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <StatusBadge status={halte.status} />
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(halte)}
                                            aria-label={`Edit halte ${halte.nama}`}
                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700"
                                        >
                                            <AdminEditIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleting(halte)}
                                            aria-label={`Hapus halte ${halte.nama}`}
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
                <HalteFormModal
                    key={editing?.id ?? 'baru'}
                    isOpen
                    initial={editing}
                    onCancel={handleCloseForm}
                    onSave={handleFormSave}
                />
            )}

            <ConfirmEditModal
                isOpen={pendingEdit != null}
                title="Simpan Halte?"
                description={
                    <>
                        Apakah kamu yakin ingin menyimpan perubahan halte{' '}
                        <strong>{pendingEdit?.nama}</strong>? Data yang telah diubah tidak dapat
                        dikembalikan.
                    </>
                }
                onCancel={() => setPendingEdit(null)}
                onConfirm={handleConfirmEdit}
            />

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Halte?"
                description={
                    <>
                        Apakah kamu yakin ingin menghapus halte <strong>{deleting?.nama}</strong>?
                        Data yang telah dihapus tidak dapat dipulihkan.
                    </>
                }
                confirmLabel="Hapus Halte"
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
