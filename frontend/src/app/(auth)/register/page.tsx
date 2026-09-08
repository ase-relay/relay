"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
    HiOutlineEnvelope,
    HiOutlineUser,
    HiOutlineLockClosed,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiChevronLeft,
    HiChevronRight,
} from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";

const CAROUSEL_SLIDES = [
    {
        title: "Hemat Ongkos, Tetap Otewe",
        description: "Cari pilihan rute yang pas dengan budget perjalananmu.",
        image: "/images/Register_Card1.png",
    },
];

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: sambungkan ke API register
        console.log(form);
    };

    return (
        <div className="grid min-h-screen bg-white lg:grid-cols-2">
            {/* Kiri - Ilustrasi & branding */}
            <div className="relative hidden flex-col overflow-hidden bg-gradient-to-b from-white to-primary-50 px-16 py-12 lg:flex h-full">
                {/* Background illustration - absolute, di belakang konten */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/Login_Onboard.png"
                        alt=""
                        fill
                        className="object-cover object-bottom opacity-100"
                    />
                </div>

                {/* Konten - relative + z-10 supaya di atas gambar */}
                <div className="relative z-10 flex h-full flex-col">
                    <Image
                        src="/logo/logo.png"
                        alt="otewe"
                        width={160}
                        height={48}
                        className="h-auto w-40"
                        priority
                    />

                    <div className="mt-16 max-w-md">
                        <h1 className="text-4xl leading-tight font-extrabold text-neutral-900">
                            Selamat datang di otewe!
                        </h1>
                        <p className="mt-4 text-lg text-neutral-500">
                            Temukan rute transportasi terbaik untuk perjalananmu dengan mudah,
                            cepat, dan hemat.
                        </p>
                    </div>

                    <div className="flex-1" />

                    {/* Card carousel */}
                    <div className="relative -mb-4 flex items-center gap-6 rounded-2xl bg-white p-6 shadow-xl">
                        <button
                            type="button"
                            aria-label="Slide sebelumnya"
                            onClick={() =>
                                setActiveSlide(
                                    (prev) =>
                                        (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length
                                )
                            }
                            className="absolute top-1/2 -left-5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 text-white shadow-md hover:bg-primary-700"
                        >
                            <HiChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-neutral-900">
                                {CAROUSEL_SLIDES[activeSlide].title}
                            </h3>
                            <p className="mt-2 text-sm text-neutral-500">
                                {CAROUSEL_SLIDES[activeSlide].description}
                            </p>
                        </div>

                        <div className="relative h-24 w-32 shrink-0">
                            <Image
                                src={CAROUSEL_SLIDES[activeSlide].image}
                                alt=""
                                fill
                                className="object-contain"
                            />
                        </div>

                        <button
                            type="button"
                            aria-label="Slide berikutnya"
                            onClick={() =>
                                setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)
                            }
                            className="absolute top-1/2 -right-5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 text-white shadow-md hover:bg-primary-700"
                        >
                            <HiChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-8 flex justify-center gap-2">
                        {CAROUSEL_SLIDES.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                aria-label={`Ke slide ${index + 1}`}
                                onClick={() => setActiveSlide(index)}
                                className={`h-2.5 rounded-full transition-all ${index === activeSlide
                                    ? "w-6 bg-primary-600"
                                    : "w-2.5 bg-neutral-200"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Kanan - Form register */}
            <div className="flex items-center justify-center px-6 py-12 sm:px-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 lg:hidden">
                        <Image
                            src="/logo/logo.png"
                            alt="otewe"
                            width={140}
                            height={42}
                            className="h-auto w-36"
                            priority
                        />
                    </div>

                    <h2 className="text-3xl font-extrabold text-neutral-900">
                        Siap buat Otewe?
                    </h2>
                    <p className="mt-2 text-neutral-500">
                        Daftar dan pilih transportasi yang pas buatmu.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-neutral-800"
                            >
                                Email
                            </label>
                            <div className="relative mt-2">
                                <HiOutlineEnvelope className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Masukkan email aktif"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    required
                                    className="w-full rounded-xl border border-neutral-200 py-3.5 pr-4 pl-11 text-neutral-900 placeholder:text-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-semibold text-neutral-800"
                            >
                                Username
                            </label>
                            <div className="relative mt-2">
                                <HiOutlineUser className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Buat username"
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, username: e.target.value }))
                                    }
                                    required
                                    minLength={3}
                                    maxLength={20}
                                    pattern="[A-Za-z0-9_]+"
                                    className="w-full rounded-xl border border-neutral-200 py-3.5 pr-4 pl-11 text-neutral-900 placeholder:text-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-neutral-400">
                                3-20 karakter, hanya huruf, angka, dan underscore
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-neutral-800"
                            >
                                Kata Sandi
                            </label>
                            <div className="relative mt-2">
                                <HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Buat kata sandi"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, password: e.target.value }))
                                    }
                                    required
                                    minLength={8}
                                    className="w-full rounded-xl border border-neutral-200 py-3.5 pr-11 pl-11 text-neutral-900 placeholder:text-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={
                                        showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                                    }
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showPassword ? (
                                        <HiOutlineEyeSlash className="h-5 w-5" />
                                    ) : (
                                        <HiOutlineEye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <p className="mt-1.5 text-xs text-neutral-400">
                                Minimal 8 karakter dengan kombinasi huruf dan angka
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-semibold text-neutral-800"
                            >
                                Konfirmasi Kata Sandi
                            </label>
                            <div className="relative mt-2">
                                <HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Ulangi kata sandi"
                                    value={form.confirmPassword}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            confirmPassword: e.target.value,
                                        }))
                                    }
                                    required
                                    minLength={8}
                                    className="w-full rounded-xl border border-neutral-200 py-3.5 pr-11 pl-11 text-neutral-900 placeholder:text-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    aria-label={
                                        showConfirmPassword
                                            ? "Sembunyikan kata sandi"
                                            : "Tampilkan kata sandi"
                                    }
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showConfirmPassword ? (
                                        <HiOutlineEyeSlash className="h-5 w-5" />
                                    ) : (
                                        <HiOutlineEye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="terms" className="text-sm text-neutral-600">
                                Saya menyetujui{" "}
                                <Link
                                    href="/terms"
                                    className="font-medium text-primary-600 hover:text-primary-700"
                                >
                                    Syarat &amp; Ketentuan
                                </Link>{" "}
                                dan{" "}
                                <Link
                                    href="/privacy"
                                    className="font-medium text-primary-600 hover:text-primary-700"
                                >
                                    Kebijakan Privasi
                                </Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={!agreedToTerms}
                            className="w-full rounded-xl bg-primary-600 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:hover:bg-neutral-400"
                        >
                            Daftar
                        </button>
                    </form>

                    <div className="mt-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-neutral-200" />
                        <span className="text-sm text-neutral-400">atau</span>
                        <div className="h-px flex-1 bg-neutral-200" />
                    </div>

                    <button
                        type="button"
                        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 py-3.5 text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                        <FcGoogle className="h-5 w-5" />
                        Daftar dengan akun Google
                    </button>

                    <p className="mt-6 text-center text-sm text-neutral-500">
                        Sudah memiliki akun?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-primary-600 hover:text-primary-700"
                        >
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}