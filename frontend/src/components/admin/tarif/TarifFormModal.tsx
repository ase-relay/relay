'use client';

import { FormEvent, useEffect, useState } from 'react';
import { HiChevronDown, HiXMark } from 'react-icons/hi2';
import type { Tarif, TarifInput, TarifSkema, TarifStatus } from '@/lib/types/tarif';

export type TarifFormModalProps = {
    isOpen: boolean;
    modaOptions: string[];
    initial?: Tarif | null;
    onCancel: () => void;
    onSave: (input: TarifInput) => void;
};

const skemaOptions: { value: TarifSkema; label: string }[] = [
    { value: 'FIXED_PRICE', label: 'Fixed price' },
    { value: 'BERDASARKAN_JARAK', label: 'Berdasarkan jarak' },
];

const statusOptions: { value: TarifStatus; label: string }[] = [
    { value: 'AKTIF', label: 'Aktif' },
    { value: 'TIDAK_AKTIF', label: 'Tidak Aktif' },
];

export function TarifFormModal({ isOpen, modaOptions, initial = null, onCancel, onSave }: TarifFormModalProps) {
    const [moda, setModa] = useState(initial?.moda ?? '');
    const [skema, setSkema] = useState<TarifSkema>(initial?.skema ?? 'FIXED_PRICE');
    const [hargaPerPerjalanan, setHargaPerPerjalanan] = useState(
        initial?.hargaPerPerjalanan != null ? String(initial.hargaPerPerjalanan) : '',
    );
    const [tarifMinimum, setTarifMinimum] = useState(
        initial?.tarifMinimum != null ? String(initial.tarifMinimum) : '',
    );
    const [batasJarakAwal, setBatasJarakAwal] = useState(
        initial?.batasJarakAwal != null ? String(initial.batasJarakAwal) : '',
    );
    const [tarifKmBerikutnya, setTarifKmBerikutnya] = useState(
        initial?.tarifKmBerikutnya != null ? String(initial.tarifKmBerikutnya) : '',
    );
    const [biayaLayanan, setBiayaLayanan] = useState(
        initial?.biayaLayanan != null ? String(initial.biayaLayanan) : '',
    );
    const [status, setStatus] = useState<TarifStatus>(initial?.status ?? 'AKTIF');
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

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};

        if (!moda) nextErrors.moda = 'Moda wajib dipilih';

        if (skema === 'FIXED_PRICE') {
            if (!hargaPerPerjalanan || Number(hargaPerPerjalanan) <= 0) {
                nextErrors.hargaPerPerjalanan = 'Detail tarif wajib diisi';
            }
        } else {
            if (!tarifMinimum || Number(tarifMinimum) <= 0) {
                nextErrors.tarifMinimum = 'Tarif minimum wajib diisi';
            }
            if (batasJarakAwal === '' || Number.isNaN(Number(batasJarakAwal)) || Number(batasJarakAwal) < 0) {
                nextErrors.batasJarakAwal = 'Batas jarak awal wajib diisi';
            }
            if (!tarifKmBerikutnya || Number(tarifKmBerikutnya) <= 0) {
                nextErrors.tarifKmBerikutnya = 'Tarif per km berikutnya wajib diisi';
            }
            if (biayaLayanan === '' || Number.isNaN(Number(biayaLayanan)) || Number(biayaLayanan) < 0) {
                nextErrors.biayaLayanan = 'Biaya layanan wajib diisi';
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        if (skema === 'FIXED_PRICE') {
            onSave({
                moda,
                skema,
                hargaPerPerjalanan: Number(hargaPerPerjalanan),
                status,
            });
        } else {
            onSave({
                moda,
                skema,
                tarifMinimum: Number(tarifMinimum),
                batasJarakAwal: Number(batasJarakAwal),
                tarifKmBerikutnya: Number(tarifKmBerikutnya),
                biayaLayanan: Number(biayaLayanan),
                status,
            });
        }
    }

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
                aria-labelledby="tarif-form-title"
                className="my-auto w-full max-w-xl rounded-xl border border-neutral-300 bg-white px-3.5 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:max-w-3xl sm:rounded-2xl sm:px-10 sm:py-8"
            >
                <div className="flex items-start justify-between gap-3">
                    <h2
                        id="tarif-form-title"
                        className="text-base font-bold text-neutral-900 sm:text-xl"
                    >
                        {initial ? 'Edit Tarif' : 'Tambah Tarif'}
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

                <form onSubmit={handleSubmit} className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
                    <div>
                        <label htmlFor="tarif-moda" className={labelClass}>
                            Moda
                        </label>
                        <div className="relative">
                            <select
                                id="tarif-moda"
                                value={moda}
                                onChange={(event) => {
                                    setModa(event.target.value);
                                    setErrors((prev) => ({ ...prev, moda: '' }));
                                }}
                                className={`${selectClass} ${moda ? '' : 'text-neutral-400'}`}
                            >
                                <option value="" disabled hidden>
                                    Pilih moda
                                </option>
                                {modaOptions.map((option) => (
                                    <option key={option} value={option} className="text-neutral-900">
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
                        <label htmlFor="tarif-skema" className={labelClass}>
                            Skema Tarif
                        </label>
                        <div className="relative">
                            <select
                                id="tarif-skema"
                                value={skema}
                                onChange={(event) => {
                                    setSkema(event.target.value as TarifSkema);
                                    setErrors({});
                                }}
                                className={selectClass}
                            >
                                {skemaOptions.map((option) => (
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

                    <div>
                        <p className={labelClass}>Detail Tarif</p>

                        {skema === 'FIXED_PRICE' ? (
                            <div>
                                <input
                                    type="number"
                                    min={1}
                                    value={hargaPerPerjalanan}
                                    onChange={(event) => setHargaPerPerjalanan(event.target.value)}
                                    placeholder="Masukkan nominal harga ..."
                                    aria-label="Detail tarif"
                                    className={`${inputClass} mt-3`}
                                />
                                {errors.hargaPerPerjalanan && (
                                    <p className={errorClass}>{errors.hargaPerPerjalanan}</p>
                                )}
                            </div>
                        ) : (
                            <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3 sm:mt-3 sm:gap-x-6 sm:gap-y-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="tarif-minimum" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Tarif Minimum
                                    </label>
                                    <input
                                        id="tarif-minimum"
                                        type="number"
                                        min={1}
                                        value={tarifMinimum}
                                        onChange={(event) => setTarifMinimum(event.target.value)}
                                        placeholder="Isi nominal ..."
                                        className={inputClass}
                                    />
                                    {errors.tarifMinimum && (
                                        <p className={errorClass}>{errors.tarifMinimum}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="tarif-batas" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Batas Jarak Awal (km)
                                    </label>
                                    <input
                                        id="tarif-batas"
                                        type="number"
                                        min={0}
                                        value={batasJarakAwal}
                                        onChange={(event) => setBatasJarakAwal(event.target.value)}
                                        placeholder="0 km"
                                        className={inputClass}
                                    />
                                    {errors.batasJarakAwal && (
                                        <p className={errorClass}>{errors.batasJarakAwal}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="tarif-km" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Tarif per Km Berikutnya
                                    </label>
                                    <input
                                        id="tarif-km"
                                        type="number"
                                        min={1}
                                        value={tarifKmBerikutnya}
                                        onChange={(event) => setTarifKmBerikutnya(event.target.value)}
                                        placeholder="Isi nominal ..."
                                        className={inputClass}
                                    />
                                    {errors.tarifKmBerikutnya && (
                                        <p className={errorClass}>{errors.tarifKmBerikutnya}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="tarif-layanan" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Biaya Layanan
                                    </label>
                                    <input
                                        id="tarif-layanan"
                                        type="number"
                                        min={0}
                                        value={biayaLayanan}
                                        onChange={(event) => setBiayaLayanan(event.target.value)}
                                        placeholder="Isi nominal ..."
                                        className={inputClass}
                                    />
                                    {errors.biayaLayanan && (
                                        <p className={errorClass}>{errors.biayaLayanan}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="tarif-status" className={labelClass}>
                            Status
                        </label>
                        <div className="relative">
                            <select
                                id="tarif-status"
                                value={status}
                                onChange={(event) => setStatus(event.target.value as TarifStatus)}
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

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3 sm:pt-4">
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
                            {initial ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default TarifFormModal;
