import Image from "next/image";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import LineIcon from "@/components/icons/home/LineIcon";

export default function TentangPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-clip bg-white text-black">
      {/* overflow-clip (bukan overflow-hidden): hidden menjadikan wrapper ini scroll container
          sehingga Navbar sticky ikut terscroll. clip memotong overflow tanpa merusak sticky. */}
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
        <section className="grid w-full items-center gap-12 lg:grid-cols-[0.93fr_1.07fr] lg:gap-8">
          <div className="relative z-10">
            <h1 className="text-4xl leading-none font-bold tracking-tight sm:text-5xl lg:text-[56px]">
              Tentang Otewe
            </h1>
            <div className="ml-[42%] mt-2 w-48 sm:w-60 lg:w-73.5">
              <LineIcon width={180} strokeWidth={5} />
            </div>

            <p className="mt-12 max-w-155 text-base leading-[1.55] font-normal sm:text-lg lg:text-xl">
              Otewe adalah platform perbandingan rute transportasi umum di wilayah Bandung dan Cimahi yang membantu pengguna menemukan pilihan perjalanan yang sesuai dengan kebutuhan mereka. Dengan membandingkan estimasi ongkos, durasi perjalanan, dan pilihan transportasi, Otewe membantu proses merencanakan perjalanan menjadi lebih mudah dan praktis.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-200 lg:ml-auto">
            <Image
              src="/images/Tentang.svg"
              alt="Ilustrasi pilihan transportasi umum Otewe"
              width={800}
              height={600}
              priority
              className="h-auto w-full"
              sizes="(max-width: 1024px) 100vw, 52vw"
            />
          </div>
        </section>
      </main>

      <Footer className="pt-6 sm:pt-8" />
    </div>
  );
}
