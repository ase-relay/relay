'use client';

import { useEffect, useState } from 'react';

// Harus sama dengan durasi animasi keluar di globals.css (.form-modal-*-exit).
const EXIT_DURATION_MS = 160;

/**
 * Menunda unmount modal sampai animasi keluar selesai.
 *
 * - `shouldRender`  : pakai untuk `if (!shouldRender) return null;`
 * - `overlayClass`  : tambahkan ke className overlay (backdrop)
 * - `dialogClass`   : tambahkan ke className panel dialog
 */
export function useModalTransition(isOpen: boolean) {
    const [shouldRender, setShouldRender] = useState(isOpen);

    // Modal dibuka: langsung render (tanpa menunggu effect) agar animasi masuk tidak telat.
    if (isOpen && !shouldRender) setShouldRender(true);

    useEffect(() => {
        if (isOpen) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const timer = window.setTimeout(() => setShouldRender(false), reduceMotion ? 0 : EXIT_DURATION_MS);
        // Kalau dibuka lagi saat animasi keluar berjalan, batalkan unmount.
        return () => window.clearTimeout(timer);
    }, [isOpen]);

    // Style animasinya ada di globals.css (.form-modal-*).
    const overlayClass = isOpen ? 'form-modal-overlay' : 'form-modal-overlay-exit';
    const dialogClass = isOpen ? 'form-modal-panel' : 'form-modal-panel-exit';

    return { shouldRender, overlayClass, dialogClass };
}