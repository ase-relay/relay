import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              © {new Date().getFullYear()} TransitGo. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link href="/about" className="text-sm hover:text-primary-200 transition-colors">
              Tentang
            </Link>
            <Link href="/help" className="text-sm hover:text-primary-200 transition-colors">
              Bantuan
            </Link>
            <Link href="/contact" className="text-sm hover:text-primary-200 transition-colors">
              Kontak
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
