'use client';

import { useState } from 'react';
import { VehicleIcon } from '@/components/icons/vehicle/VehicleIcon';

export interface JourneyStop { time: string; stopName: string; }
interface BaseSegment { id: string; startTime: string; endTime: string; }
export interface WalkSegment extends BaseSegment { type: 'WALK'; distance: number; duration: number; steps?: string[]; }
export interface TransitSegment extends BaseSegment { type: 'TRANSIT'; operator: string; routeCode: string; cost: number; duration: number; stopCount: number; stops: JourneyStop[]; }
export type JourneySegment = WalkSegment | TransitSegment;
export interface JourneyPoint { time: string; name: string; address: string; }

interface TripStepListProps { origin: JourneyPoint; destination: JourneyPoint; segments: JourneySegment[]; }
interface TimelineSegmentProps { item: JourneySegment; }

function Chevron({ isOpen }: { isOpen: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
}

function WalkingIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="1.5" /><path d="m10 21 1-6-3-2 2-4 2 2 3-1M14 12l2 3 3 1" /></svg>;
}

function formatCurrency(cost: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cost);
}

export function TimelineSegment({ item }: TimelineSegmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const summary = item.type === 'WALK' ? `${item.duration} menit, ${item.distance} m` : `${item.duration} menit (${item.stopCount} perhentian)`;

  if (item.type === 'WALK') {
    return <div className="py-6 pl-6"><div className="flex items-center gap-2 font-medium text-neutral-900"><WalkingIcon /> Jalan Kaki</div><button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"><Chevron isOpen={isOpen} /> {summary}</button><div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><ol className="overflow-hidden space-y-3 border-l border-neutral-200 pl-4 text-sm leading-relaxed text-neutral-600">{item.steps?.map((step, index) => <li key={`${item.id}-${index}`}>{step}</li>)}</ol></div></div>;
  }

  return <div className="pb-7 pl-6"><div className="flex flex-wrap items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden"><span className="scale-[0.52]"><VehicleIcon type="bus" /></span></span><span className="rounded-full bg-purple-700 px-2.5 py-1 text-xs font-semibold text-white">{item.routeCode}</span><p className="font-semibold text-neutral-900">{item.operator}</p></div><p className="mt-2 text-sm text-neutral-500">Biaya: {formatCurrency(item.cost)}</p><button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900"><Chevron isOpen={isOpen} /> {summary}</button><div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><ol className="overflow-hidden space-y-3 border-l border-neutral-200 pl-4 text-sm">{item.stops.map((stop) => <li key={`${item.id}-${stop.time}-${stop.stopName}`} className="flex gap-3"><time className="w-11 shrink-0 text-neutral-500">{stop.time}</time><span className="font-medium text-neutral-700">{stop.stopName}</span></li>)}</ol></div></div>;
}

function TimelineNode({ type }: { type: 'start' | 'transit' | 'end' }) {
  if (type === 'end') return <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-50 text-orange-500"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg></span>;
  const color = type === 'start' ? 'border-primary-600' : 'border-emerald-500';
  const dot = type === 'start' ? 'bg-primary-600' : 'bg-emerald-500';
  const background = type === 'start' ? 'bg-primary-50' : 'bg-emerald-50';
  return <span className={`grid h-11 w-11 place-items-center rounded-full ${background}`}><span className={`grid h-5 w-5 place-items-center rounded-full border-[3px] bg-white ${color}`}><span className={`h-2 w-2 rounded-full ${dot}`} /></span></span>;
}

function PointCard({ point, type }: { point: JourneyPoint; type: 'start' | 'end' }) {
  const label = type === 'start' ? 'Berangkat dari' : 'Tiba di';
  return <div className={`rounded-xl p-5 ${type === 'start' ? 'bg-slate-50' : 'bg-orange-50/70'}`}><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-neutral-500">{label}</p><time className="font-bold text-neutral-900">{point.time}</time></div><p className="mt-3 text-lg font-bold text-neutral-900">{point.name}</p><p className="mt-2 text-xs leading-relaxed text-neutral-500 sm:text-sm">{point.address}</p></div>;
}

export function TripStepList({ origin, destination, segments }: TripStepListProps) {
  return <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="journey-detail-title"><h2 id="journey-detail-title" className="text-lg font-bold text-neutral-900">Detail Perjalanan</h2><div className="relative mt-6"><div aria-hidden="true" className="absolute bottom-[22px] left-[21px] top-[22px] border-l-2 border-dashed border-neutral-300" /><div className="relative"><div className="relative flex gap-5"><div className="z-10 shrink-0"><TimelineNode type="start" /></div><div className="min-w-0 flex-1"><PointCard point={origin} type="start" /></div></div>{segments.map((segment) => segment.type === 'TRANSIT' ? <div key={segment.id} className="relative flex gap-5"><div className="z-10 shrink-0 pt-1"><TimelineNode type="transit" /></div><div className="min-w-0 flex-1"><div className="rounded-xl bg-emerald-50 p-5"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-neutral-500">Halte Bus</p><time className="font-bold text-neutral-900">{segment.startTime}</time></div><p className="mt-3 text-lg font-bold text-neutral-900">{segment.stops[0]?.stopName ?? 'Halte keberangkatan'}</p></div><TimelineSegment item={segment} /></div></div> : <div key={segment.id} className="relative pl-16"><TimelineSegment item={segment} /></div>)}<div className="relative flex gap-5"><div className="z-10 shrink-0"><TimelineNode type="end" /></div><div className="min-w-0 flex-1"><PointCard point={destination} type="end" /></div></div></div></div></section>;
}
