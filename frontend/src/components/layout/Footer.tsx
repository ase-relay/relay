import Image from 'next/image';

export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`px-6 py-8 ${className}`}>
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-5 sm:flex-row sm:gap-20">
        <Image
          src="/logo/logo.svg"
          alt="Otewe"
          width={120}
          height={36}
          className="h-auto w-28"
        />
        <p className="text-sm text-neutral-600">
          © {new Date().getFullYear()} Otewe. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
