/* eslint-disable tailwindcss/no-arbitrary-value -- Specific dimensions needed for glow background effects */
import Image from "next/image";
import { LandingPageNavbar } from "@/components/layout/LandingPageNavbar";
import { Footer } from "@/components/layout/Footer";
import WalletIcon from "@/components/icons/home/WalletIcon";
import TransportIcon from "@/components/icons/home/TransportIcon";
import ClockIcon from "@/components/icons/home/ClockIcon";
import LineIcon from "@/components/icons/home/LineIcon";
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
    <section className="relative overflow-hidden min-h-screen px-4 py-16 sm:py-20">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl leading-tight font-extrabold text-neutral-900 sm:text-5xl">
            Perjalananmu, pilihanmu.
            <br />
            Otewe bantu cari yang pas.
          </h1>
          <div className="mt-3 w-40">
            <LineIcon />
          </div>

          <p className="mt-6 max-w-md text-lg text-neutral-500">
            Temukan rute transportasi terbaik untuk perjalananmu dengan mudah,
            cepat, dan hemat.
          </p>

          <div className="mt-8 flex items-center gap-6">
            <button
              type="button"
              className="rounded-full bg-primary-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              Mulai Otewe
            </button>
            <button
              type="button"
              className="flex items-center gap-2 font-medium text-neutral-700 hover:text-primary-600"
            >
              <span className="h-6 w-6 [&>svg]:h-6 [&>svg]:w-6">
                <PlayCircleIcon />
              </span>
              Pelajari Laman
            </button>
          </div>
        </div>

        <div className="relative mx-auto h-72 w-full max-w-md sm:h-80 lg:h-96">
          <Image
            src="/images/Login_Onboard.png"
            alt="Ilustrasi orang menunggu bus otewe"
            fill
            className="object-contain object-bottom"
            priority
          />

          <div className="absolute top-0 left-0 z-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <div className="h-10 w-10 shrink-0 [&>svg]:h-10 [&>svg]:w-10">
              <WalletIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-600">Ongkos</p>
              <p className="text-xs text-neutral-500">Hemat di kantong</p>
            </div>
          </div>

          <div className="absolute top-4 right-0 z-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <div className="h-10 w-10 shrink-0 [&>svg]:h-10 [&>svg]:w-10">
              <ClockIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-accent-amber">Waktu</p>
              <p className="text-xs text-neutral-500">Sesuai kebutuhan</p>
            </div>
          </div>

          <div className="absolute bottom-0 left-4 z-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
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
      <Image
        src="/images/blue-glow-bg-2.png"
        alt=""
        width={900}
        height={500}
        className="pointer-events-none absolute -bottom-20 left-0 z-0 h-auto w-full max-w-none opacity-80"
      />
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
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Tentukan Prioritas Perjalananmu
          </h2>
          <div className="mx-auto mt-3 w-48">
            <LineIcon />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-5">{card.icon}</div>
              <h3 className={`mb-2 text-xl font-bold ${card.titleColorClass}`}>
                {card.title}
              </h3>
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
    },
    {
      title: "Lihat Pilihan",
      description: "Otewe kasih beberapa rekomendasi perjalanan.",
      badgeColorClass: "bg-accent-amber",
    },
    {
      title: "Bandingkan",
      description: "Pilih yang paling pas sesuai kondisimu.",
      badgeColorClass: "bg-accent-green",
    },
    {
      title: "Gas berangkat",
      description: "Lihat detail perjalanan dan rutenya di peta.",
      badgeColorClass: "bg-primary-600",
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-20">
      <div className="pointer-events-none absolute top-8 right-8 hidden lg:block">
        <DotGridBlueIcon />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Cara Kerja Otewe
          </h2>
          <div className="mx-auto mt-3 w-48">
            <LineIcon />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-x-4">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <div className="relative h-24 w-24">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src="/images/Login_Card1.png"
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>
                <span
                  className={`absolute -top-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${step.badgeColorClass}`}
                >
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-4 font-bold text-neutral-900">{step.title}</h3>
              <p className="mt-1 max-w-[200px] text-sm text-neutral-600">
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
    <section className="relative overflow-hidden bg-white px-4 py-20">
      <div className="pointer-events-none absolute bottom-8 left-0 hidden lg:block">
        <DotGridOrangeIcon />
      </div>

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm md:p-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="h-8 w-12 [&>svg]:h-8 [&>svg]:w-12">
              <QuoteIcon />
            </div>
            <p className="mt-4 text-lg font-semibold text-neutral-900">
              Otewe bantu banget! Sekarang nggak bingung lagi mau pilih
              transportasi apa kalau bepergian.
            </p>
            <p className="mt-3 text-sm text-neutral-500 italic">
              -- Dinda, Mahasiswa
            </p>
          </div>

          <div>
            <p className="mb-4 font-semibold text-neutral-900">
              Telkom University <span className="text-primary-600">→</span> BEC
            </p>
            <div className="space-y-3">
              {priceRows.map((row) => (
                <div
                  key={row.price}
                  className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 [&>svg]:h-10 [&>svg]:w-10">
                      {row.icon}
                    </div>
                    <span className="font-semibold text-neutral-900">
                      {row.price}
                    </span>
                  </div>
                  <span className="text-sm text-neutral-500">{row.duration}</span>
                  <span className="text-sm text-neutral-500">
                    {row.transitLabel}
                  </span>
                  <span className="h-2.5 w-2.5 text-neutral-400 [&>svg]:h-full [&>svg]:w-full">
                    <RightArrowIcon />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden rounded-2xl">
            <Image
              src="/images/MapIllustration.png"
              alt="Ilustrasi peta rute otewe"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-white px-4 py-20 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold text-neutral-900">
          Siap menemukan perjalanan yang pas untukmu?
        </h2>
        <button
          type="button"
          className="mt-8 rounded-full bg-primary-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          Mulai Otewe
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="relative flex flex-col bg-linear-to-b from-primary-50 via-white to-white">
      <Image
        src="/images/blue-glow-bg.png"
        alt=""
        width={800}
        height={800}
        /* eslint-disable-next-line tailwindcss/classnames-order -- Arbitrary values needed for specific glow dimensions */
        className="pointer-events-none absolute top-0 left-0 z-0 h-auto w-[500px] max-w-none sm:w-[700px]"
        priority
      />
      <div className="relative z-10">
        <LandingPageNavbar />
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