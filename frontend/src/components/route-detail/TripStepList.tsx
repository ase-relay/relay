'use client';

import { useState } from 'react';
import { VehicleIcon, type VehicleType } from '@/components/icons/vehicle/VehicleIcon';
import WalkingGlyphIcon from '@/components/icons/cari-rute/WalkingIcon';
import { getRouteBadgeColor } from '@/lib/routeBadgeColor';

export interface JourneyStop { time: string; stopName: string; lat?: number; lng?: number; }
/** Halte yang dipilih user dari daftar perhentian (untuk zoom peta). */
export interface JourneyStopTarget { name: string; lat: number; lng: number; }
interface BaseSegment { id: string; startTime: string; endTime: string; }
export interface WalkSegment extends BaseSegment { type: 'WALK'; distance: number; duration: number; steps?: string[]; }
export interface TransitSegment extends BaseSegment {
  type: 'TRANSIT';
  operator: string;
  routeCode: string;
  /** Tipe moda leg ini (dari `moda.nama` BE) — menentukan label halte/stasiun & ikon. */
  vehicleType: VehicleType;
  cost: number;
  duration: number;
  stopCount: number;
  stops: JourneyStop[];
}
export type JourneySegment = WalkSegment | TransitSegment;
export interface JourneyPoint { time: string; name: string; address: string; }

interface TripStepListProps {
  origin: JourneyPoint;
  destination: JourneyPoint;
  segments: JourneySegment[];
  /** Dipanggil saat nama halte di daftar perhentian diklik. Tanpa prop ini nama halte tetap teks biasa. */
  onStopSelect?: (stop: JourneyStopTarget) => void;
}
interface TimelineSegmentProps { item: JourneySegment; onStopSelect?: (stop: JourneyStopTarget) => void; }

/** Chevron collapsible — biru mengikuti design; berputar 180° saat terbuka. */
function Chevron({ isOpen }: { isOpen: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
}

function formatCurrency(cost: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cost);
}

/** Label titik naik sesuai moda: kereta → "Stasiun Kereta", bus → "Halte Bus", dst. */
function boardingLabel(vehicleType: VehicleType): string {
  switch (vehicleType) {
    case 'train': return 'Stasiun Kereta';
    case 'angkot': return 'Halte Angkot';
    case 'motorcycle':
    case 'walking': return 'Titik Jemput';
    default: return 'Halte Bus';
  }
}

export function TimelineSegment({ item, onStopSelect }: TimelineSegmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const summary = item.type === 'WALK' ? `${item.duration} menit, ${item.distance} m` : `${item.duration} menit (${item.stopCount} perhentian)`;

  if (item.type === 'WALK') {
    return (
      <div className="py-1 pl-11 sm:pl-12">
        <div className="flex items-center gap-2 font-medium text-neutral-900">
          <WalkingGlyphIcon className="h-5 w-auto" /> Jalan Kaki
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <span className="text-primary-600"><Chevron isOpen={isOpen} /></span>
          {summary}
        </button>
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <ol className="overflow-hidden space-y-3 text-sm leading-relaxed text-neutral-500">
            {item.steps?.map((step, index, steps) => (
              <li key={`${item.id}-${index}`} className={index === steps.length - 1 ? 'font-medium text-primary-600' : ''}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-1 pl-11 pt-3 sm:pl-12">
      <div className="flex flex-wrap items-center gap-2.5">
        <VehicleIcon type={item.vehicleType} className="h-8 w-8 shrink-0" />
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${getRouteBadgeColor(item.routeCode)}`}>{item.routeCode}</span>
        <p className="font-semibold text-neutral-900">{item.operator}</p>
      </div>
      <p className="mt-2 text-sm text-neutral-500">Biaya: {formatCurrency(item.cost)}</p>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <span className="text-primary-600"><Chevron isOpen={isOpen} /></span>
        {summary}
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <ol className="overflow-hidden space-y-3 text-sm">
          {item.stops.map((stop) => {
            const { lat, lng } = stop;
            const canFocus = !!onStopSelect && typeof lat === 'number' && typeof lng === 'number';
            return (
              <li key={`${item.id}-${stop.time}-${stop.stopName}`} className="flex gap-3">
                <time className="w-11 shrink-0 text-neutral-500">{stop.time}</time>
                {canFocus ? (
                  <button
                    type="button"
                    onClick={() => onStopSelect({ name: stop.stopName, lat, lng })}
                    title="Lihat di peta"
                    aria-label={`Lihat ${stop.stopName} di peta`}
                    className="cursor-pointer text-left font-medium text-neutral-700 transition-colors hover:text-primary-600 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    {stop.stopName}
                  </button>
                ) : (
                  <span className="font-medium text-neutral-700">{stop.stopName}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Titik timeline (36px) mengikuti design: ring biru (awal), ring hijau (transit), pin oranye (tiba). */
function TimelineNode({ type }: { type: 'start' | 'transit' | 'end' }) {
  if (type === 'end') {
    return (
      <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-50 text-orange-500">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg>
      </span>
    );
  }
  const isStart = type === 'start';
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-full ${isStart ? 'bg-primary-50' : 'bg-emerald-50'}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full border-2 bg-white ${isStart ? 'border-primary-600' : 'border-emerald-500'}`}>
        <span className={`h-2 w-2 rounded-full ${isStart ? 'bg-primary-600' : 'bg-emerald-500'}`} />
      </span>
    </span>
  );
}

/**
 * Potongan garis putus-putus per baris (space-y-4 → jeda 16px): baris pertama mulai
 * dari pusat node awal, baris terakhir berhenti tepat di pusat pin destinasi (tidak
 * melewatinya), baris tengah membentang penuh menutupi jeda antar baris.
 */
function TimelineLine({ position }: { position: 'start' | 'middle' | 'end' }) {
  const vertical =
    position === 'start' ? 'top-1/2 -bottom-4'
    : position === 'end' ? '-top-4 bottom-1/2'
    : '-top-4 -bottom-4';
  return (
    <div
      aria-hidden="true"
      className={`absolute left-[17px] w-0 border-l-2 border-dashed border-neutral-300 ${vertical}`}
    />
  );
}

function PointCard({ point, type }: { point: JourneyPoint; type: 'start' | 'end' }) {
  const label = type === 'start' ? 'Berangkat dari' : 'Tiba di';
  return (
    <div className={`rounded-xl p-4 sm:p-5 ${type === 'start' ? 'bg-slate-50' : 'bg-orange-50/70'}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <time className="font-bold text-neutral-900">{point.time}</time>
      </div>
      <p className="mt-2 text-base font-bold text-neutral-900 sm:text-lg">{point.name}</p>
      {point.address && <p className="mt-2 text-xs leading-relaxed text-neutral-500 sm:text-sm">{point.address}</p>}
    </div>
  );
}

export function TripStepList({ origin, destination, segments, onStopSelect }: TripStepListProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="journey-detail-title">
      <h2 id="journey-detail-title" className="text-lg font-bold text-neutral-900">Detail Perjalanan</h2>
      <div className="relative mt-6 space-y-4">
        <div className="relative flex items-center gap-4 sm:gap-5">
          <TimelineLine position="start" />
          <div className="z-10 shrink-0"><TimelineNode type="start" /></div>
          <div className="min-w-0 flex-1"><PointCard point={origin} type="start" /></div>
        </div>

        {segments.map((segment) => segment.type === 'TRANSIT' ? (
          <div key={segment.id} className="relative">
            <TimelineLine position="middle" />
            {/* Baris kartu hijau: node di-tengah-vertical terhadap kartu di sebelahnya */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="z-10 shrink-0"><TimelineNode type="transit" /></div>
              <div className="min-w-0 flex-1">
                <div className="rounded-xl bg-emerald-50 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-neutral-500">{boardingLabel(segment.vehicleType)}</p>
                    <time className="font-bold text-neutral-900">{segment.startTime}</time>
                  </div>
                  <p className="mt-2 text-base font-bold text-neutral-900 sm:text-lg">{segment.stops[0]?.stopName ?? 'Halte keberangkatan'}</p>
                </div>
              </div>
            </div>
            <div className="pl-13 sm:pl-14"><TimelineSegment item={segment} onStopSelect={onStopSelect} /></div>
          </div>
        ) : (
          <div key={segment.id} className="relative">
            <TimelineLine position="middle" />
            <div className="pl-13 sm:pl-14"><TimelineSegment item={segment} onStopSelect={onStopSelect} /></div>
          </div>
        ))}

        <div className="relative flex items-center gap-4 sm:gap-5">
          <TimelineLine position="end" />
          <div className="z-10 shrink-0"><TimelineNode type="end" /></div>
          <div className="min-w-0 flex-1"><PointCard point={destination} type="end" /></div>
        </div>
      </div>
    </section>
  );
}