'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { HiXMark } from 'react-icons/hi2';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import SearchIcon from '@/components/icons/common/SearchIcon';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, OSM_ATTRIBUTION, OSM_TILE_URL } from '@/constants/mapConfig';
import 'leaflet/dist/leaflet.css';

export interface PickedLocation {
    lat: number;
    lng: number;
    address: string;
}

export type LocationPickerModalProps = {
    isOpen: boolean;
    initial?: { lat: number; lng: number } | null;
    onCancel: () => void;
    onPick: (location: PickedLocation) => void;
};

interface NominatimSearchItem {
    lat: string;
    lon: string;
    display_name: string;
}

interface NominatimReverseItem {
    display_name?: string;
}

function formatCoord(value: number): string {
    return String(Math.round(value * 10000000) / 10000000);
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(event) {
            onSelect(event.latlng.lat, event.latlng.lng);
        },
    });
    return null;
}

function FlyToHandler({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo(target, 16, { duration: 0.8 });
        }
    }, [map, target]);
    return null;
}

export function LocationPickerModal({ isOpen, initial = null, onCancel, onPick }: LocationPickerModalProps) {
    const initialLat = initial?.lat;
    const initialLng = initial?.lng;
    const validInitial = useMemo(() => {
        if (initialLat == null || initialLng == null) return null;
        if (!Number.isFinite(initialLat) || !Number.isFinite(initialLng)) return null;
        return { lat: initialLat, lng: initialLng };
    }, [initialLat, initialLng]);
    const [center] = useState<[number, number]>(
        validInitial ? [validInitial.lat, validInitial.lng] : MAP_DEFAULT_CENTER,
    );
    const [picked, setPicked] = useState<PickedLocation | null>(null);
    const [addressLoading, setAddressLoading] = useState(() => validInitial != null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NominatimSearchItem[]>([]);
    const [searching, setSearching] = useState(false);
    const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
    const [notice, setNotice] = useState('');
    const reverseSeq = useRef(0);

    const pinIcon = useMemo(
        () =>
            L.divIcon({
                className: 'location-picker-pin',
                html: `<svg width="30" height="42" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.925 0 1 4.925 1 11c0 8.25 11 23 11 23s11-14.75 11-23C23 4.925 18.075 0 12 0z" fill="#EA4335"/><circle cx="12" cy="11" r="4.2" fill="#FFFFFF"/></svg>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42],
            }),
        [],
    );

    useEffect(() => {
        if (!validInitial) return;
        const seq = ++reverseSeq.current;
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${validInitial.lat}&lon=${validInitial.lng}&zoom=18&addressdetails=0`,
        )
            .then((res) => res.json() as Promise<NominatimReverseItem>)
            .then((data) => {
                if (reverseSeq.current !== seq) return;
                setPicked({ lat: validInitial.lat, lng: validInitial.lng, address: data.display_name ?? '' });
            })
            .catch(() => {
                if (reverseSeq.current !== seq) return;
                setPicked({ lat: validInitial.lat, lng: validInitial.lng, address: '' });
            })
            .finally(() => {
                if (reverseSeq.current === seq) setAddressLoading(false);
            });
    }, [isOpen, validInitial]);

    function handleQueryChange(value: string) {
        setQuery(value);
        if (value.trim().length < 3) {
            setResults([]);
            setSearching(false);
            setNotice('');
        } else {
            setSearching(true);
        }
    }

    useEffect(() => {
        const keyword = query.trim();
        if (keyword.length < 3) return;
        const timer = window.setTimeout(() => {
            const params = new URLSearchParams({
                format: 'jsonv2',
                q: keyword,
                countrycodes: 'id',
                limit: '5',
                addressdetails: '0',
            });
            fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
                .then((res) => res.json() as Promise<NominatimSearchItem[]>)
                .then((data) => {
                    setResults(Array.isArray(data) ? data : []);
                    setNotice('');
                })
                .catch(() => {
                    setResults([]);
                    setNotice('Pencarian gagal. Periksa koneksi lalu coba lagi.');
                })
                .finally(() => setSearching(false));
        }, 700);
        return () => window.clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    function reverseGeocode(lat: number, lng: number) {
        const seq = ++reverseSeq.current;
        setAddressLoading(true);
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=0`,
        )
            .then((res) => res.json() as Promise<NominatimReverseItem>)
            .then((data) => {
                if (reverseSeq.current !== seq) return;
                setPicked((prev) =>
                    prev && prev.lat === lat && prev.lng === lng
                        ? { lat, lng, address: data.display_name ?? '' }
                        : prev,
                );
            })
            .catch(() => {
                if (reverseSeq.current !== seq) return;
                setPicked((prev) =>
                    prev && prev.lat === lat && prev.lng === lng ? { lat, lng, address: '' } : prev,
                );
            })
            .finally(() => {
                if (reverseSeq.current === seq) setAddressLoading(false);
            });
    }

    function selectPoint(lat: number, lng: number, address = '') {
        setPicked({ lat, lng, address });
        setResults([]);
        if (address === '') {
            reverseGeocode(lat, lng);
        }
    }

    function chooseSearchResult(item: NominatimSearchItem) {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        setFlyTo([lat, lng]);
        selectPoint(lat, lng, item.display_name);
    }

    function handleUseLocation() {
        if (!picked) return;
        onPick({
            lat: picked.lat,
            lng: picked.lng,
            address: picked.address.trim() !== '' ? picked.address : `${formatCoord(picked.lat)}, ${formatCoord(picked.lng)}`,
        });
    }

    return (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/45 p-2.5 sm:p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="location-picker-title"
                className="my-auto w-full max-w-2xl rounded-xl bg-white px-3.5 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.28)] sm:max-w-3xl sm:rounded-2xl sm:px-5 sm:py-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <h2 id="location-picker-title" className="text-base font-bold text-neutral-900 sm:text-lg">
                        Pilih Lokasi di Peta
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
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
                        value={query}
                        onChange={(event) => handleQueryChange(event.target.value)}
                        placeholder="Cari lokasi, alamat, atau nama tempat ..."
                        aria-label="Cari lokasi, alamat, atau nama tempat"
                        className="h-10 w-full rounded-xl border border-neutral-300 bg-white pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none sm:h-12 sm:rounded-2xl sm:pr-5 sm:pl-12 sm:text-base"
                    />
                    {(searching || results.length > 0 || notice !== '') && (
                        <div className="absolute top-full right-0 left-0 z-1200 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
                            {searching && <p className="px-4 py-2.5 text-xs text-neutral-500 sm:text-sm">Mencari ...</p>}
                            {!searching &&
                                results.map((item, index) => (
                                    <button
                                        key={`${item.lat},${item.lon},${index}`}
                                        type="button"
                                        onClick={() => chooseSearchResult(item)}
                                        className="block w-full cursor-pointer px-4 py-2.5 text-left text-xs text-neutral-900 transition hover:bg-neutral-100 sm:text-sm"
                                    >
                                        {item.display_name}
                                    </button>
                                ))}
                            {!searching && results.length === 0 && (
                                <p className="px-4 py-2.5 text-xs text-neutral-500 sm:text-sm">
                                    {notice !== '' ? notice : 'Lokasi tidak ditemukan.'}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5 sm:mt-4 sm:gap-4">
                    <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-neutral-100 lg:col-span-3 sm:rounded-2xl">
                        <MapContainer
                            center={center}
                            zoom={validInitial ? 16 : MAP_DEFAULT_ZOOM}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <ZoomControl position="bottomright" />
                            <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
                            <MapClickHandler onSelect={(lat, lng) => selectPoint(lat, lng)} />
                            <FlyToHandler target={flyTo} />
                            {picked && (
                                <Marker
                                    position={[picked.lat, picked.lng]}
                                    icon={pinIcon}
                                    draggable
                                    eventHandlers={{
                                        dragend: (event) => {
                                            const marker = event.target as L.Marker;
                                            const pos = marker.getLatLng();
                                            selectPoint(pos.lat, pos.lng);
                                        },
                                    }}
                                />
                            )}
                        </MapContainer>
                        {!picked && (
                            <p className="pointer-events-none absolute top-2 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[11px] text-neutral-600 shadow sm:text-xs">
                                Klik di mana saja pada peta untuk memilih lokasi
                            </p>
                        )}
                    </div>

                    <div className="rounded-xl bg-primary-50 p-3 lg:col-span-2 sm:rounded-2xl sm:p-4">
                        <h3 className="text-xs font-bold text-neutral-900 sm:text-sm">Detail Lokasi</h3>
                        <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
                            <div>
                                <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">Alamat</p>
                                <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                    {addressLoading ? 'Memuat alamat ...' : (picked?.address.trim() !== '' ? picked?.address : '-')}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">Latitude</p>
                                <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                    {picked ? formatCoord(picked.lat) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-neutral-400 sm:text-xs">Longitude</p>
                                <p className="mt-0.5 text-xs text-neutral-900 sm:mt-1 sm:text-sm">
                                    {picked ? formatCoord(picked.lng) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 sm:mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cursor-pointer rounded-full bg-neutral-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500 sm:px-6 sm:py-2.5 sm:text-base"
                    >
                        Kembali
                    </button>
                    <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={!picked}
                        className="cursor-pointer rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-base"
                    >
                        Gunakan Lokasi
                    </button>
                </div>
            </section>
        </div>
    );
}

export default LocationPickerModal;
