import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <svg className="h-24 w-24 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h1 className="mb-3 text-3xl font-bold text-neutral-900">Anda sedang offline</h1>
        <p className="mb-8 text-lg text-neutral-600">
          Periksa koneksi internet Anda dan coba lagi.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Coba Lagi
        </Link>
      </div>
    </div>
  );
}
