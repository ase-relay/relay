'use client';

import { useState } from 'react';
import { ModaFormModal } from '@/components/admin/moda/ModaFormModal';
import ConfirmEditModal from '@/components/admin/ConfirmEditModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { Alert } from '@/components/ui/Alert';
import SearchIcon from '@/components/icons/common/SearchIcon';
import PlusIcon from '@/components/icons/common/PlusIcon';
import AdminEditIcon from '@/components/icons/admin/AdminEditIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import type { Moda, ModaInput, ModaStatus } from '@/lib/types/moda';

const initialModas: Moda[] = [
    { id: 'moda-1', nama: 'Bus Metro Jabar', status: 'AKTIF' },
    { id: 'moda-2', nama: 'Kereta', status: 'AKTIF' },
    { id: 'moda-3', nama: 'Motor', status: 'AKTIF' },
];

function StatusBadge({ status }: { status: ModaStatus }) {
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

export default function AdminModaPage() {
    const [modas, setModas] = useState<Moda[]>(initialModas);
    const [query, setQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Moda | null>(null);
    const [pendingEdit, setPendingEdit] = useState<ModaInput | null>(null);
    const [deleting, setDeleting] = useState<Moda | null>(null);
    const [alert, setAlert] = useState<{ title: string; description: string } | null>(null);

    const filtered = modas.filter((moda) =>
        moda.nama.toLowerCase().includes(query.trim().toLowerCase()),
    );

    function handleAdd() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleEdit(moda: Moda) {
        setEditing(moda);
        setFormOpen(true);
    }

    function applySave(input: ModaInput) {
        if (editing) {
            setModas((prev) =>
                prev.map((moda) => (moda.id === editing.id ? { ...moda, ...input } : moda)),
            );
        } else {
            setModas((prev) => [...prev, { id: `moda-${Date.now()}`, ...input }]);
        }
    }

    function handleFormSave(input: ModaInput) {
        if (editing) {
            setPendingEdit(input);
            return;
        }

        applySave(input);
        setFormOpen(false);
        setEditing(null);
        setAlert({
            title: 'Moda Berhasil Ditambahkan',
            description: `Moda ${input.nama} berhasil ditambahkan`,
        });
    }

    function handleConfirmEdit() {
        if (!pendingEdit) return;
        applySave(pendingEdit);
        setAlert({
            title: 'Perubahan Moda Berhasil Disimpan',
            description: `Data moda ${pendingEdit.nama} telah diperbarui`,
        });
        setPendingEdit(null);
        setFormOpen(false);
        setEditing(null);
    }

    function handleDelete() {
        if (!deleting) return;
        setModas((prev) => prev.filter((moda) => moda.id !== deleting.id));
        setAlert({
            title: 'Moda Berhasil Dihapus',
            description: `Moda ${deleting.nama} berhasil dihapus`,
        });
        setDeleting(null);
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Kelola Data Moda
            </h1>
            <p className="mt-2 text-lg text-neutral-500 sm:text-xl">
                Atur moda yang tersedia di Otewe
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
                    Tambah Moda
                </button>
            </div>

            <div className="mt-9 overflow-x-auto rounded-2xl border border-neutral-200">
                <table className="w-full min-w-180 border-collapse text-left">
                    <thead className="bg-primary-600 text-white">
                        <tr>
                            <th className="w-19 px-6 py-5 text-[17px] font-semibold">
                                No.
                            </th>
                            <th className="px-6 py-5 text-[17px] font-semibold">
                                Nama Moda
                            </th>
                            <th className="w-[165px] px-6 py-5 text-[17px] font-semibold">
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
                                    colSpan={4}
                                    className="px-6 py-10 text-center text-base text-neutral-500"
                                >
                                    Tidak ada data moda yang cocok.
                                </td>
                            </tr>
                        )}
                        {filtered.map((moda, index) => (
                            <tr
                                key={moda.id}
                                className={index > 0 ? 'border-t border-neutral-200' : ''}
                            >
                                <td className="px-6 py-5 align-middle text-base text-neutral-900">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-5 align-middle text-base font-medium text-neutral-900">
                                    {moda.nama}
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <StatusBadge status={moda.status} />
                                </td>
                                <td className="px-6 py-5 align-middle">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(moda)}
                                            aria-label={`Edit moda ${moda.nama}`}
                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 transition hover:bg-primary-700"
                                        >
                                            <AdminEditIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleting(moda)}
                                            aria-label={`Hapus moda ${moda.nama}`}
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
                <ModaFormModal
                    key={editing?.id ?? 'baru'}
                    isOpen
                    initial={editing}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                    onSave={handleFormSave}
                />
            )}

            <ConfirmEditModal
                isOpen={pendingEdit != null}
                title="Simpan Moda?"
                description={
                    <>
                        Apakah kamu yakin ingin menyimpan perubahan moda{' '}
                        <strong>{pendingEdit?.nama}</strong>? Data yang telah diubah tidak dapat
                        dikembalikan.
                    </>
                }
                onCancel={() => setPendingEdit(null)}
                onConfirm={handleConfirmEdit}
            />

            <ConfirmDeleteModal
                isOpen={deleting != null}
                title="Hapus Moda?"
                description={
                    <>
                        Apakah kamu yakin ingin menghapus moda <strong>{deleting?.nama}</strong>?
                        Data yang telah dihapus tidak dapat dipulihkan.
                    </>
                }
                confirmLabel="Hapus Moda"
                onCancel={() => setDeleting(null)}
                onConfirm={handleDelete}
            />

            {alert && (
                <Alert
                    status="success"
                    title={alert.title}
                    description={alert.description}
                    onClose={() => setAlert(null)}
                    autoDismissMs={4000}
                    className="fixed top-28 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 shadow-[0_10px_25px_rgba(15,23,42,0.14)] sm:top-30"
                />
            )}
        </>
    );
}
