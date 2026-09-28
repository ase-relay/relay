'use client';

import { FormEvent, useEffect, useState } from 'react';
import { HiChevronDown, HiXMark } from 'react-icons/hi2';
import SearchIcon from '@/components/icons/common/SearchIcon';
import type { Rute, RuteInput, RuteStatus } from '@/lib/types/rute';

export type RuteFormModalProps = {
    isOpen: boolean;
    modaOptions: string[];
    halteOptions: string[];
    initial?: Rute | null;
    onCancel: () => void;
    onSave: (input: RuteInput) => void;
};

const statusOptions: { value: RuteStatus; label: string }[] = [
    { value: 'AKTIF', label: 'Aktif' },
    { value: 'TIDAK_AKTIF', label: 'Tidak Aktif' },
];

export function RuteFormModal({
    isOpen,
    modaOptions,
    halteOptions,
    initial = null,
    onCancel,
    onSave,
}: RuteFormModalProps) {
    const isEdit = initial != null;

    const [step, setStep] = useState<1 | 2>(1);
    const [namaJalur, setNamaJalur] = useState(initial?.namaJalur ?? '');
    const [moda, setModa] = useState(initial?.moda ?? '');
    const [status, setStatus] = useState<RuteStatus>(initial?.status ?? 'AKTIF');
    const [selected, setSelected] = useState<string[]>(initial?.halte ?? []);
    const [halteQuery, setHalteQuery] = useState('');
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const inputClass =
        'mt-2 h-10 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-12 sm:px-5 sm:text-base';
    const selectClass = `${inputClass} cursor-pointer appearance-none pr-10 sm:pr-12`;
    const labelClass = 'block text-sm font-bold text-neutral-900 sm:text-base';
    const errorClass = 'mt-1 text-xs text-red-600 sm:text-sm';

    const title = isEdit
        ? 'Edit Data Rute'
        : step === 1
            ? 'Tambah Rute'
            : 'Tambah Data Rute';

    const normalizedQuery = halteQuery.trim().toLowerCase();
    const filteredHaltes = halteOptions.filter((halte) =>
        halte.toLowerCase().includes(normalizedQuery),
    );
    const allVisibleSelected =
        filteredHaltes.length > 0 && filteredHaltes.every((halte) => selected.includes(halte));

    function toggleHalte(name: string) {
        setErrors((prev) => ({ ...prev, halte: '' }));
        setSelected((prev) =>
            prev.includes(name) ? prev.filter((halte) => halte !== name) : [...prev, name],
        );
    }

    function toggleAllVisible() {
        setErrors((prev) => ({ ...prev, halte: '' }));
        setSelected((prev) => {
            if (allVisibleSelected) {
                return prev.filter((halte) => !filteredHaltes.includes(halte));
            }
            const missing = filteredHaltes.filter((halte) => !prev.includes(halte));
            return [...prev, ...missing];
        });
    }

    function removeSelected(index: number) {
        setErrors((prev) => ({ ...prev, halte: '' }));
        setSelected((prev) => prev.filter((_, i) => i !== index));
    }

    function handleDrop(targetIndex: number) {
        if (dragIndex == null || dragIndex === targetIndex) return;
        setSelected((prev) => {
            const next = [...prev];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
        setDragIndex(null);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (step === 1) {
            const nextErrors: Record<string, string> = {};
            if (!namaJalur.trim()) nextErrors.namaJalur = 'Nama jalur / koridor wajib diisi';
            if (!moda) nextErrors.moda = 'Moda wajib dipilih';
            if (Object.keys(nextErrors).length > 0) {
                setErrors(nextErrors);
                return;
            }
            setErrors({});
            setStep(2);
            return;
        }

        if (selected.length === 0) {
            setErrors({ halte: 'Pilih minimal satu halte' });
            return;
        }

        onSave({
            namaJalur: namaJalur.trim(),
            moda,
            halte: selected,
            status,
        });
    }

    const circleClass = (active: boolean) =>
        `flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${active ? 'bg-primary-600 text-white' : 'bg-neutral-400 text-white'}`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-2.5 sm:p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="rute-form-title"
                className="my-auto w-full max-w-2xl rounded-xl border border-neutral-300 bg-white px-3.5 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:max-w-4xl sm:rounded-2xl sm:px-10 sm:py-8"
            >
                <div className="flex items-start justify-between gap-3">
                    <h2
                        id="rute-form-title"
                        className="text-base font-bold text-neutral-900 sm:text-xl"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Tutup"
                        className="-mt-1 shrink-0 cursor-pointer rounded-lg p-1 text-neutral-900 transition hover:bg-neutral-100"
                    >
                        <HiXMark className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                <div className="mt-4 flex items-center gap-2 sm:mt-6 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => step === 2 && setStep(1)}
                        disabled={step === 1}
                        aria-label="Langkah 1: Informasi Dasar"
                        className={circleClass(true)}
                    >
                        1
                    </button>
                    <span className="text-xs font-bold text-neutral-900 sm:text-sm">
                        Informasi Dasar
                    </span>
                    <span className="h-0.5 w-6 bg-neutral-300 sm:w-10" aria-hidden="true" />
                    <button
                        type="button"
                        disabled
                        aria-label="Langkah 2: Daftar Halte"
                        className={circleClass(step === 2)}
                    >
                        2
                    </button>
                    <span
                        className={`text-xs font-bold sm:text-sm ${step === 2 ? 'text-neutral-900' : 'text-neutral-400'}`}
                    >
                        Daftar Halte
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 sm:mt-6">
                    {step === 1 ? (
                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <label htmlFor="rute-nama" className={labelClass}>
                                    Nama Jalur / Koridor
                                </label>
                                <input
                                    id="rute-nama"
                                    type="text"
                                    value={namaJalur}
                                    onChange={(event) => setNamaJalur(event.target.value)}
                                    placeholder="Contoh: Koridor 3D (BEC - Baleendah)"
                                    className={inputClass}
                                />
                                {errors.namaJalur && <p className={errorClass}>{errors.namaJalur}</p>}
                            </div>

                            <div>
                                <label htmlFor="rute-moda" className={labelClass}>
                                    Moda
                                </label>
                                <div className="relative">
                                    <select
                                        id="rute-moda"
                                        value={moda}
                                        onChange={(event) => setModa(event.target.value)}
                                        className={`${selectClass} ${moda ? '' : 'text-neutral-400'}`}
                                    >
                                        <option value="" disabled hidden>
                                            Pilih moda
                                        </option>
                                        {modaOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    <HiChevronDown
                                        aria-hidden="true"
                                        className="pointer-events-none absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-neutral-500"
                                    />
                                </div>
                                {errors.moda && <p className={errorClass}>{errors.moda}</p>}
                            </div>

                            <div>
                                <label htmlFor="rute-status" className={labelClass}>
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        id="rute-status"
                                        value={status}
                                        onChange={(event) =>
                                            setStatus(event.target.value as RuteStatus)
                                        }
                                        className={selectClass}
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <HiChevronDown
                                        aria-hidden="true"
                                        className="pointer-events-none absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-neutral-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-sm font-bold text-neutral-900 sm:text-base">
                                Pilih Halte dan Atur Urutan
                            </h3>

                            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 sm:mt-4 sm:gap-4">
                                <div className="rounded-xl bg-primary-50 p-3 sm:rounded-2xl sm:p-4">
                                    <h4 className="text-xs font-bold text-neutral-900 sm:text-sm">
                                        Daftar Halte Tersedia
                                    </h4>

                                    <div className="relative mt-2 sm:mt-3">
                                        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 sm:left-4">
                                            <SearchIcon />
                                        </span>
                                        <input
                                            type="search"
                                            value={halteQuery}
                                            onChange={(event) => setHalteQuery(event.target.value)}
                                            placeholder="Cari halte ..."
                                            aria-label="Cari halte"
                                            className="h-10 w-full rounded-xl border border-neutral-300 bg-white pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-12 sm:rounded-2xl sm:pr-5 sm:pl-12 sm:text-base"
                                        />
                                    </div>

                                    <div className="mt-2 max-h-[200px] overflow-y-auto rounded-xl bg-white p-2 sm:mt-3 sm:max-h-[250px] sm:rounded-2xl sm:p-3">
                                        <label className="flex cursor-pointer items-center gap-2 px-2 py-2 text-xs text-neutral-900 sm:gap-3 sm:py-2.5 sm:text-sm">
                                            <input
                                                type="checkbox"
                                                checked={allVisibleSelected}
                                                onChange={toggleAllVisible}
                                                className="h-4 w-4 shrink-0 cursor-pointer accent-primary-600 sm:h-5 sm:w-5"
                                            />
                                            Pilih semua
                                        </label>

                                        {filteredHaltes.map((halte) => (
                                            <label
                                                key={halte}
                                                className="flex cursor-pointer items-center gap-2 px-2 py-2 text-xs text-neutral-900 sm:gap-3 sm:py-2.5 sm:text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(halte)}
                                                    onChange={() => toggleHalte(halte)}
                                                    className="h-4 w-4 shrink-0 cursor-pointer accent-primary-600 sm:h-5 sm:w-5"
                                                />
                                                {halte}
                                            </label>
                                        ))}

                                        {filteredHaltes.length === 0 && (
                                            <p className="px-2 py-3 text-center text-xs text-neutral-500 sm:py-4 sm:text-sm">
                                                Halte tidak ditemukan.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-primary-50 p-3 sm:rounded-2xl sm:p-4">
                                    <h4 className="text-xs font-bold text-neutral-900 sm:text-sm">
                                        Urutan Halte dalam Jalur
                                    </h4>

                                    <div className="mt-2 min-h-[200px] rounded-xl bg-white p-2 sm:mt-3 sm:min-h-[250px] sm:rounded-2xl sm:p-3">
                                        {selected.length === 0 ? (
                                            <p className="flex min-h-[180px] items-center justify-center text-center text-xs text-neutral-400 sm:min-h-[220px] sm:text-sm">
                                                Belum ada halte yang dipilih
                                            </p>
                                        ) : (
                                            <ul>
                                                {selected.map((halte, index) => (
                                                    <li
                                                        key={halte}
                                                        draggable
                                                        onDragStart={() => setDragIndex(index)}
                                                        onDragOver={(event) => event.preventDefault()}
                                                        onDrop={() => handleDrop(index)}
                                                        onDragEnd={() => setDragIndex(null)}
                                                        className="mb-2 flex cursor-grab items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 last:mb-0 active:cursor-grabbing sm:mb-3 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
                                                    >
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs">
                                                            {index + 1}
                                                        </span>
                                                        <span className="flex-1 text-xs font-medium text-neutral-900 sm:text-sm">
                                                            {halte}
                                                        </span>
                                                        <span
                                                            aria-hidden="true"
                                                            className="flex w-4 shrink-0 flex-col gap-0.5 sm:w-6 sm:gap-1"
                                                        >
                                                            <span className="block h-0.5 w-4 rounded bg-neutral-400 sm:w-6" />
                                                            <span className="block h-0.5 w-4 rounded bg-neutral-400 sm:w-6" />
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSelected(index)}
                                                            aria-label={`Hapus halte ${halte}`}
                                                            className="shrink-0 cursor-pointer text-neutral-400 transition hover:text-neutral-600"
                                                        >
                                                            <HiXMark className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {errors.halte && <p className={errorClass}>{errors.halte}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 sm:mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="cursor-pointer rounded-full bg-neutral-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500 sm:px-6 sm:py-2.5 sm:text-base"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="cursor-pointer rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 sm:px-6 sm:py-2.5 sm:text-base"
                        >
                            {step === 1 ? 'Lanjut' : isEdit ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default RuteFormModal;
