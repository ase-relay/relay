import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteSearchForm } from "@/components/route-search/RouteSearchForm";
import DotGridBlueIcon from "@/components/icons/home/DotGridBlueIcon";
import LineIcon from "@/components/icons/home/LineIcon";

export default function BerandaPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f7fbff] text-neutral-900">
      <Navbar />
      <main className="relative flex flex-1 items-center overflow-hidden">
        <DotGridBlueIcon className="pointer-events-none absolute bottom-10 left-0 hidden h-auto w-28 lg:block" />
        <section className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-0 lg:px-12 lg:py-16">
          <div className="relative z-10 lg:pb-4">
            <h1 className="whitespace-nowrap text-4xl leading-tight font-extrabold tracking-tight text-black sm:text-5xl lg:text-[64px]">Mau Otewe ke mana?</h1>
            <div className="ml-[54%] mt-1 w-72 sm:w-78"><LineIcon /></div>
            <p className="mt-10 max-w-xl text-base leading-relaxed text-neutral-900 sm:text-lg">Masukkan lokasi awal dan tujuanmu untuk menemukan pilihan perjalanan yang sesuai.</p>
            <div className="mt-9"><RouteSearchForm /></div>
          </div>
          <div className="relative min-h-85 lg:-ml-10 lg:min-h-145 lg:scale-110">
            <Image src="/images/ilustrasi-transportasi.png" alt="Ilustrasi bus, angkot, dan ojek di tengah kota" fill priority className="object-contain object-bottom" sizes="(max-width: 1024px) 100vw, 52vw" />
          </div>
        </section>
      </main>
      <Footer className="bg-[#f7fbff]" />
    </div>
  );
}
