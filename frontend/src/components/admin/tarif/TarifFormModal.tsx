'use client';

import { FormEvent, useEffect, useState } from 'react';
import { HiChevronDown, HiXMark } from 'react-icons/hi2';
import type { Tarif, TarifInput, TarifSkema } from '@/lib/types/tarif';

export type TarifFormModalProps = {
    isOpen: boolean;
    moda: { id: number; namaModa: string } | null;
    initial?: Tarif | null;
    onCancel: () => void;
    onSubmit: (input: TarifInput) => void;
    submitting: boolean;
};

const skemaOptions: { value: TarifSkema; label: string }[] = [
    { value: 'FLAT', label: 'Fixed price' },
    { value: 'PER_KM', label: 'Berdasarkan jarak' },
];

type Parsed = { ok: true; value: number } | { ok: false; reason: 'empty' | 'invalid' };

// Rupiah (harga, minimum, per km, layanan): digit murni; koma/titik/minus/1e3 ditolak.
function parseRupiah(raw: string): Parsed {
    const trimmed = raw.trim();
    if (trimmed === '') return { ok: false, reason: 'empty' };
    if (!/^\d+$/.test(trimmed)) return { ok: false, reason: 'invalid' };
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return { ok: false, reason: 'invalid' };
    return { ok: true, value: num };
}

// Batas jarak (km): desimal boleh, koma dibaca sebagai titik.
function parseKm(raw: string): Parsed {
    const trimmed = raw.trim();
    if (trimmed === '') return { ok: false, reason: 'empty' };
    if (!/^\d+([.,]\d+)?$/.test(trimmed)) return { ok: false, reason: 'invalid' };
    const num = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(num)) return { ok: false, reason: 'invalid' };
    return { ok: true, value: num };
}

export function TarifFormModal({ isOpen, moda, initial = null, onCancel, onSubmit, submitting }: TarifFormModalProps) {
    const [skema, setSkema] = useState<TarifSkema>(initial?.tipeTarif ?? 'FLAT');
    const [harga, setHarga] = useState(
        initial?.nominalDasar != null ? String(initial.nominalDasar) : '',
    );
    const [batasJarak, setBatasJarak] = useState(
        initial?.jarakMinimumKm != null ? String(initial.jarakMinimumKm) : '',
    );
    const [tarifPerKm, setTarifPerKm] = useState(
        initial?.nominalPerKm != null ? String(initial.nominalPerKm) : '',
    );
    const [layanan, setLayanan] = useState(
        initial?.biayaLayanan != null ? String(initial.biayaLayanan) : '',
    );
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
        if (moda == null) return;
        const nextErrors: Record<string, string> = {};

        if (skema === 'FLAT') {
            const parsed = parseRupiah(harga);
            if (!parsed.ok && parsed.reason === 'empty') {
                nextErrors.harga = 'Harga per perjalanan wajib diisi';
            } else if (!parsed.ok) {
                nextErrors.harga = 'Harga per perjalanan harus berupa angka bulat tanpa titik atau koma (contoh: 4900)';
            } else if (parsed.value <= 0) {
                nextErrors.harga = 'Harga per perjalanan harus lebih besar dari 0';
            }
        } else {
            const minimum = parseRupiah(harga);
            if (!minimum.ok && minimum.reason === 'empty') {
                nextErrors.minimum = 'Tarif minimum wajib diisi';
            } else if (!minimum.ok) {
                nextErrors.minimum = 'Tarif minimum harus berupa angka bulat tanpa titik atau koma (contoh: 4900)';
            } else if (minimum.value <= 0) {
                nextErrors.minimum = 'Tarif minimum harus lebih besar dari 0';
            }
            const perKm = parseRupiah(tarifPerKm);
            if (!perKm.ok && perKm.reason === 'empty') {
                nextErrors.perKm = 'Tarif per km berikutnya wajib diisi';
            } else if (!perKm.ok) {
                nextErrors.perKm = 'Tarif per km berikutnya harus berupa angka bulat tanpa titik atau koma (contoh: 4900)';
            } else if (perKm.value <= 0) {
                nextErrors.perKm = 'Tarif per km berikutnya harus lebih besar dari 0';
            }
            if (batasJarak.trim() !== '') {
                const batas = parseKm(batasJarak);
                if (!batas.ok) {
                    nextErrors.batas = 'Batas jarak awal harus berupa angka 0 atau lebih (contoh: 2 atau 2,5)';
                }
            }
            if (layanan.trim() !== '') {
                const layananParsed = parseRupiah(layanan);
                if (!layananParsed.ok) {
                    nextErrors.layanan = 'Biaya layanan harus berupa angka bulat 0 atau lebih';
                }
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        if (skema === 'FLAT') {
            const parsed = parseRupiah(harga);
            if (!parsed.ok) return;
            onSubmit({
                modaId: moda.id,
                tipeTarif: 'FLAT',
                nominalDasar: parsed.value,
            });
            return;
        }

        const minimum = parseRupiah(harga);
        const perKm = parseRupiah(tarifPerKm);
        if (!minimum.ok || !perKm.ok) return;
        const batas = batasJarak.trim() === '' ? null : parseKm(batasJarak);
        const layananParsed = layanan.trim() === '' ? null : parseRupiah(layanan);
        if (batas !== null && !batas.ok) return;
        if (layananParsed !== null && !layananParsed.ok) return;
        onSubmit({
            modaId: moda.id,
            tipeTarif: 'PER_KM',
            nominalDasar: minimum.value,
            nominalPerKm: perKm.value,
            jarakMinimumKm: batas === null ? null : batas.value,
            biayaLayanan: layananParsed === null ? 0 : layananParsed.value,
        });
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
                        {initial ? 'Edit Tarif' : 'Atur Tarif'}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Tutup"
                        disabled={submitting}
                        className="-mt-1 shrink-0 cursor-pointer rounded-lg p-1 text-neutral-900 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                                value={moda?.id ?? ''}
                                disabled
                                aria-label="Moda (terkunci)"
                                className={`${selectClass} text-neutral-900 disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                                {moda && (
                                    <option value={moda.id} className="text-neutral-900">
                                        {moda.namaModa}
                                    </option>
                                )}
                            </select>
                            <HiChevronDown
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-neutral-500"
                            />
                        </div>
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
                                disabled={submitting}
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

                        {skema === 'FLAT' ? (
                            <div>
                                <label htmlFor="tarif-harga" className="mt-3 block text-xs font-bold text-neutral-900 sm:text-sm">
                                    Harga per perjalanan
                                </label>
                                <input
                                    id="tarif-harga"
                                    type="text"
                                    inputMode="decimal"
                                    value={harga}
                                    onChange={(event) => setHarga(event.target.value)}
                                    placeholder="Masukkan nominal harga ..."
                                    disabled={submitting}
                                    className={`${inputClass}`}
                                />
                                {errors.harga && (
                                    <p className={errorClass}>{errors.harga}</p>
                                )}
                            </div>
                        ) : (
                            <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-3 sm:mt-3 sm:gap-x-6 sm:gap-y-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="tarif-minimum" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Tarif minimum
                                    </label>
                                    <input
                                        id="tarif-minimum"
                                        type="text"
                                        inputMode="decimal"
                                        value={harga}
                                        onChange={(event) => setHarga(event.target.value)}
                                        placeholder="Isi nominal ..."
                                        disabled={submitting}
                                        className={inputClass}
                                    />
                                    {errors.minimum && (
                                        <p className={errorClass}>{errors.minimum}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="tarif-batas" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Batas jarak awal (km)
                                    </label>
                                    <input
                                        id="tarif-batas"
                                        type="text"
                                        inputMode="decimal"
                                        value={batasJarak}
                                        onChange={(event) => setBatasJarak(event.target.value)}
                                        placeholder="Kosongkan bila tidak ada batas"
                                        disabled={submitting}
                                        className={inputClass}
                                    />
                                    {errors.batas && (
                                        <p className={errorClass}>{errors.batas}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="tarif-km" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Tarif per km berikutnya
                                    </label>
                                    <input
                                        id="tarif-km"
                                        type="text"
                                        inputMode="decimal"
                                        value={tarifPerKm}
                                        onChange={(event) => setTarifPerKm(event.target.value)}
                                        placeholder="Isi nominal ..."
                                        disabled={submitting}
                                        className={inputClass}
                                    />
                                    {errors.perKm && (
                                        <p className={errorClass}>{errors.perKm}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="tarif-layanan" className="block text-xs font-bold text-neutral-900 sm:text-sm">
                                        Biaya layanan
                                    </label>
                                    <input
                                        id="tarif-layanan"
                                        type="text"
                                        inputMode="decimal"
                                        value={layanan}
                                        onChange={(event) => setLayanan(event.target.value)}
                                        placeholder="Kosongkan bila tidak ada"
                                        disabled={submitting}
                                        className={inputClass}
                                    />
                                    {errors.layanan && (
                                        <p className={errorClass}>{errors.layanan}</p>
                                    )}
                                </div>

                                <p className="text-xs text-neutral-500 sm:col-span-2 sm:text-sm">
                                    Tarif minimum berlaku sampai batas jarak awal; setelahnya ditambah tarif per km, dibulatkan ke atas kelipatan Rp500; biaya layanan ditambahkan per perjalanan setelah pembulatan; bila batas jarak kosong, tarif per km berlaku sejak km pertama.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3 sm:pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={submitting}
                            className="cursor-pointer rounded-full bg-neutral-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-base"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="cursor-pointer rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-base"
                        >
                            {submitting ? 'Menyimpan...' : initial ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default TarifFormModal;
