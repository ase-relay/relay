"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineEnvelope, HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi2";
import axios from "axios";
import { AuthSlideBudget } from "@/components/auth/AuthSlideBudget";
import { AuthSlideRoute } from "@/components/auth/AuthSlideRoute";
import { AuthSlideTransport } from "@/components/auth/AuthSlideTransport";
import { CarouselNavButton } from "@/components/ui/CarouselNavButton";
import { useAuth } from "@/context/AuthContext";

const slides = [AuthSlideBudget, AuthSlideTransport, AuthSlideRoute];
const usernamePattern = /^[A-Za-z0-9_]{3,20}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function RegisterPage() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [apiError, setApiError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ email: "", username: "", password: "", confirmation: "" });
    const { register: registerUser } = useAuth();
    const router = useRouter();
    const ActiveSlide = slides[activeSlide];
    const usernameValid = usernamePattern.test(form.username);
    const passwordValid = passwordPattern.test(form.password);
    const confirmationValid = form.confirmation === form.password && form.confirmation.length > 0;
    const formValid = Boolean(form.email) && usernameValid && passwordValid && confirmationValid && agreedToTerms;

    function moveSlide(direction: number) {
        setActiveSlide((current) => (current + direction + slides.length) % slides.length);
    }

    function updateField(field: keyof typeof form, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitted(true);
        if (!formValid) return;

        setApiError("");
        setIsSubmitting(true);

        try {
            await registerUser({ email: form.email, username: form.username, password: form.password });
            router.push('/login');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 409) {
                    setApiError(err.response.data.message || "Email atau username sudah digunakan");
                } else if (err.response?.status === 400) {
                    setApiError(err.response.data.message || "Data yang dimasukkan tidak valid");
                } else {
                    setApiError("Terjadi kesalahan, silakan coba lagi");
                }
            } else {
                setApiError("Terjadi kesalahan, silakan coba lagi");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputClass = (hasError: boolean) => `w-full rounded-xl border py-3 pr-11 pl-11 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-1 ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-neutral-300 focus:border-primary-600 focus:ring-primary-600"}`;

    return (
        <main className="grid min-h-screen bg-white lg:grid-cols-[3fr_2fr]">
            <section className="relative hidden min-h-screen overflow-hidden border-r border-neutral-200 bg-[linear-gradient(180deg,#fff_0%,#edf6ff_100%)] px-10 py-10 lg:block xl:px-14">
                <Image src="/logo/logo.svg" alt="Otewe" width={160} height={48} priority className="relative z-10 h-auto w-36" />
                <div className="relative z-10 mt-18 max-w-md">
                    <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-black">Selamat datang di<br />otewe!</h1>
                    <p className="mt-4 max-w-sm text-base leading-relaxed text-neutral-600">Temukan rute transportasi terbaik untuk perjalananmu dengan mudah, cepat, dan hemat.</p>
                </div>
                <div className="pointer-events-none absolute top-[30%] right-0 left-0 h-[46%]"><Image src="/images/Login_Onboard.png" alt="Ilustrasi bus Otewe" fill priority className="object-contain object-center" sizes="60vw" /></div>
                <div className="absolute right-0 bottom-8 left-0 z-10 px-20">
                    <div className="relative mx-auto max-w-3xl rounded-2xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
                        <div className="h-48 overflow-hidden rounded-2xl"><ActiveSlide /></div>
                        <CarouselNavButton direction="previous" size="sm" onClick={() => moveSlide(-1)} className="absolute top-1/2 -left-9 -translate-y-1/2" />
                        <CarouselNavButton direction="next" size="sm" onClick={() => moveSlide(1)} className="absolute top-1/2 -right-9 -translate-y-1/2" />
                    </div>
                    <div className="mt-4 flex justify-center gap-3">{slides.map((_, index) => <button key={index} type="button" aria-label={`Pilih slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-2.5 w-2.5 rounded-full transition ${index === activeSlide ? "bg-primary-600" : "bg-neutral-300"}`} />)}</div>
                </div>
            </section>

            <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-18">
                <div className="w-full max-w-lg">
                    <Image src="/logo/logo.svg" alt="Otewe" width={160} height={48} priority className="mb-12 h-auto w-40 lg:hidden" />
                    <h2 className="text-2xl font-extrabold tracking-tight text-black">Siap buat Otewe?</h2>
                    <p className="mt-2 text-sm text-neutral-600">Daftar dan pilih transportasi yang pas buatmu.</p>
                    {apiError && <p role="alert" className="mt-8 text-sm text-red-600">{apiError}</p>}

                    <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
                        <div><label htmlFor="email" className="text-sm font-semibold text-black">Email</label><div className="relative mt-2"><HiOutlineEnvelope className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Masukkan email aktif" className={inputClass(submitted && !form.email)} /></div></div>
                        <div><label htmlFor="username" className="text-sm font-semibold text-black">Username</label><div className="relative mt-2"><HiOutlineUser className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="username" type="text" autoComplete="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} placeholder="Buat username" className={inputClass(submitted && !usernameValid)} /></div><p className={`mt-1 text-xs ${submitted && !usernameValid ? "text-red-600" : "text-neutral-400"}`}>{submitted && !usernameValid ? "*3-20 karakter, hanya huruf, angka, dan underscore" : "3-20 karakter, hanya huruf, angka, dan underscore"}</p></div>
                        <div><label htmlFor="password" className="text-sm font-semibold text-black">Kata Sandi</label><div className="relative mt-2"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Buat kata sandi" className={inputClass(submitted && !passwordValid)} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div><p className={`mt-1 text-xs ${submitted && !passwordValid ? "text-red-600" : "text-neutral-400"}`}>Minimal 8 karakter dengan kombinasi huruf dan angka</p></div>
                        <div><label htmlFor="confirmation" className="text-sm font-semibold text-black">Konfirmasi Kata Sandi</label><div className="relative mt-2"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" value={form.confirmation} onChange={(event) => updateField("confirmation", event.target.value)} placeholder="Ulangi kata sandi" className={inputClass(submitted && !confirmationValid)} /><button type="button" onClick={() => setShowConfirmation((current) => !current)} aria-label={showConfirmation ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showConfirmation ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div></div>
                        <div className="flex items-center gap-3 pt-2"><input id="terms" type="checkbox" checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer accent-primary-600" /><label htmlFor="terms" className="cursor-pointer text-sm text-neutral-700">Saya menyetujui <Link href="/syarat-ketentuan" className="font-medium text-primary-600">Syarat &amp; Ketentuan</Link> dan <Link href="/kebijakan-privasi" className="font-medium text-primary-600">Kebijakan Privasi</Link></label></div>
                        <button type="submit" disabled={!formValid || isSubmitting} className="w-full cursor-pointer rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:hover:bg-neutral-400 disabled:opacity-50">{isSubmitting ? "Memproses..." : "Daftar"}</button>
                    </form>
                    <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-neutral-400" /><span className="text-sm text-neutral-500">atau</span><span className="h-px flex-1 bg-neutral-400" /></div>
                    <button type="button" className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-neutral-300 py-3 text-sm font-medium text-black transition hover:bg-neutral-50"><FcGoogle className="h-5 w-5" />Daftar dengan akun Google</button>
                    <p className="mt-6 text-center text-sm text-neutral-500">Sudah memiliki akun? <Link href="/login" className="font-medium text-primary-600 underline">Masuk</Link></p>
                </div>
            </section>
        </main>
    );
}
