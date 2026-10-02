'use client';

import { FormEvent, useEffect, useState } from 'react';
import { HiXMark } from 'react-icons/hi2';
import type { Moda, ModaInput } from '@/lib/types/moda';

export type ModaFormModalProps = {
    isOpen: boolean;
    initial?: Moda | null;
    onCancel: () => void;
    onSave: (input: ModaInput) => void;
    disabled?: boolean;
};

export function ModaFormModal({ isOpen, initial = null, onCancel, onSave, disabled = false }: ModaFormModalProps) {
    const [nama, setNama] = useState(initial?.namaModa ?? '');
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
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
    const labelClass = 'block text-sm font-bold text-neutral-900 sm:text-base';
    const errorClass = 'mt-1 text-xs text-red-600 sm:text-sm';

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};

        if (!nama.trim()) nextErrors.nama = 'Nama moda wajib diisi';

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        onSave({ namaModa: nama.trim(), isActive });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-2.5 sm:p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="moda-form-title"
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white px-3.5 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:max-w-2xl sm:rounded-2xl sm:px-10 sm:py-8"
            >
                <div className="flex items-start justify-between gap-3">
                    <h2
                        id="moda-form-title"
                        className="text-base font-bold text-neutral-900 sm:text-xl"
                    >
                        {initial ? 'Edit Moda' : 'Tambah Moda'}
                    </h2>

                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Tutup modal"
                        disabled={disabled}
                        className="-mt-1 shrink-0 cursor-pointer rounded-lg p-1 text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <HiXMark className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
                    <div>
                        <label htmlFor="moda-nama" className={labelClass}>
                            Nama Moda
                        </label>
                        <input
                            id="moda-nama"
                            type="text"
                            value={nama}
                            onChange={(event) => setNama(event.target.value)}
                            placeholder="Masukkan nama moda"
                            disabled={disabled}
                            className={inputClass}
                        />
                        {errors.nama && <p className={errorClass}>{errors.nama}</p>}
                    </div>

                    <div>
                        <label htmlFor="moda-status" className={labelClass}>
                            Status
                        </label>
                        <select
                            id="moda-status"
                            value={isActive ? 'true' : 'false'}
                            onChange={(event) => setIsActive(event.target.value === 'true')}
                            disabled={disabled}
                            className={`${inputClass} cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%238E8E93' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m5 7.5 5 5 5-5'/%3E%3C/svg%3E")] bg-size-[20px_20px] bg-position-[right_16px_center] bg-no-repeat pr-10 sm:bg-position-[right_28px_center] sm:pr-12 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <option value="true">Aktif</option>
                            <option value="false">Tidak Aktif</option>
                        </select>
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3 sm:pt-4">
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
        </div>
    );
}

export default ModaFormModal;
