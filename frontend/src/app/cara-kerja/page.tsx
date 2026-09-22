import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import LineIcon from "@/components/icons/home/LineIcon";
import DashedArrowDownIcon from "@/components/icons/home/DashedArrowDownIcon";
import { StepCard } from "@/components/cara-kerja/StepCard";
import { LoginIllustration } from "@/components/cara-kerja/LoginIllustration";
import { RouteInputIllustration } from "@/components/cara-kerja/RouteInputIllustration";
import { RouteResultCard } from "@/components/cara-kerja/RouteResultCard";

export default function CaraKerjaPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white text-black">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl flex-1 px-6 pt-10 pb-20 sm:px-10 lg:px-12">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[56px]">
                    Cara Kerja{" "}
                    <span className="relative inline-block">
                        Otewe
                        <span className="absolute -bottom-2 left-0 w-full sm:-bottom-3">
                            <LineIcon strokeWidth={5} className="w-full h-auto" />
                        </span>
                    </span>
                </h1>

                <div className="mt-14 flex flex-col items-center lg:mt-16">
                    <StepCard
                        step={1}
                        title="Masuk atau Daftar"
                        description="Masuk ke akunmu atau buat akun baru untuk mulai menggunakan Otewe."
                    >
                        <LoginIllustration />
                    </StepCard>

                    <div className="my-10">
                        <DashedArrowDownIcon />
                    </div>

                    <StepCard
                        step={2}
                        title="Masukkan Rute Perjalanan"
                        description="Tentukan titik awal dan tujuan perjalananmu."
                    >
                        <RouteInputIllustration />
                    </StepCard>

                    <div className="my-10">
                        <DashedArrowDownIcon />
                    </div>

                    <StepCard
                        step={3}
                        title="Lihat dan Bandingkan Hasil"
                        description="Dapatkan berbagai pilihan rute dengan informasi ongkos, transportasi, dan waktu tempuh."
                    >
                        <div className="space-y-6">
                            <RouteResultCard vehicle="bus" price="Rp4.900" duration="60 menit" transit="1x transit" />
                            <RouteResultCard vehicle="train" price="Rp7.000" duration="40 menit" transit="2x transit" />
                            <RouteResultCard vehicle="motorcycle" price="Rp16.900" duration="20 menit" transit="Tanpa Transit" />
                        </div>
                    </StepCard>

                    <div className="my-10">
                        <DashedArrowDownIcon />
                    </div>

                    <StepCard
                        step={4}
                        title="Pilih dan Berangkat"
                        description="Klik untuk melihat detail rute dan mulai perjalananmu."
                    >
                        <div className="relative aspect-800/290 w-full overflow-hidden rounded-[20px]">
                            <Image
                                src="/images/MapIllustration.png"
                                alt="Ilustrasi peta dengan rute perjalanan"
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 560px"
                            />
                        </div>
                        <div className="mt-7">
                            <RouteResultCard vehicle="bus" price="Rp4.900" duration="60 menit" transit="1x transit" />
                        </div>
                    </StepCard>
                </div>
            </main>

            <Footer />
        </div>
    );
}