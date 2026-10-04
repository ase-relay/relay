'use client';

import { FormEvent, useCallback, useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import { useModalTransition } from '@/hooks/useModalTransition';
import { HiChevronDown, HiXMark } from 'react-icons/hi2';
import SearchIcon from '@/components/icons/common/SearchIcon';
import type { Rute, RuteInput } from '@/lib/types/rute';
import type { Halte } from '@/lib/types/halte';
import type { Moda } from '@/lib/types/moda';

export type RuteFormModalProps = {
    isOpen: boolean;
    haltes: Halte[];
    modas: Moda[];
    initial?: Rute | null;
    onCancel: () => void;
    onSubmit: (input: RuteInput) => void;
    submitting: boolean;
    detailLoading?: boolean;
};

export function RuteFormModal({
    isOpen,
    haltes,
    modas,
    initial = null,
    onCancel,
    onSubmit,
    submitting,
    detailLoading = false,
}: RuteFormModalProps) {
    const isEdit = initial != null;

    const initialHalteIds = initial?.stops?.map((s) => s.halteId) ?? [];
    const initialSegmentValues: Record<string, { menit: string; meter: string }> = {};
    if (initial?.stops) {
        const ids = initial.stops.map((s) => s.halteId);
        for (let i = 0; i < ids.length - 1; i++) {
            const key = `${ids[i]}>${ids[i + 1]}`;
            const stop = initial.stops[i];
            initialSegmentValues[key] = {
                menit: stop.estimasiMenit?.toString() ?? '',
                meter: stop.jarakMeter?.toString() ?? '',
            };
        }
    }

    const [step, setStep] = useState<1 | 2>(1);
    const [namaRute, setNamaRute] = useState(() => initial?.namaRute ?? '');
    const [kodeRute, setKodeRute] = useState(() => initial?.kodeRute ?? '');
    const [modaId, setModaId] = useState(() => initial?.modaId ?? 0);
    const [isActive, setIsActive] = useState(() => initial?.isActive ?? true);
    const [selectedHalteIds, setSelectedHalteIds] = useState(() => initialHalteIds);
    const [halteQuery, setHalteQuery] = useState('');
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [segmentValues, setSegmentValues] = useState(() => initialSegmentValues);
    const orderListRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef(new Map<number, HTMLLIElement>());
    const prevRects = useRef(new Map<number, DOMRect>());
    const moveTimer = useRef<number | null>(null);
    const pendingIndex = useRef<number | null>(null);
    const dragPointer = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    useEffect(
        () => () => {
            if (moveTimer.current !== null) window.clearTimeout(moveTimer.current);
        },
        [],
    );

    // Animasi FLIP searah: hanya item yang bergeser yang beranimasi    // (item yang di-drag mengikuti kursor, tidak ikut beranimasi).
    useEffect(() => {
        if (dragIndex == null) return;
        const draggedId = selectedHalteIds[dragIndex];
        itemRefs.current.forEach((el, id) => {
            if (id === draggedId) return;
            const prev = prevRects.current.get(id);
            if (!el || !prev) return;
            const dy = prev.top - el.getBoundingClientRect().top;
            if (dy !== 0) {
                el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
                    duration: 180,
                    easing: 'ease-out',
                });
            }
        });
    }, [selectedHalteIds, dragIndex]);

    const snapshotItemPositions = useCallback(() => {
        const rects = new Map<number, DOMRect>();
        itemRefs.current.forEach((el, id) => {
            if (el) rects.set(id, el.getBoundingClientRect());
        });
        prevRects.current = rects;
    }, []);

    const clearPendingMove = useCallback(() => {
        if (moveTimer.current !== null) {
            window.clearTimeout(moveTimer.current);
            moveTimer.current = null;
        }
        pendingIndex.current = null;
    }, []);

    // Tunda perpindahan sebentar: hanya pindah bila kursor bertahan
    // di target yang sama, agar tidak glitch saat di perbatasan item.
    const scheduleMoveTo = useCallback(
        (targetIndex: number) => {
            if (dragIndex == null || dragIndex === targetIndex) return;
            if (pendingIndex.current === targetIndex) return;
            clearPendingMove();
            pendingIndex.current = targetIndex;
            moveTimer.current = window.setTimeout(() => {
                moveTimer.current = null;
                pendingIndex.current = null;
                snapshotItemPositions();
                setSelectedHalteIds((prev) => {
                    const next = [...prev];
                    const [moved] = next.splice(dragIndex, 1);
                    next.splice(targetIndex, 0, moved);
                    return next;
                });
                setDragIndex(targetIndex);
                setDragOverIndex(targetIndex);
            }, 140);
        },
        [dragIndex, clearPendingMove, snapshotItemPositions],
    );

    // Auto-scroll saat drag. Berjalan tiap frame selama drag aktif dan memantau
    // posisi kursor lewat listener di document, jadi tetap scroll walau kursor
    // keluar dari box (di atas/bawah) atau diam di tepi. Makin jauh kursor ke
    // luar tepi, makin cepat scroll-nya.
    useEffect(() => {
        if (dragIndex == null) {
            dragPointer.current = null;
            return;
        }

        const EDGE = 56; // px zona pemicu di dalam box
        const MAX_SPEED = 3000; // px/detik, tercapai saat kursor EDGE px di luar box
        let frame = 0;
        let last = performance.now();

        function handleDocumentDragOver(event: DragEvent) {
            event.preventDefault(); // cegah ikon "dilarang" saat kursor di luar box
            dragPointer.current = { x: event.clientX, y: event.clientY };
        }

        function tick(now: number) {
            const dt = Math.min(now - last, 50);
            last = now;
            const list = orderListRef.current;
            const pointer = dragPointer.current;

            if (list && pointer) {
                const rect = list.getBoundingClientRect();
                const y = pointer.y;
                const step = (ratio: number) =>
                    Math.max(1, Math.round((Math.min(ratio, 1) * MAX_SPEED * dt) / 1000));

                if (y < rect.top + EDGE) {
                    list.scrollTop -= step((rect.top + EDGE - y) / (EDGE * 2));
                } else if (y > rect.bottom - EDGE) {
                    list.scrollTop += step((y - (rect.bottom - EDGE)) / (EDGE * 2));
                }

                // Kursor di luar box: tidak ada <li> yang menerima dragover, jadi
                // tentukan item tujuan dari tepi box (atas -> item paling atas yang
                // terlihat, bawah -> item paling bawah yang terlihat).
                if (y < rect.top || y > rect.bottom) {
                    const clampedY = Math.min(Math.max(y, rect.top + 1), rect.bottom - 1);
                    let targetIndex = selectedHalteIds.length - 1;
                    for (let i = 0; i < selectedHalteIds.length; i++) {
                        const itemRect = itemRefs.current.get(selectedHalteIds[i])?.getBoundingClientRect();
                        if (itemRect && itemRect.bottom >= clampedY) {
                            targetIndex = i;
                            break;
                        }
                    }
                    if (targetIndex === dragIndex) clearPendingMove();
                    else scheduleMoveTo(targetIndex);
                }
            }

            frame = requestAnimationFrame(tick);
        }

        document.addEventListener('dragover', handleDocumentDragOver);
        frame = requestAnimationFrame(tick);
        return () => {
            document.removeEventListener('dragover', handleDocumentDragOver);
            cancelAnimationFrame(frame);
        };
    }, [dragIndex, selectedHalteIds, clearPendingMove, scheduleMoveTo]);

    const { shouldRender, overlayClass, dialogClass } = useModalTransition(isOpen);

    if (!shouldRender) return null;

    const inputClass =
        'mt-2 h-10 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-12 sm:px-5 sm:text-base';
    const selectClass = `${inputClass} cursor-pointer appearance-none pr-10 sm:pr-12`;
    const labelClass = 'block text-sm font-bold text-neutral-900 sm:text-base';
    const errorClass = 'mt-1 text-xs text-red-600 sm:text-sm';

    const title = isEdit
        ? 'Edit Data Rute'
        : step === 1
            ? 'Tambah Rute'
            : 'Tambah Data Rute';

    const normalizedQuery = halteQuery.trim().toLowerCase();
    const filteredHaltes = haltes.filter(
        (halte) =>
            halte.namaHalte.toLowerCase().includes(normalizedQuery) ||
            (halte.alamat ?? '').toLowerCase().includes(normalizedQuery),
    );
    const allVisibleSelected =
        filteredHaltes.length > 0 && filteredHaltes.every((halte) => selectedHalteIds.includes(halte.id));

    function toggleHalte(id: number) {
        setErrors((prev) => ({ ...prev, halte: '' }));
        setSelectedHalteIds((prev) =>
            prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
        );
    }

    function toggleAllVisible() {
        setErrors((prev) => ({ ...prev, halte: '' }));
        setSelectedHalteIds((prev) => {
            if (allVisibleSelected) {
                return prev.filter((id) => !filteredHaltes.some((h) => h.id === id));
            }
            const missing = filteredHaltes.filter((h) => !prev.includes(h.id)).map((h) => h.id);
            return [...prev, ...missing];
        });
    }

    function removeSelected(index: number) {
        setErrors((prev) => ({ ...prev, halte: '' }));
        setSelectedHalteIds((prev) => prev.filter((_, i) => i !== index));
    }

    function handleItemDragOver(event: ReactDragEvent<HTMLLIElement>, index: number) {
        event.preventDefault();
        scheduleMoveTo(index);
    }

    function endDrag() {
        clearPendingMove();
        setDragIndex(null);
        setDragOverIndex(null);
    }

    function getSegmentKey(fromId: number, toId: number): string {
        return `${fromId}>${toId}`;
    }

    // Parse input segmen: kosong -> null (otomatis); selain itu harus bulat > 0.
    // Mengembalikan 'invalid' untuk NaN, "abc", "1.5", "0", "-5" agar form
    // menampilkan error Indonesia dan tidak pernah mengirim NaN ke backend.
    function parseSegmentField(raw: string | undefined): number | null | 'invalid' {
        const trimmed = (raw ?? '').trim();
        if (trimmed === '') return null;
        const num = Number(trimmed);
        if (!Number.isInteger(num) || num <= 0) return 'invalid';
        return num;
    }

    function handleSegmentChange(fromId: number, toId: number, field: 'menit' | 'meter', value: string) {
        const key = getSegmentKey(fromId, toId);
        setSegmentValues((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (step === 1) {
            const nextErrors: Record<string, string> = {};
            const trimmedNama = namaRute.trim();
            if (trimmedNama.length < 3) {
                nextErrors.namaRute = 'Nama rute minimal 3 karakter';
            }
            if (modaId === 0) {
                nextErrors.modaId = 'Moda wajib dipilih';
            }
            if (Object.keys(nextErrors).length > 0) {
                setErrors(nextErrors);
                return;
            }
            setErrors({});
            setStep(2);
            return;
        }

        if (selectedHalteIds.length < 2) {
            setErrors({ halte: 'Minimal 2 halte pemberhentian' });
            return;
        }

        const nextErrors: Record<string, string> = {};
        for (let i = 0; i < selectedHalteIds.length - 1; i++) {
            const fromId = selectedHalteIds[i];
            const toId = selectedHalteIds[i + 1];
            const key = getSegmentKey(fromId, toId);
            const segment = segmentValues[key];

            const menit = parseSegmentField(segment?.menit);
            const meter = parseSegmentField(segment?.meter);

            if (menit === 'invalid') {
                nextErrors[`segment_${i}`] = 'Estimasi menit harus bilangan bulat lebih besar dari 0 atau dikosongkan untuk otomatis';
            }
            if (meter === 'invalid') {
                nextErrors[`segment_${i}_meter`] = 'Jarak meter harus bilangan bulat lebih besar dari 0 atau dikosongkan untuk otomatis';
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const stops = selectedHalteIds.map((halteId, index) => {
            if (index === selectedHalteIds.length - 1) {
                return { halteId, estimasiMenit: 0, jarakMeter: 0 };
            }
            const toId = selectedHalteIds[index + 1];
            const key = getSegmentKey(halteId, toId);
            const segment = segmentValues[key];
            const menit = parseSegmentField(segment?.menit);
            const meter = parseSegmentField(segment?.meter);
            return {
                halteId,
                estimasiMenit: menit === 'invalid' ? null : menit,
                jarakMeter: meter === 'invalid' ? null : meter,
            };
        });

        onSubmit({
            namaRute: namaRute.trim(),
            kodeRute: kodeRute.trim() === '' ? undefined : kodeRute.trim(),
            modaId,
            isActive,
            stops,
        });
    }

    const circleClass = (active: boolean) =>
        `flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${active ? 'bg-primary-600 text-white' : 'bg-neutral-400 text-white'}`;

    const activeModas = modas.filter((m) => m.isActive);
    const currentModa = modas.find((m) => m.id === modaId);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-2.5 sm:p-4 ${overlayClass}`}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="rute-form-title"
                className={`my-auto w-full max-w-2xl rounded-xl border border-neutral-300 bg-white px-3.5 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.22)] sm:max-w-4xl sm:rounded-2xl sm:px-10 sm:py-8 ${dialogClass}`}
            >
                <div className="flex items-start justify-between gap-3">
                    <h2
                        id="rute-form-title"
                        className="text-base font-bold text-neutral-900 sm:text-xl"
                    >
                        {title}
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

                <div className="mt-4 flex items-center gap-2 sm:mt-6 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => step === 2 && setStep(1)}
                        disabled={step === 1}
                        aria-label="Langkah 1: Informasi Dasar"
                        className={circleClass(true)}
                    >
                        1
                    </button>
                    <span className="text-xs font-bold text-neutral-900 sm:text-base">
                        Informasi Dasar
                    </span>
                    <span className="h-0.5 w-6 bg-neutral-300 sm:w-10" aria-hidden="true" />
                    <button
                        type="button"
                        disabled
                        aria-label="Langkah 2: Daftar Halte"
                        className={circleClass(step === 2)}
                    >
                        2
                    </button>
                    <span
                        className={`text-xs font-bold sm:text-base ${step === 2 ? 'text-neutral-900' : 'text-neutral-400'}`}
                    >
                        Daftar Halte
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 sm:mt-6">
                    {step === 1 ? (
                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <label htmlFor="rute-nama" className={labelClass}>
                                    Nama Jalur / Koridor
                                </label>
                                <input
                                    id="rute-nama"
                                    type="text"
                                    value={namaRute}
                                    onChange={(event) => setNamaRute(event.target.value)}
                                    placeholder="Contoh: Koridor 3D (BEC - Baleendah)"
                                    className={inputClass}
                                />
                                {errors.namaRute && <p className={errorClass}>{errors.namaRute}</p>}
                            </div>

                            <div>
                                <label htmlFor="rute-kode" className={labelClass}>
                                    Kode Rute (opsional)
                                </label>
                                <input
                                    id="rute-kode"
                                    type="text"
                                    value={kodeRute}
                                    onChange={(event) => setKodeRute(event.target.value)}
                                    placeholder="Contoh: K3D"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label htmlFor="rute-moda" className={labelClass}>
                                    Moda
                                </label>
                                <div className="relative">
                                    <select
                                        id="rute-moda"
                                        value={modaId}
                                        onChange={(event) => setModaId(Number(event.target.value))}
                                        className={`${selectClass} ${modaId ? '' : 'text-neutral-400'}`}
                                    >
                                        <option value={0} disabled hidden>
                                            Pilih moda
                                        </option>
                                        {activeModas.map((moda) => (
                                            <option key={moda.id} value={moda.id}>
                                                {moda.namaModa}
                                            </option>
                                        ))}
                                        {currentModa && !currentModa.isActive && (
                                            <option key={currentModa.id} value={currentModa.id}>
                                                {currentModa.namaModa} (nonaktif)
                                            </option>
                                        )}
                                    </select>
                                    <HiChevronDown
                                        aria-hidden="true"
                                        className="pointer-events-none absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-neutral-500"
                                    />
                                </div>
                                {errors.modaId && <p className={errorClass}>{errors.modaId}</p>}
                            </div>

                            <div>
                                <label htmlFor="rute-status" className={labelClass}>
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        id="rute-status"
                                        value={isActive ? 'true' : 'false'}
                                        onChange={(event) => setIsActive(event.target.value === 'true')}
                                        className={selectClass}
                                    >
                                        <option value="true">Aktif</option>
                                        <option value="false">Tidak Aktif</option>
                                    </select>
                                    <HiChevronDown
                                        aria-hidden="true"
                                        className="pointer-events-none absolute top-1/2 right-5 h-5 w-5 -translate-y-1/2 text-neutral-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-sm font-bold text-neutral-900 sm:text-base">
                                Pilih Halte dan Atur Urutan
                            </h3>

                            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 sm:mt-4 sm:gap-4">
                                <div className="rounded-xl bg-primary-50 p-3 sm:rounded-2xl sm:p-4">
                                    <h4 className="text-xs font-bold text-neutral-900 sm:text-sm">
                                        Daftar Halte Tersedia
                                    </h4>

                                    <div className="relative mt-2 sm:mt-3">
                                        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 sm:left-4">
                                            <SearchIcon />
                                        </span>
                                        <input
                                            type="search"
                                            value={halteQuery}
                                            onChange={(event) => setHalteQuery(event.target.value)}
                                            placeholder="Cari halte ..."
                                            aria-label="Cari halte"
                                            className="h-10 w-full rounded-xl border border-neutral-300 bg-white pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-12 sm:rounded-2xl sm:pr-5 sm:pl-12 sm:text-base"
                                        />
                                    </div>

                                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-white p-2 sm:mt-3 sm:max-h-65 sm:rounded-2xl sm:p-3">
                                        <label className="flex cursor-pointer items-center gap-2 px-2 py-2 text-xs text-neutral-900 sm:gap-3 sm:py-2.5 sm:text-sm">
                                            <input
                                                type="checkbox"
                                                checked={allVisibleSelected}
                                                onChange={toggleAllVisible}
                                                className="h-4 w-4 shrink-0 cursor-pointer accent-primary-600 sm:h-5 sm:w-5"
                                            />
                                            Pilih semua
                                        </label>

                                        {filteredHaltes.map((halte) => (
                                            <label
                                                key={halte.id}
                                                className="flex cursor-pointer items-center gap-2 px-2 py-2 text-xs text-neutral-900 sm:gap-3 sm:py-2.5 sm:text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedHalteIds.includes(halte.id)}
                                                    onChange={() => toggleHalte(halte.id)}
                                                    className="h-4 w-4 shrink-0 cursor-pointer accent-primary-600 sm:h-5 sm:w-5"
                                                />
                                                {halte.namaHalte}
                                                {!halte.isActive && (
                                                    <span className="text-neutral-400"> (nonaktif)</span>
                                                )}
                                            </label>
                                        ))}

                                        {filteredHaltes.length === 0 && (
                                            <p className="px-2 py-3 text-center text-xs text-neutral-500 sm:py-4 sm:text-sm">
                                                Halte tidak ditemukan.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-primary-50 p-3 sm:rounded-2xl sm:p-4">
                                    <h4 className="text-xs font-bold text-neutral-900 sm:text-sm">
                                        Urutan Halte dalam Jalur
                                    </h4>

                                    <div ref={orderListRef} className="mt-2 h-45 overflow-y-auto rounded-xl bg-white p-2 sm:mt-3 sm:h-80 sm:rounded-2xl sm:p-3">
                                        {selectedHalteIds.length === 0 ? (
                                            <p className="flex h-full items-center justify-center text-center text-xs text-neutral-400 sm:text-sm">
                                                Belum ada halte yang dipilih
                                            </p>
                                        ) : (
                                            <ul>
                                                {selectedHalteIds.map((halteId, index) => {
                                                    const halte = haltes.find((h) => h.id === halteId);
                                                    if (!halte) return null;
                                                    const isLast = index === selectedHalteIds.length - 1;
                                                    const nextHalteId = isLast ? null : selectedHalteIds[index + 1];
                                                    const key = nextHalteId ? getSegmentKey(halteId, nextHalteId) : null;
                                                    const segment = key ? segmentValues[key] : null;

                                                    return (
                                                        <li
                                                            key={halteId}
                                                            ref={(el) => {
                                                                if (el) itemRefs.current.set(halteId, el);
                                                                else itemRefs.current.delete(halteId);
                                                            }}
                                                            onDragOver={(event) => handleItemDragOver(event, index)}
                                                            onDrop={() => endDrag()}
                                                            className={`mb-2 rounded-xl border bg-white px-3 py-2 last:mb-0 sm:mb-3 sm:rounded-2xl sm:px-4 sm:py-3 ${dragIndex === index ? 'border-primary-400 opacity-50' : 'border-neutral-200'} ${dragOverIndex === index && dragIndex !== null && dragIndex !== index ? 'ring-2 ring-primary-400' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    draggable
                                                                    onDragStart={() => {
                                                                        snapshotItemPositions();
                                                                        setDragIndex(index);
                                                                        setDragOverIndex(index);
                                                                    }}
                                                                    onDragEnd={() => endDrag()}
                                                                    className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white touch-none active:cursor-grabbing sm:h-8 sm:w-8 sm:text-xs"
                                                                >
                                                                    {index + 1}
                                                                </span>
                                                                <span className="flex-1 text-xs font-medium text-neutral-900 sm:text-sm">
                                                                    {halte.namaHalte}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSelected(index)}
                                                                    aria-label={`Hapus halte ${halte.namaHalte}`}
                                                                    className="shrink-0 cursor-pointer text-neutral-400 transition hover:text-neutral-600"
                                                                >
                                                                    <HiXMark className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                </button>
                                                            </div>

                                                            {!isLast && (
                                                                <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
                                                                    <div>
                                                                        <label className="block text-xs text-neutral-600 sm:text-sm">
                                                                            Menit
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={segment?.menit || ''}
                                                                            onChange={(e) =>
                                                                                handleSegmentChange(
                                                                                    halteId,
                                                                                    nextHalteId!,
                                                                                    'menit',
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                            className="mt-1 h-8 w-full rounded-lg border border-neutral-300 px-2 text-xs focus:border-primary-600 focus:outline-none sm:h-9 sm:px-3 sm:text-sm"
                                                                        />
                                                                        {errors[`segment_${index}`] && (
                                                                            <p className="mt-1 text-xs text-red-600">
                                                                                {errors[`segment_${index}`]}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-neutral-600 sm:text-sm">
                                                                            Meter
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={segment?.meter || ''}
                                                                            onChange={(e) =>
                                                                                handleSegmentChange(
                                                                                    halteId,
                                                                                    nextHalteId!,
                                                                                    'meter',
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                            className="mt-1 h-8 w-full rounded-lg border border-neutral-300 px-2 text-xs focus:border-primary-600 focus:outline-none sm:h-9 sm:px-3 sm:text-sm"
                                                                        />
                                                                        {errors[`segment_${index}_meter`] && (
                                                                            <p className="mt-1 text-xs text-red-600">
                                                                                {errors[`segment_${index}_meter`]}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {isLast && (
                                                                <p className="mt-2 text-xs text-neutral-400 sm:mt-3 sm:text-sm">
                                                                    Halte akhir
                                                                </p>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>

                                    {errors.halte && <p className={errorClass}>{errors.halte}</p>}
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-neutral-500 sm:mt-4 sm:text-sm">
                                Kosongkan untuk dihitung otomatis dari jarak garis lurus antar halte dan kecepatan rata-rata moda.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-end sm:gap-4">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={submitting}
                                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-neutral-300 px-7 text-base font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                            >
                                Kembali
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={submitting || (step === 1 && detailLoading)}
                            className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-primary-600 px-7 text-base font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                        >
                            {submitting ? 'Menyimpan...' : step === 1 ? (detailLoading ? 'Memuat...' : 'Lanjut') : 'Simpan'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}