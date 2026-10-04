"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HiArrowLeft, HiOutlineEnvelope } from "react-icons/hi2";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const emailValid = /^\S+@\S+\.\S+$/.test(email);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailValid) {
      setError("Masukkan alamat email yang valid");
      return;
    }
    // TODO: sambungkan ke API pengiriman tautan reset password.
    setError("");
  }

  return (
    <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-18">
      <div className="w-full max-w-lg">
        <Link href="/">
          <Image src="/logo/logo.svg" alt="Otewe" width={160} height={48} priority className="mb-12 h-auto w-40 lg:hidden cursor-pointer" />
        </Link>
        <Link href="/login" className="inline-flex items-center gap-3 text-sm font-medium text-primary-600 hover:underline"><HiArrowLeft className="h-4 w-4" />Kembali ke halaman Masuk</Link>
        <h2 className="mt-10 text-2xl font-extrabold tracking-tight text-black">Lupa Kata Sandi?</h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">Masukkan alamat email yang terdaftar pada akun kamu. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.</p>
        {error && <p role="alert" className="mt-8 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="email" className="text-sm font-semibold text-black">Email Terdaftar</label>
          <div className="relative mt-3"><HiOutlineEnvelope className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="Masukkan email terdaftar" className={`w-full rounded-xl border py-3 pr-4 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-1 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-neutral-300 focus:border-primary-600 focus:ring-primary-600"}`} /></div>
          <button type="submit" disabled={!emailValid} className="mt-6 w-full cursor-pointer rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:hover:bg-neutral-400">Kirim Tautan</button>
        </form>
      </div>
    </section>
  );
}