import Image from "next/image";
import BusIcon from "@/components/icons/vehicle/BusIcon";
import TrainIcon from "@/components/icons/vehicle/TrainIcon";
import MotorcycleIcon from "@/components/icons/vehicle/MotorcycleIcon";
import { AuthSlideText } from "@/components/auth/AuthSlideText";

const options = [
    { icon: <BusIcon />, price: "Rp4.900", time: "60 menit", transit: "1x transit", chevron: "text-[#004bdc]" },
    { icon: <TrainIcon />, price: "Rp7.000", time: "40 menit", transit: "2x transit", chevron: "text-[#00b14f]" },
    { icon: <MotorcycleIcon />, price: "Rp16.900", time: "20 menit", transit: "Tanpa Transit", chevron: "text-[#f58322]" },
];

// Semua teks di dalam baris memakai kolom dengan posisi tetap sesuai desain.
const cellClass = "absolute top-1/2 -translate-y-1/2 text-[6px] leading-none font-semibold whitespace-nowrap text-black";

export function AuthSlideRoute() {
    return (
        <div className="relative h-full w-full">
            <AuthSlideText
                title={<>Kejar Waktu, <br />Nggak Perlu Bingung</>}
                description="Temukan rute yang sesuai dengan waktu perjalananmu."
            />

            <p className="absolute top-[67.5px] left-[385px] text-[9px] leading-[12px] font-semibold whitespace-nowrap text-black">
                Telkom University <span className="text-neutral-400">→</span> BEC
            </p>

            <div className="absolute top-[87.5px] left-[385px] flex w-[181px] flex-col gap-[8.75px]">
                {options.map((option) => (
                    <div
                        key={option.price}
                        className="relative h-[32.5px] rounded-[6px] border-[0.5px] border-[#e9eaed] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.1)]"
                    >
                        <span className="absolute top-1/2 left-[7px] h-[23px] w-[23px] -translate-y-1/2 [&>svg]:h-full [&>svg]:w-full">{option.icon}</span>
                        <span className={`${cellClass} left-[44px]`}>{option.price}</span>
                        <span className={`${cellClass} left-[83.5px]`}>{option.time}</span>
                        <span className={`${cellClass} left-[123px]`}>{option.transit}</span>
                        <svg
                            aria-hidden="true"
                            width="3"
                            height="5"
                            viewBox="0 0 3 5"
                            fill="none"
                            className={`absolute top-1/2 left-[167.5px] -translate-y-1/2 ${option.chevron}`}
                        >
                            <path d="M0.5 0.5 2.5 2.5 0.5 4.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                ))}
            </div>

            <div className="absolute top-[65px] left-[573.5px] h-[142.5px] w-[106.5px] overflow-hidden rounded-lg">
                <Image src="/images/MapIllustration.png" alt="Peta rute" fill className="object-cover" sizes="107px" />
            </div>
        </div>
    );
}