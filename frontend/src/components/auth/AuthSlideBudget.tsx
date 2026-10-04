import Image from "next/image";
import { AuthSlideText } from "@/components/auth/AuthSlideText";

export function AuthSlideBudget() {
    return (
        <div className="relative h-full w-full">
            <AuthSlideText
                title="Hemat Ongkos, Tetap Otewe"
                description="Cari pilihan rute yang pas dengan budget perjalananmu."
            />
            <div className="absolute top-[70px] left-[391.5px] h-[143px] w-[266px]">
                <Image
                    src="/images/Login_Card1.png"
                    alt="Ilustrasi rute perjalanan hemat"
                    fill
                    className="object-contain"
                    sizes="266px"
                />
            </div>
        </div>
    );
}