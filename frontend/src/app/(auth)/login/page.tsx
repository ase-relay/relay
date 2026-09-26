"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi2";
import axios from "axios";
import { AuthSlideBudget } from "@/components/auth/AuthSlideBudget";
import { AuthSlideRoute } from "@/components/auth/AuthSlideRoute";
import { AuthSlideTransport } from "@/components/auth/AuthSlideTransport";
import { CarouselNavButton } from "@/components/ui/CarouselNavButton";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Alert from "@/components/ui/Alert";

const slides = [AuthSlideBudget, AuthSlideTransport, AuthSlideRoute];

export default function LoginPage() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLogin, setIsGoogleLogin] = useState(false);
    const [googleError, setGoogleError] = useState("");
    const { login, googleLogin } = useAuth();
    const router = useRouter();
    const ActiveSlide = slides[activeSlide];

    function moveSlide(direction: number) {
        setActiveSlide((current) => (current + direction + slides.length) % slides.length);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.identifier || !form.password) {
            setError("Email/username dan kata sandi wajib diisi");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            await login(form);
            router.push('/beranda');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) {
                    setError(err.response.data.message || "Email/username atau password salah");
                } else if (err.response?.status === 400) {
                    setError(err.response.data.message || "Data yang dimasukkan tidak valid");
                } else {
                    setError("Terjadi kesalahan, silakan coba lagi");
                }
            } else {
                setError("Terjadi kesalahan, silakan coba lagi");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleGoogleLogin(credentialResponse: any) {
        try {
            setIsGoogleLogin(true);
            setGoogleError("");
            const credential = jwtDecode(credentialResponse.credential);
            const { email, name } = credential as { email: string; name: string };
            await googleLogin(email, name);
            router.push('/beranda');
        } catch (err: any) {
            setGoogleError(err.message || "Gagal login dengan Google. Silakan coba lagi.");
        } finally {
            setIsGoogleLogin(false);
        }
    }

    return (
        <main className="grid min-h-screen bg-white lg:grid-cols-[3fr_2fr]">
            <section className="relative hidden min-h-screen overflow-hidden border-r border-neutral-200 bg-[linear-gradient(180deg,#fff_0%,#edf6ff_100%)] px-10 py-10 lg:block xl:px-14">
                <Image src="/logo/logo.svg" alt="Otewe" width={160} height={48} priority className="relative z-10 h-auto w-36" />
                <div className="relative z-10 mt-18 max-w-md">
                    <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-black">Selamat datang di<br />otewe!</h1>
                    <p className="mt-4 max-w-sm text-base leading-relaxed text-neutral-600">Temukan rute transportasi terbaik untuk perjalananmu dengan mudah, cepat, dan hemat.</p>
                </div>
                <div className="pointer-events-none absolute top-[30%] right-0 left-0 h-[46%]">
                    <Image src="/images/Login_Onboard.png" alt="Ilustrasi bus Otewe" fill priority className="object-contain object-center" sizes="60vw" />
                </div>

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
                    <h2 className="text-2xl font-extrabold tracking-tight text-black">Mau Otewe kemana?</h2>
                    <p className="mt-2 text-sm text-neutral-600">Ongkos, Transportasi, Waktu, kita cari yang pas!</p>
                    {error && <p role="alert" className="mt-8 text-sm text-red-600">{error}</p>}
                    {googleError && <Alert status="error" title="Login Google Gagal" description={googleError} onClose={() => setGoogleError("")} className="mt-8" />}

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                        <div><label htmlFor="identifier" className="text-sm font-semibold text-black">Email atau username</label><div className="relative mt-2"><HiOutlineUser className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="identifier" type="text" autoComplete="username" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder="Masukkan email atau username" className="w-full rounded-xl border border-neutral-300 py-3 pr-4 pl-11 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600" /></div></div>
                        <div><label htmlFor="password" className="text-sm font-semibold text-black">Kata Sandi</label><div className="relative mt-2"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Masukkan kata sandi" className="w-full rounded-xl border border-neutral-300 py-3 pr-11 pl-11 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div></div>
                        <div className="flex justify-end"><Link href="/lupa-password" className="text-sm font-medium text-primary-600 hover:underline">Lupa kata sandi?</Link></div>
                        <button type="submit" disabled={isSubmitting} className="w-full cursor-pointer rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "Memproses..." : "Masuk"}</button>
                    </form>
                    <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-neutral-400" /><span className="text-sm text-neutral-500">atau</span><span className="h-px flex-1 bg-neutral-400" /></div>
                    <div className="flex items-center justify-center">
                        {!isGoogleLogin ? (
                            <GoogleLogin
                                onSuccess={handleGoogleLogin}
                                onError={() => setGoogleError("Login dengan Google dibatalkan. Silakan coba lagi.")}
                                theme="outline"
                                shape="pill"
                                size="large"
                                text="signin_with"
                                width="400"
                            />
                        ) : (
                            <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-400">
                                <span>Memproses...</span>
                            </div>
                        )}
                    </div>
                    <p className="mt-6 text-center text-sm text-neutral-500">Belum memiliki akun? <Link href="/register" className="font-medium text-primary-600 underline">Daftar</Link></p>
                </div>
            </section>
        </main>
    );
}
