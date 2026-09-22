'use client';

import { ReactNode, useEffect } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: ReactNode;
  description?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  /** Defaults to destructive styling, matching the account-delete design. */
  variant?: 'danger' | 'primary';
  className?: string;
}

export function ConfirmModal({
  isOpen,
  title = 'Hapus Akun?',
  description = 'Apakah kamu yakin ingin menghapus akun ini? Data akun yang telah dihapus tidak dapat dipulihkan.',
  cancelLabel = 'Batal',
  confirmLabel = 'Hapus Akun',
  onCancel,
  onConfirm,
  isLoading = false,
  variant = 'danger',
  className = '',
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isLoading) onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const confirmClass = isDanger
    ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
    : 'bg-primary-600 hover:bg-primary-700 focus-visible:outline-primary-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className={`w-full max-w-2xl rounded-[28px] border border-neutral-300 bg-white px-8 py-10 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:px-12 sm:py-14 ${className}`}
      >
        <h2 id="confirm-modal-title" className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDanger ? 'text-red-600' : 'text-primary-600'}`}>
          {title}
        </h2>
        <div id="confirm-modal-description" className="mt-12 max-w-xl text-xl leading-relaxed text-neutral-950 sm:text-2xl">
          {description}
        </div>

        <div className="mt-14 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-full bg-neutral-400 px-9 py-3 text-xl font-semibold text-white transition hover:bg-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex cursor-pointer items-center justify-center gap-3 rounded-full px-9 py-3 text-xl font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {isDanger && <HiOutlineTrash className="h-6 w-6" aria-hidden="true" />}
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
