'use client';

import { ReactNode, useEffect } from 'react';

export type ConfirmEditModalProps = {
    isOpen: boolean;
    title?: ReactNode;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function ConfirmEditModal({
    isOpen,
    title = 'Simpan Perubahan?',
    description = 'Apakah kamu yakin ingin menyimpan perubahan ini? Data yang telah diubah tidak dapat dikembalikan.',
    confirmLabel = 'Simpan',
    cancelLabel = 'Batal',
    isLoading = false,
    onCancel,
    onConfirm,
}: ConfirmEditModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && !isLoading) onCancel();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-2.5 sm:p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isLoading) onCancel();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-edit-title"
                aria-describedby="confirm-edit-description"
                className="flex w-full max-w-[400px] flex-col rounded-xl border border-neutral-300 bg-white px-4 py-5 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:w-[500px] sm:max-w-none sm:h-[315px] sm:rounded-2xl sm:px-11 sm:py-11"
            >
                <h2
                    id="confirm-edit-title"
                    className="text-2xl font-bold tracking-tight text-orange-500 sm:text-3xl"
                >
                    {title}
                </h2>
                <div
                    id="confirm-edit-description"
                    className="mt-4 text-base leading-relaxed text-neutral-950 sm:mt-7 sm:text-lg sm:leading-snug"
                >
                    {description}
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-auto sm:flex-row sm:justify-end sm:gap-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="cursor-pointer rounded-[20px] bg-neutral-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-2 sm:text-lg"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-3 sm:px-6 sm:py-2 sm:text-lg"
                    >
                        {isLoading ? 'Memproses...' : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default ConfirmEditModal;
