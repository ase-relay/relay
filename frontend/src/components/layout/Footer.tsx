import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-white px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Image
          src="/logo/logo.png"
          alt="otewe"
          width={120}
          height={36}
          className="h-auto w-28"
        />
        <p className="text-sm text-neutral-500">
          © {new Date().getFullYear()} Otewe. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
