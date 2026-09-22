import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import OriginIcon from "@/components/icons/cara-kerja/OriginIcon";
import DestinationPinIcon from "@/components/icons/cara-kerja/DestinationPinIcon";
import RouteConnectorIcon from "@/components/icons/cara-kerja/RouteConnectorIcon";

export function RouteInputIllustration() {
  return (
    <div className="mx-auto w-full max-w-100 rounded-[20px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.10)] sm:p-8">
      <div className="flex gap-5">
        <div className="flex flex-col items-center pt-4 pb-2 mt-1 gap-1">
          <OriginIcon />
          <RouteConnectorIcon />
          <DestinationPinIcon />
        </div>
        <div className="flex-1 space-y-5">
          <div className="h-16 rounded-[20px] border border-neutral-300" />
          <div className="h-16 rounded-[20px] border border-neutral-300" />
        </div>
      </div>
      <button
        type="button"
        className="mt-7 flex h-16 w-full cursor-pointer items-center justify-center gap-3 rounded-[20px] bg-primary-600 text-xl font-semibold text-white transition hover:bg-primary-700"
      >
        <HiOutlineMagnifyingGlass className="h-6 w-6" />
        Cari Rute
      </button>
    </div>
  );
}
