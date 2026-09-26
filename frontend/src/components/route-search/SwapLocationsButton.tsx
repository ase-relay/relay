import { HiArrowsUpDown } from "react-icons/hi2";

export function SwapLocationsButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label="Tukar lokasi awal dan tujuan" className="absolute -right-8 top-12 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-neutral-900 transition hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-600 sm:-right-11 sm:top-14 sm:h-10 sm:w-10"><HiArrowsUpDown className="h-6 w-6 sm:h-7 sm:w-7" /></button>;
}
