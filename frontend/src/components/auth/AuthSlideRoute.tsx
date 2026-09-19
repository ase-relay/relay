import Image from "next/image";
import BusIcon from "@/components/icons/vehicle/BusIcon";
import TrainIcon from "@/components/icons/vehicle/TrainIcon";
import MotorcycleIcon from "@/components/icons/vehicle/MotorcycleIcon";

const options = [
  { icon: <BusIcon />, price: "Rp4.900", time: "60 menit", transit: "1x transit" },
  { icon: <TrainIcon />, price: "Rp7.000", time: "40 menit", transit: "2x transit" },
  { icon: <MotorcycleIcon />, price: "Rp16.900", time: "20 menit", transit: "Tanpa Transit" },
];

export function AuthSlideRoute() {
  return (
    <div className="grid h-full items-center gap-4 px-10 py-7 md:grid-cols-[1fr_1.25fr]">
      <div>
        <h3 className="text-xl leading-tight font-bold text-black">
          Kejar Waktu, <br />Nggak Perlu Bingung
        </h3>
        <p className="mt-3 max-w-xs text-base leading-relaxed text-neutral-800">
          Temukan rute yang sesuai dengan waktu perjalananmu.
        </p>
      </div>
      <div className="grid grid-cols-[1fr_0.72fr] items-center gap-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-neutral-800">Telkom University <span className="text-neutral-400">→</span> BEC</p>
          <div className="space-y-2">
            {options.map((option) => <div key={option.price} className="flex items-center gap-2 rounded-xl bg-white p-2 text-[9px] font-semibold shadow-[0_2px_8px_rgba(15,23,42,0.12)]"><span className="h-7 w-7 [&>svg]:h-full [&>svg]:w-full">{option.icon}</span><span>{option.price}</span><span>{option.time}</span><span>{option.transit}</span></div>)}
          </div>
        </div>
        <div className="relative h-32 overflow-hidden rounded-lg"><Image src="/images/MapIllustration.png" alt="Peta rute" fill className="object-cover" sizes="20vw" /></div>
      </div>
    </div>
  );
}
