import { HiArrowsUpDown } from "react-icons/hi2";

export function SwapLocationsButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label="Tukar lokasi awal dan tujuan" className="absolute -right-11 top-14 grid h-10 w-10 cursor-pointer place-items-center rounded-full text-neutral-900 transition hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-600"><HiArrowsUpDown className="h-7 w-7" /></button>;
}
