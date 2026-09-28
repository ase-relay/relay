'use client';

import { ReactNode, useEffect } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';

export type ConfirmDeleteModalProps = {
    isOpen: boolean;
    title?: ReactNode;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export function ConfirmDeleteModal({
    isOpen,
    title = 'Hapus Data?',
    description = 'Apakah kamu yakin ingin menghapus data ini? Data yang telah dihapus tidak dapat dipulihkan.',
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
    isLoading = false,
    onCancel,
    onConfirm,
}: ConfirmDeleteModalProps) {
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
                aria-labelledby="confirm-delete-title"
                aria-describedby="confirm-delete-description"
                className="flex w-full max-w-100 flex-col rounded-xl border border-neutral-300 bg-white px-4 py-5 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:w-125 sm:max-w-none sm:h-78.75 sm:rounded-2xl sm:px-11 sm:py-11"
            >
                <h2
                    id="confirm-delete-title"
                    className="text-2xl font-bold tracking-tight text-red-500 sm:text-3xl"
                >
                    {title}
                </h2>
                <div
                    id="confirm-delete-description"
                    className="mt-4 text-base leading-relaxed text-neutral-950 sm:mt-7 sm:text-lg sm:leading-snug"
                >
                    {description}
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-auto sm:flex-row sm:justify-end sm:gap-4">
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
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-3 sm:px-6 sm:py-2 sm:text-lg"
                    >
                        <HiOutlineTrash className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                        {isLoading ? 'Memproses...' : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default ConfirmDeleteModal;
