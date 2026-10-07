"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi2";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Alert from "@/components/ui/Alert";
import { AlertViewport } from "@/components/ui/AlertViewport";
import { getApiErrorMessage } from "@/lib/utils/apiError";
import { resolvePostLoginRedirect } from "@/lib/authRedirect";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLogin, setIsGoogleLogin] = useState(false);
    const [googleError, setGoogleError] = useState("");
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const [googleBtnWidth, setGoogleBtnWidth] = useState(240);
    const { login, googleLogin } = useAuth();
    const router = useRouter();
    const handleCloseGoogleError = useCallback(() => setGoogleError(""), []);

    useEffect(() => {
        const el = googleBtnRef.current;
        if (!el) return;
        const update = () => setGoogleBtnWidth(Math.min(400, Math.max(240, el.clientWidth)));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.identifier || !form.password) {
            setError("Email/username dan kata sandi wajib diisi");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            const user = await login(form);
            router.push(resolvePostLoginRedirect(user.role));
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) {
                    setError(err.response.data.message || "Email/username atau password salah");
                } else if (err.response?.status === 400) {
                    setError(getApiErrorMessage(err, "Data yang dimasukkan tidak valid"));
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

    async function handleGoogleLogin(credentialResponse: CredentialResponse) {
        try {
            setIsGoogleLogin(true);
            setGoogleError("");
            if (!credentialResponse.credential) {
                setGoogleError("Login dengan Google gagal. Silakan coba lagi.");
                return;
            }
            const credential = jwtDecode(credentialResponse.credential);
            const { email, name } = credential as { email: string; name: string };
            const user = await googleLogin(email, name);
            router.push(resolvePostLoginRedirect(user.role));
        } catch (err) {
            setGoogleError(err instanceof Error && err.message ? err.message : "Gagal login dengan Google. Silakan coba lagi.");
        } finally {
            setIsGoogleLogin(false);
        }
    }

    return (
        <>
            <AlertViewport>
                {googleError && <Alert status="error" title="Login Google Gagal" description={googleError} onClose={handleCloseGoogleError} />}
            </AlertViewport>

            <section className="flex items-center justify-center px-4 py-10 sm:px-12 lg:px-16 xl:px-18">
                <div className="w-full max-w-md">
                    <Link href="/">
                        <Image src="/logo/logo.svg" alt="Otewe" width={160} height={48} priority className="mb-8 h-auto w-32 lg:hidden cursor-pointer" />
                    </Link>
                    <h2 className="text-2xl font-extrabold tracking-tight text-black">Mau Otewe kemana?</h2>
                    <p className="mt-2 text-sm text-neutral-600">Ongkos, Transportasi, Waktu, kita cari yang pas!</p>
                    {error && <p role="alert" className="mt-6 text-sm text-red-600">{error}</p>}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div><label htmlFor="identifier" className="text-sm font-semibold text-black">Email atau username</label><div className="relative mt-2"><HiOutlineUser className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="identifier" type="text" autoComplete="username" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder="Masukkan email atau username" className="w-full rounded-xl border border-neutral-300 py-3 pr-4 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600" /></div></div>
                        <div><label htmlFor="password" className="text-sm font-semibold text-black">Kata Sandi</label><div className="relative mt-2"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Masukkan kata sandi" className="w-full rounded-xl border border-neutral-300 py-3 pr-11 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div></div>
                        <div className="flex justify-end"><Link href="/lupa-password" className="text-sm font-medium text-primary-600 hover:underline">Lupa kata sandi?</Link></div>
                        <button type="submit" disabled={isSubmitting} className="w-full cursor-pointer rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "Memproses..." : "Masuk"}</button>
                    </form>
                    <div className="my-5 flex items-center gap-4"><span className="h-px flex-1 bg-neutral-400" /><span className="text-sm text-neutral-500">atau</span><span className="h-px flex-1 bg-neutral-400" /></div>
                    <div ref={googleBtnRef} className="flex w-full justify-center min-w-0">
                        {!isGoogleLogin ? (
                            <GoogleLogin
                                onSuccess={handleGoogleLogin}
                                onError={() => setGoogleError("Login dengan Google dibatalkan. Silakan coba lagi.")}
                                theme="outline"
                                shape="pill"
                                size="large"
                                text="signin_with"
                                width={googleBtnWidth}
                            />
                        ) : (
                            <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-400">
                                <span>Memproses...</span>
                            </div>
                        )}
                    </div>
                    <p className="mt-5 text-center text-sm text-neutral-500">Belum memiliki akun? <Link href="/register" className="font-medium text-primary-600 underline">Daftar</Link></p>
                </div>
            </section>
        </>
    );
}