import Link from "next/link";

export function AuthNavButtons() {
  return (
    <div className="flex shrink-0 items-center gap-6">
      <Link
        href="/login"
        className="text-base font-medium text-primary-600 transition-colors hover:text-primary-700"
      >
        Masuk
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-primary-600 px-10 py-2.5 font-semibold text-white transition-colors hover:bg-primary-700"
      >
        Daftar
      </Link>
    </div>
  );
}
