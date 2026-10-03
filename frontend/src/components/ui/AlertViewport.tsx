'use client';

import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

export function AlertViewport({ children }: { children: ReactNode }) {
    const mounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );

    if (!mounted) return null;

    return createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-15 z-70 flex flex-col items-center gap-2 *:pointer-events-auto">
            {children}
        </div>,
        document.body,
    );
}
