"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HiArrowLeft, HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed } from "react-icons/hi2";

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const passwordValid = passwordPattern.test(password);
  const confirmationValid = confirmation.length > 0 && password === confirmation;
  const formValid = passwordValid && confirmationValid;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!formValid) return;
    // TODO: sambungkan ke API reset password dengan token dari tautan email.
  }

  const inputClass = (hasError: boolean) => `w-full rounded-xl border py-3 pr-11 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-1 ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-neutral-300 focus:border-primary-600 focus:ring-primary-600"}`;

  return (
    <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-18"><div className="w-full max-w-lg">
      <Link href="/">
        <Image src="/logo/logo.svg" alt="Otewe" width={160} height={48} priority className="mb-12 h-auto w-40 lg:hidden cursor-pointer" />
      </Link>
      <Link href="/lupa-password" className="inline-flex items-center gap-3 text-sm font-medium text-primary-600 hover:underline"><HiArrowLeft className="h-4 w-4" />Kembali ke Lupa Kata Sandi</Link>
      <h2 className="mt-10 text-2xl font-extrabold tracking-tight text-black">Buat Ulang Kata Sandi</h2>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">Masukkan kata sandi baru untuk akun kamu. Pastikan kata sandi aman dan mudah diingat.</p>
      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <div><label htmlFor="password" className="text-sm font-semibold text-black">Kata Sandi Baru</label><div className="relative mt-3"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Buat kata sandi" className={inputClass(submitted && !passwordValid)} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div><p className={`mt-1 text-xs ${submitted && !passwordValid ? "text-red-600" : "text-neutral-400"}`}>Minimal 8 karakter dengan kombinasi huruf dan angka</p></div>
        <div><label htmlFor="confirmation" className="text-sm font-semibold text-black">Konfirmasi Kata Sandi</label><div className="relative mt-3"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Ulangi kata sandi" className={inputClass(submitted && !confirmationValid)} /><button type="button" onClick={() => setShowConfirmation((current) => !current)} aria-label={showConfirmation ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showConfirmation ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div>{submitted && !confirmationValid && <p className="mt-1 text-xs text-red-600">Konfirmasi kata sandi belum cocok</p>}</div>
        <button type="submit" disabled={!formValid} className="w-full cursor-pointer rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:hover:bg-neutral-400">Atur Ulang Kata Sandi</button>
      </form>
    </div></section>
  );
}