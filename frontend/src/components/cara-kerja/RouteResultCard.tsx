import { HiOutlineChevronRight } from "react-icons/hi2";
import { VehicleIcon, type VehicleType } from "@/components/icons/vehicle/VehicleIcon";

interface RouteResultCardProps {
  vehicle: VehicleType;
  price: string;
  duration: string;
  transit: string;
}

const chevronColor: Record<VehicleType, string> = {
  walking: "#64748B",
  angkot: "#F59E0B",
  bus: "#004BDC",
  train: "#00B14F",
  motorcycle: "#F58220",
};

export function RouteResultCard({ vehicle, price, duration, transit }: RouteResultCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] bg-white py-4 pr-6 pl-4 shadow-[0_8px_24px_rgba(15,23,42,0.10)] sm:gap-6 sm:pl-5">
      <div className="shrink-0">
        <VehicleIcon type={vehicle} />
      </div>
      <div className="grid flex-1 grid-cols-3 items-center text-center sm:justify-items-start sm:text-left">
        <p className="text-[15px] font-semibold text-black sm:pl-4 sm:text-lg">{price}</p>
        <p className="text-[15px] font-semibold text-black sm:text-lg">{duration}</p>
        <p className="text-[15px] font-semibold text-black sm:text-lg">{transit}</p>
      </div>
      <HiOutlineChevronRight className="h-6 w-6 shrink-0" style={{ color: chevronColor[vehicle] }} />
    </div>
  );
}
