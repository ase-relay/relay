import Link from 'next/link';

interface ErrorPageAction {
  label: string;
  /** Link tujuan. Diisi salah satu dari `href` / `onClick`. */
  href?: string;
  /** Aksi tombol tanpa navigasi (mis. reset() di error boundary). */
  onClick?: () => void;
}

interface ErrorPageProps {
  /** Kode status besar, mis. "404". */
  kode: string;
  /** Judul singkat, mis. "Halaman tidak ditemukan". */
  judul: string;
  /** Penjelasan ramah maksimal dua kalimat. */
  deskripsi: string;
  /** Tombol utama (biru). */
  aksiUtama: ErrorPageAction;
  /** Tombol sekunder (garis tepi). Opsional. */
  aksiSekunder?: ErrorPageAction;
  /** Tinggi penuh layar. Matikan bila dirender di dalam layout (ada Navbar/Footer). */
  fullScreen?: boolean;
}

function ErrorActionButton({ action, primary }: { action: ErrorPageAction; primary: boolean }) {
  const className = primary
    ? 'inline-block w-full rounded-full bg-primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-700 sm:w-auto'
    : 'inline-block w-full rounded-full border border-neutral-300 px-8 py-3 font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 sm:w-auto';
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={`cursor-pointer ${className}`}>
      {action.label}
    </button>
  );
}

export function ErrorPage({ kode, judul, deskripsi, aksiUtama, aksiSekunder, fullScreen = true }: ErrorPageProps) {
  return (
    <div className={`flex items-center justify-center bg-white px-4 ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold tracking-tight text-primary-600 sm:text-8xl">{kode}</p>
        <h1 className="mt-4 mb-3 text-3xl font-bold text-neutral-900">{judul}</h1>
        <p className="mb-8 text-lg text-neutral-600">{deskripsi}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ErrorActionButton action={aksiUtama} primary />
          {aksiSekunder && <ErrorActionButton action={aksiSekunder} primary={false} />}
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
