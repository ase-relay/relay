import { VehicleIcon } from "@/components/icons/vehicle/VehicleIcon";
import { HiOutlineUser } from "react-icons/hi2";

export function AuthSlideTransport() {
    return (
        <div className="grid h-full items-center gap-4 px-10 py-7 md:grid-cols-[1fr_1.15fr]">
            <div>
                <h3 className="text-xl leading-tight font-bold text-black">
                    Mau Naik Apa? <br />Pilih Sesukamu!
                </h3>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-neutral-800">
                    Pilih jenis transportasi umum yang sesuai dengan kebutuhanmu.
                </p>
            </div>
            <div className="relative mx-auto h-36 w-40">
                <div className="absolute top-0 left-4 h-18 w-18 [&>svg]:h-full [&>svg]:w-full"><VehicleIcon type="bus" /></div>
                <div className="absolute bottom-0 left-0 h-18 w-18 [&>svg]:h-full [&>svg]:w-full"><VehicleIcon type="motorcycle" /></div>
                <div className="absolute bottom-0 right-0 h-18 w-18 [&>svg]:h-full [&>svg]:w-full"><VehicleIcon type="train" /></div>
            </div>
        </div>
    );
}
