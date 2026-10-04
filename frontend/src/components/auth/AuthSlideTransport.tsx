import { VehicleIcon } from "@/components/icons/vehicle/VehicleIcon";
import { AuthSlideText } from "@/components/auth/AuthSlideText";

// Tiga lingkaran kendaraan berdiameter 85px yang saling menumpuk, sesuai desain.
const iconClass = "absolute h-[85px] w-[85px] [&>svg]:h-full [&>svg]:w-full";

export function AuthSlideTransport() {
    return (
        <div className="relative h-full w-full">
            <AuthSlideText
                title={<>Mau Naik Apa? <br />Pilih Sesukamu!</>}
                description="Pilih jenis transportasi umum yang sesuai dengan kebutuhanmu."
            />
            <div className={`${iconClass} top-[53px] left-[458px]`}><VehicleIcon type="bus" /></div>
            <div className={`${iconClass} top-[95.5px] left-[524px]`}><VehicleIcon type="motorcycle" /></div>
            <div className={`${iconClass} top-[136.5px] left-[452px]`}><VehicleIcon type="train" /></div>
        </div>
    );
}