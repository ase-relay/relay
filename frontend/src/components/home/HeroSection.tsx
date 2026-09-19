import Image from 'next/image';
import { HeroSearchForm } from './HeroSearchForm';
import DotGridBlueIcon from '@/components/icons/home/DotGridBlueIcon';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-neutral-50">
      {/* Dekorasi dot grid */}
      <DotGridBlueIcon className="absolute left-0 bottom-8 hidden md:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
          {/* Kiri: heading + form pencarian */}
          <div className="relative z-10 pb-16">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 leading-tight">
              Mau Otewe{' '}
              <span className="relative inline-block">
                ke mana?
                <svg
                  className="absolute left-0 -bottom-2 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8C60 2 240 2 298 8"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-neutral-600 max-w-md">
              Masukkan lokasi awal dan tujuanmu untuk menemukan pilihan
              perjalanan yang sesuai.
            </p>

            <div className="mt-8">
              <HeroSearchForm />
            </div>
          </div>

          {/* Kanan: ilustrasi */}
          <div className="relative hidden lg:block h-105">
            <Image
              src="/images/ilustrasi-transportasi.png"
              alt="Ilustrasi transportasi umum di kota"
              fill
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}