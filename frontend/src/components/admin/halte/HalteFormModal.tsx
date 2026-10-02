'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { HiChevronDown, HiMap, HiOutlinePencilSquare, HiXMark } from 'react-icons/hi2';
import SearchIcon from '@/components/icons/common/SearchIcon';
import type { Halte, HalteInput } from '@/lib/types/halte';

export type HalteFormModalProps = {
    isOpen: boolean;
    initial?: Halte | null;
    onCancel: () => void;
    onSave: (input: HalteInput) => void;
    disabled?: boolean;
};

type LokasiMode = 'peta' | 'manual';

const statusOptions: { value: string; label: string }[] = [
    { value: 'true', label: 'Aktif' },
    { value: 'false', label: 'Tidak Aktif' },
];

const pickedLocation = {
    alamat: 'Jl. Aceh No.36, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40117',
    latitude: '-123456',
    longitude: '684.827947',
};

function MapPin() {
    return (
        <svg
            viewBox="0 0 24 34"
            className="h-6 w-5 drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)] sm:h-8 sm:w-6"
            aria-hidden="true"
        >
            <path
                d="M12 0C5.925 0 1 4.925 1 11c0 8.25 11 23 11 23s11-14.75 11-23C23 4.925 18.075 0 12 0z"
                fill="#EA4335"
            />
            <circle cx="12" cy="11" r="4.2" fill="#FFFFFF" />
        </svg>
    );
}

export function HalteFormModal({ isOpen, initial = null, onCancel, onSave, disabled = false }: HalteFormModalProps) {
    const [nama, setNama] = useState(initial?.namaHalte ?? '');
    const [alamat, setAlamat] = useState(initial?.alamat ?? '');
    const [latitude, setLatitude] = useState(initial ? String(initial.latitude) : '');
    const [longitude, setLongitude] = useState(initial ? String(initial.longitude) : '');
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
    const [lokasiMode, setLokasiMode] = useState<LokasiMode>(initial ? 'manual' : 'peta');
    const [mapOpen, setMapOpen] = useState(false);
    const [mapQuery, setMapQuery] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            if (mapOpen) setMapOpen(false);
            else onCancel();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, mapOpen, onCancel]);

    if (!isOpen) return null;

    const inputClass =
        'mt-2 h-10 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-12 sm:px-5 sm:text-base';
    const labelClass = 'block text-sm font-bold text-neutral-900 sm:text-base';
    const panelLabelClass = 'block text-xs font-bold text-neutral-900 sm:text-sm';
    const panelInputClass =
        'mt-1.5 h-9 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-10 sm:px-4 sm:text-sm';
    const errorClass = 'mt-0.5 text-[11px] text-red-600 sm:text-xs';

    const hasLocation =
        alamat.trim() !== '' && latitude.trim() !== '' && longitude.trim() !== '';

    function clearErrors(key: string) {
        setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function applyPickedLocation() {
        setAlamat(pickedLocation.alamat);
        setLatitude(pickedLocation.latitude);
        setLongitude(pickedLocation.longitude);
        setLokasiMode('peta');
        setErrors((prev) => ({ ...prev, alamat: '', latitude: '', longitude: '' }));
        setMapOpen(false);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};

        if (!nama.trim()) nextErrors.nama = 'Nama halte wajib diisi';
        if (!alamat.trim()) nextErrors.alamat = 'Alamat wajib diisi';

        const latitudeValue = Number(latitude.trim());
        const longitudeValue = Number(longitude.trim());
        if (!latitude.trim()) {
            nextErrors.latitude = 'Latitude wajib diisi';
        } else if (!Number.isFinite(latitudeValue)) {
            nextErrors.latitude = 'Latitude harus berupa angka';
        } else if (latitudeValue < -90 || latitudeValue > 90) {
            nextErrors.latitude = 'Latitude harus di antara -90 dan 90';
        }
        if (!longitude.trim()) {
            nextErrors.longitude = 'Longitude wajib diisi';
        } else if (!Number.isFinite(longitudeValue)) {
            nextErrors.longitude = 'Longitude harus berupa angka';
        } else if (longitudeValue < -180 || longitudeValue > 180) {
            nextErrors.longitude = 'Longitude harus di antara -180 dan 180';
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        onSave({
            namaHalte: nama.trim(),
            alamat: alamat.trim(),
            latitude: latitudeValue,
            longitude: longitudeValue,
            isActive,
        });
    }

    const radioClass =
        'peer sr-only absolute opacity-0 pointer-events-none';
    const radioCircleClass =
        'h-4 w-4 shrink-0 rounded-full border-2 border-neutral-400 transition peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:shadow-[inset_0_0_0_2px_#ffffff] sm:h-5 sm:w-5 sm:peer-checked:shadow-[inset_0_0_0_3px_#ffffff]';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="halte-form-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white px-3.5 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:max-w-3xl sm:rounded-2xl sm:px-10 sm:py-8"
            >
                <div className="flex items-start justify-between gap-3">
                    <h2 id="halte-form-title" className="text-xl font-bold text-neutral-900 sm:text-xl">
                        {initial ? 'Edit Halte' : 'Tambah Halte'}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Tutup modal"
                        className="-mt-1 shrink-0 cursor-pointer rounded-lg p-1 text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                        <HiXMark className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
                    <div>
                        <label htmlFor="halte-nama" className={labelClass}>
                            Nama Halte
                        </label>
                        <input
                            id="halte-nama"
                            type="text"
                            value={nama}
                            onChange={(event) => {
                                setNama(event.target.value);
                                clearErrors('nama');
                            }}
                            placeholder="Isi nama halte"
                            className={inputClass}
                        />
                        {errors.nama && <p className={errorClass}>{errors.nama}</p>}
                    </div>

                    <div>
                        <span className="block text-xl font-bold text-neutral-900">
                            Lokasi Halte
                        </span>

                        <div className="mt-2 flex flex-wrap items-center gap-3 sm:mt-3 sm:gap-4">
                            <label
                                htmlFor="halte-lokasi-peta"
                                className="relative flex cursor-pointer items-center gap-1.5 text-xs text-neutral-900 sm:gap-2 sm:text-sm"
                            >
                                <input
                                    id="halte-lokasi-peta"
                                    type="radio"
                                    name="halte-lokasi"
                                    checked={lokasiMode === 'peta'}
                                    onChange={() => setLokasiMode('peta')}
                                    className={radioClass}
                                />
                                <span aria-hidden="true" className={radioCircleClass} />
                                Pilih di peta
                            </label>

                            <label
                                htmlFor="halte-lokasi-manual"
                                className="relative flex cursor-pointer items-center gap-1.5 text-xs text-neutral-900 sm:gap-2 sm:text-sm"
                            >
                                <input
                                    id="halte-lokasi-manual"
                                    type="radio"
                                    name="halte-lokasi"
                                    checked={lokasiMode === 'manual'}
                                    onChange={() => setLokasiMode('manual')}
                                    className={radioClass}
                                />
                                <span aria-hidden="true" className={radioCircleClass} />
                                Masukkan manual
                            </label>
                        </div>

                        <div className="mt-2 rounded-xl bg-primary-50 p-3 sm:mt-3 sm:rounded-2xl sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-xs font-bold text-neutral-900 sm:text-sm">
                                    Detail Lokasi
                                </h3>
                                {lokasiMode === 'peta' && hasLocation && (
                                    <button
                                        type="button"
                                        onClick={() => setMapOpen(true)}
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
                                    >
                                        <HiOutlinePencilSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Ubah Lokasi
                                    </button>
                                )}
                            </div>

                            {lokasiMode === 'peta' ? (
                                hasLocation ? (
                                    <div className="mt-2 sm:mt-3">
                                        <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">
                                            Alamat
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">{alamat}</p>

                                        <div className="mt-2 grid grid-cols-1 gap-2 sm:mt-3 sm:gap-3 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">
                                                    Latitude
                                                </p>
                                                <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                                    {latitude}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">
                                                    Longitude
                                                </p>
                                                <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                                    {longitude}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2 flex flex-col items-center gap-3 py-4 text-center sm:mt-3 sm:gap-4 sm:py-6">
                                        <p className="max-w-150 text-xs text-neutral-400 sm:max-w-xl sm:text-sm">
                                            Pilih lokasi halte di peta untuk mendapatkan alamat dan
                                            koordinat secara otomatis
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setMapOpen(true)}
                                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                                        >
                                            <HiMap className="h-4 w-4 sm:h-5 sm:w-5" />
                                            Pilih Lokasi di Peta
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
                                    <div>
                                        <label htmlFor="halte-alamat" className={panelLabelClass}>
                                            Alamat
                                        </label>
                                        <input
                                            id="halte-alamat"
                                            type="text"
                                            value={alamat}
                                            onChange={(event) => {
                                                setAlamat(event.target.value);
                                                clearErrors('alamat');
                                            }}
                                            placeholder="Masukkan alamat lengkap"
                                            className={panelInputClass}
                                        />
                                        {errors.alamat && (
                                            <p className={errorClass}>{errors.alamat}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="halte-latitude"
                                                className={panelLabelClass}
                                            >
                                                Latitude
                                            </label>
                                            <input
                                                id="halte-latitude"
                                                type="text"
                                                value={latitude}
                                                onChange={(event) => {
                                                    setLatitude(event.target.value);
                                                    clearErrors('latitude');
                                                }}
                                                placeholder="Contoh: -1939129"
                                                className={panelInputClass}
                                            />
                                            {errors.latitude && (
                                                <p className={errorClass}>{errors.latitude}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="halte-longitude"
                                                className={panelLabelClass}
                                            >
                                                Longitude
                                            </label>
                                            <input
                                                id="halte-longitude"
                                                type="text"
                                                value={longitude}
                                                onChange={(event) => {
                                                    setLongitude(event.target.value);
                                                    clearErrors('longitude');
                                                }}
                                                placeholder="Contoh: 103.94832"
                                                className={panelInputClass}
                                            />
                                            {errors.longitude && (
                                                <p className={errorClass}>{errors.longitude}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {lokasiMode === 'peta' && errors.alamat && (
                                <p className={errorClass}>{errors.alamat}</p>
                            )}
                            {lokasiMode === 'peta' && errors.latitude && (
                                <p className={errorClass}>{errors.latitude}</p>
                            )}
                            {lokasiMode === 'peta' && errors.longitude && (
                                <p className={errorClass}>{errors.longitude}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="halte-status" className={labelClass}>
                            Status
                        </label>
                        <div className="relative">
                            <select
                                id="halte-status"
                                value={isActive ? 'true' : 'false'}
                                onChange={(event) => setIsActive(event.target.value === 'true')}
                                disabled={disabled}
                                className={`${inputClass} cursor-pointer appearance-none pr-12 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <HiChevronDown
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 right-6 h-5 w-5 -translate-y-1/2 text-neutral-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={disabled}
                            className="cursor-pointer rounded-full bg-neutral-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed sm:px-6 sm:py-2.5 sm:text-base"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={disabled}
                            className="cursor-pointer rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:px-6 sm:py-2.5 sm:text-base"
                        >
                            {initial ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </section>

            {mapOpen && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/45 p-2.5 sm:p-4"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setMapOpen(false);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="halte-map-title"
                        className="my-auto w-full max-w-2xl rounded-xl bg-white px-3.5 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.28)] sm:max-w-3xl sm:rounded-2xl sm:px-5 sm:py-6"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h2
                                id="halte-map-title"
                                className="text-base font-bold text-neutral-900 sm:text-lg"
                            >
                                Pilih Lokasi di Peta
                            </h2>
                            <button
                                type="button"
                                onClick={() => setMapOpen(false)}
                                aria-label="Tutup peta"
                                className="-mt-1 shrink-0 cursor-pointer rounded-lg p-1 text-neutral-900 transition hover:bg-neutral-100"
                            >
                                <HiXMark className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        <div className="relative mt-3 sm:mt-4">
                            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 sm:left-4">
                                <SearchIcon />
                            </span>
                            <input
                                type="search"
                                value={mapQuery}
                                onChange={(event) => setMapQuery(event.target.value)}
                                placeholder="Cari lokasi, alamat, atau nama tempat ..."
                                aria-label="Cari lokasi, alamat, atau nama tempat"
                                className="h-10 w-full rounded-xl border border-neutral-300 bg-white pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-12 sm:rounded-2xl sm:pr-5 sm:pl-12 sm:text-base"
                            />
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5 sm:mt-4 sm:gap-4">
                            <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-neutral-100 lg:col-span-3 sm:rounded-2xl">
                                <Image
                                    src="/images/MapIllustration.png"
                                    alt="Peta area Bandung"
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 600px"
                                    className="object-cover"
                                />
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                                    <MapPin />
                                </span>
                            </div>

                            <div className="rounded-xl bg-primary-50 p-3 lg:col-span-2 sm:rounded-2xl sm:p-4">
                                <h3 className="text-xs font-bold text-neutral-900 sm:text-sm">
                                    Detail Lokasi
                                </h3>
                                <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
                                    <div>
                                        <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">
                                            Alamat
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                            {pickedLocation.alamat}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">
                                            Latitude
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                            {pickedLocation.latitude}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">
                                            Longitude
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                            {pickedLocation.longitude}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 sm:mt-6">
                            <button
                                type="button"
                                onClick={() => setMapOpen(false)}
                                className="cursor-pointer rounded-full bg-neutral-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500 sm:px-6 sm:py-2.5 sm:text-base"
                            >
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={applyPickedLocation}
                                className="cursor-pointer rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 sm:px-6 sm:py-2.5 sm:text-base"
                            >
                                Gunakan Lokasi
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default HalteFormModal;
