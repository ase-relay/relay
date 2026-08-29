import { RouteSearchForm } from './RouteSearchForm';

export function HeroSection() {
  return (
    <section className="bg-linear-to-b from-primary-50 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
          Perjalanan Jadi Lebih Mudah Dengan{' '}
          <span className="text-primary-600">Transportasi Umum</span>
        </h1>
        <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
          Temukan rute terbaik untuk perjalanan Anda di wilayah Bandung-Cimahi dengan berbagai pilihan moda transportasi yang tersedia.
        </p>

        <div className="mt-8">
          <RouteSearchForm />
        </div>
      </div>
    </section>
  );
}
