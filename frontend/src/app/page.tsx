/* eslint-disable tailwindcss/no-arbitrary-value -- Specific dimensions needed for glow background effects */
"use client";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import WalletIcon from "@/components/icons/home/WalletIcon";
import TransportIcon from "@/components/icons/home/TransportIcon";
import ClockIcon from "@/components/icons/home/ClockIcon";
import LineIcon from "@/components/icons/home/LineIcon";
import ArrowIcon from "@/components/icons/home/ArrowIcon";
import PlayCircleIcon from "@/components/icons/home/PlayCircleIcon";
import DotGridBlueIcon from "@/components/icons/home/DotGridBlueIcon";
import DotGridOrangeIcon from "@/components/icons/home/DotGridOrangeIcon";
import QuoteIcon from "@/components/icons/home/QuoteIcon";
import RightArrowIcon from "@/components/icons/home/RightArrowIcon";
import BusIcon from "@/components/icons/vehicle/BusIcon";
import TrainIcon from "@/components/icons/vehicle/TrainIcon";
import MotorcycleIcon from "@/components/icons/vehicle/MotorcycleIcon";

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-13 sm:pt-16 lg:pb-30">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-4">
        <div className="order-2 lg:order-1">
          <h1 className="text-4xl leading-tight font-extrabold text-neutral-900 sm:text-5xl">
            Perjalananmu, pilihanmu.
            <br />
            Otewe bantu cari yang pas.
          </h1>
          <div className="mt-3 w-full max-w-74 [&>svg]:h-auto [&>svg]:w-full">
            <LineIcon />
          </div>

          <p className="mt-6 max-w-md text-lg text-neutral-500">
            Temukan rute transportasi terbaik untuk perjalananmu dengan mudah,
            cepat, dan hemat.
          </p>

          <div className="mt-8 flex items-center gap-6">
            <Link
              href="/beranda"
              className="rounded-[20px] bg-primary-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 cursor-pointer"
            >
              Mulai Otewe
            </Link>
            <Link
              href="/cara-kerja"
              className="flex items-center gap-2 font-medium text-neutral-700 hover:text-primary-600 cursor-pointer"
            >
              <span className="h-10 w-10 [&>svg]:h-10 [&>svg]:w-10">
                <PlayCircleIcon />
              </span>
              Pelajari Laman
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-150 order-1 lg:order-2 lg:translate-y-3">
          <div className="relative aspect-4/3 sm:aspect-5/4 overflow-hidden rounded-3xl">
            <Image
              src="/images/Login_Onboard.png"
              alt="Ilustrasi orang menunggu bus otewe"
              fill
              className="object-contain object-bottom"
              priority
              sizes="(max-width: 680px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Card "Ongkos" - pojok kiri atas */}
          <div className="absolute top-5 left-5 z-10 flex flex-nowrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg sm:top-12 sm:left-12 lg:top-16 lg:left-25">
            <div className="h-10 w-10 shrink-0 [&>svg]:h-10 [&>svg]:w-10">
              <WalletIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-600">Ongkos</p>
              <p className="text-xs text-neutral-500">Hemat di kantong</p>
            </div>
          </div>

          {/* Card "Waktu" - sisi kanan, agak ke tengah-atas */}
          <div className="absolute top-[30%] -right-4 z-10 flex flex-nowrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg sm:top-[25%] sm:-right-6 lg:top-[30%] lg:-right-3">
            <div className="h-10 w-10 shrink-0 [&>svg]:h-10 [&>svg]:w-10">
              <ClockIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-accent-amber">Waktu</p>
              <p className="text-xs text-neutral-500">Sesuai kebutuhan</p>
            </div>
          </div>

          {/* Card "Transportasi" - pojok kiri bawah */}
          <div className="absolute -bottom-4 -left-4 z-10 flex flex-nowrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg sm:-bottom-6 sm:-left-6 lg:-bottom-1 lg:left-1">
            <div className="h-10 w-10 shrink-0 [&>svg]:h-10 [&>svg]:w-10">
              <TransportIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-accent-green">
                Transportasi
              </p>
              <p className="text-xs text-neutral-500">Banyak pilihan</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrioritySection() {
  const cards = [
    {
      icon: <WalletIcon />,
      title: "Ongkos",
      description: "Bandingkan estimasi biaya dari berbagai pilihan perjalanan.",
      titleColorClass: "text-primary-600",
    },
    {
      icon: <TransportIcon />,
      title: "Transportasi",
      description: "Pilih moda transportasi yang sesuai dengan kebutuhanmu.",
      titleColorClass: "text-accent-green",
    },
    {
      icon: <ClockIcon />,
      title: "Waktu",
      description:
        "Bandingkan durasi perjalanan dan pilih yang paling cocok buatmu.",
      titleColorClass: "text-accent-amber",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white px-4 py-20 lg:pb-28">
      <div className="pointer-events-none absolute -bottom-22 -right-1 hidden lg:block">
        <DotGridBlueIcon />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Tentukan Prioritas Perjalananmu
          </h2>
          <div className="mx-auto mt-3 w-full max-w-74 [&>svg]:h-auto [&>svg]:w-full">
            <LineIcon />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-4 mb-2">
                <div className="shrink-0">{card.icon}</div>
                <h3 className={`text-xl font-bold ${card.titleColorClass}`}>
                  {card.title}
                </h3>
              </div>
              <p className="text-neutral-500">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      title: "Tentukan tujuan",
      description: "Masukkan lokasi awal dan tujuan perjalananmu.",
      badgeColorClass: "bg-primary-600",
      illustration: "/images/cara-kerja/TentukanTujuan.svg",
      illustrationPositionClass: "translate-x-8",
    },
    {
      title: "Lihat Pilihan",
      description: "Otewe kasih beberapa rekomendasi perjalanan.",
      badgeColorClass: "bg-accent-amber",
      illustration: "/images/cara-kerja/LihatPilihan.svg",
      illustrationPositionClass: "translate-x-8",
    },
    {
      title: "Bandingkan",
      description: "Pilih yang paling pas sesuai kondisimu.",
      badgeColorClass: "bg-accent-green",
      illustration: "/images/cara-kerja/Bandingkan.svg",
      illustrationPositionClass: "translate-x-8",
    },
    {
      title: "Gas berangkat",
      description: "Lihat detail perjalanan dan rutenya di peta.",
      badgeColorClass: "bg-primary-600",
      illustration: "/images/cara-kerja/GasBerangkat.svg",
      illustrationPositionClass: "translate-x-3",
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-20">
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Cara Kerja Otewe
          </h2>
          <div className="mx-auto mt-3 w-full max-w-74 [&>svg]:h-auto [&>svg]:w-full">
            <LineIcon />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-x-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center"
            >
              {index < steps.length - 1 && (
                <span className="absolute top-20 left-[calc(50%+5rem)] z-10 hidden h-3 w-37 md:block [&>svg]:h-full [&>svg]:w-full">
                  <ArrowIcon />
                </span>
              )}
              <div className={`relative h-36 w-48 sm:h-40 sm:w-52 md:h-44 md:w-56 ${step.illustrationPositionClass}`}>
                <Image
                  src={step.illustration}
                  alt=""
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 14rem"
                />
                <span
                  className={`absolute top-5 left-6 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${step.badgeColorClass}`}
                >
                  {index + 1}
                </span>
              </div>
              <h3 className="-mt-8 font-bold text-neutral-900">{step.title}</h3>
              <p className="mt-1 max-w-50 text-sm text-neutral-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialSection() {
  const priceRows = [
    { icon: <BusIcon />, price: "Rp4.900", duration: "60 menit", transitLabel: "1x transit" },
    { icon: <TrainIcon />, price: "Rp7.000", duration: "40 menit", transitLabel: "2x transit" },
    { icon: <MotorcycleIcon />, price: "Rp16.900", duration: "20 menit", transitLabel: "Tanpa Transit" },
  ];

  return (
    <section className="relative overflow-hidden bg-white px-4 py-16">
      <div className="pointer-events-none absolute top-0 left-0 hidden lg:block">
        <DotGridOrangeIcon />
      </div>

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_3px_12px_rgba(15,23,42,0.08)] md:px-14 md:py-8">
        <div className="grid items-center gap-8 md:grid-cols-[0.9fr_1.25fr_0.75fr]">
          <div className="md:pl-2">
            <div className="h-12 w-16 [&>svg]:h-12 [&>svg]:w-16">
              <QuoteIcon />
            </div>
            <p className="mt-7 max-w-60 text-base leading-relaxed font-semibold text-neutral-900">
              Otewe bantu banget! Sekarang nggak bingung lagi mau pilih transportasi apa kalau bepergian.
            </p>
            <p className="mt-3 text-sm font-medium text-neutral-600 italic">
              -- Dinda, Mahasiswa
            </p>
          </div>

          <div>
            <p className="mb-4 text-lg font-semibold text-neutral-900">
              Telkom University <span className="mx-1 text-neutral-400">→</span> BEC
            </p>
            <div className="space-y-4">
              {priceRows.map((row) => (
                <div
                  key={row.price}
                  className="flex min-h-18 items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 [&>svg]:h-10 [&>svg]:w-10">
                      {row.icon}
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {row.price}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">{row.duration}</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {row.transitLabel}
                  </span>
                  <span className="h-3 w-3 [&>svg]:h-full [&>svg]:w-full">
                    <RightArrowIcon />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-80 overflow-hidden rounded-[20px]">
            <Image
              src="/images/MapIllustration.png"
              alt="Ilustrasi peta rute otewe"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 25vw, 15rem"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-white px-4 py-12 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-neutral-900">
          Siap menemukan perjalanan yang pas untukmu?
        </h2>
        <Link
          href="/beranda"
          className="mt-8 inline-block rounded-[20px] bg-primary-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 cursor-pointer"
        >
          Mulai Otewe
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="relative flex flex-col bg-linear-to-b from-primary-50 via-white to-white">
      <Image
        src="/images/effect/blue-glow-bg.png"
        alt=""
        width={800}
        height={800}
        /* eslint-disable-next-line tailwindcss/classnames-order -- Arbitrary values needed for specific glow dimensions */
        className="pointer-events-none absolute top-0 left-0 z-0 h-auto w-full max-w-125 sm:max-w-175"
        priority
      />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <PrioritySection />
        <HowItWorksSection />
        <TestimonialSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
