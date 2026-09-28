'use client';

import type { ReactNode } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

export type HapusProps = {
    isOpen: boolean;
    title?: string;
    description?: ReactNode;
    confirmLabel?: string;
    onCancel: () => void;
    onConfirm: () => void;
};

export function Hapus({
    isOpen,
    title = 'Hapus Data?',
    description = 'Data yang telah dihapus tidak dapat dipulihkan.',
    confirmLabel = 'Hapus',
    onCancel,
    onConfirm,
}: HapusProps) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
}

export default Hapus;
