"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { HiOutlineEnvelope, HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi2";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Alert from "@/components/ui/Alert";
import { AlertViewport } from "@/components/ui/AlertViewport";
import { getApiErrorMessage } from "@/lib/utils/apiError";

const usernamePattern = /^[A-Za-z0-9_]{3,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [apiError, setApiError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLogin, setIsGoogleLogin] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [googleError, setGoogleError] = useState("");
    const [form, setForm] = useState({ email: "", username: "", password: "", confirmation: "" });
    const { register: registerUser, googleLogin } = useAuth();
    const router = useRouter();
    const handleCloseGoogleError = useCallback(() => setGoogleError(""), []);
    // Dipanggil Alert setelah animasi keluarnya selesai (atau saat user menutupnya manual).
    const handleRegisterAlertClosed = useCallback(() => router.push("/login"), [router]);
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const [googleBtnWidth, setGoogleBtnWidth] = useState(240);
    const usernameValid = usernamePattern.test(form.username);
    const emailValid = emailPattern.test(form.email);
    const passwordValid = passwordPattern.test(form.password);
    const confirmationValid = form.confirmation === form.password && form.confirmation.length > 0;
    const formValid = emailValid && usernameValid && passwordValid && confirmationValid && agreedToTerms;

    useEffect(() => {
        const el = googleBtnRef.current;
        if (!el) return;
        const update = () => setGoogleBtnWidth(Math.min(400, Math.max(240, el.clientWidth)));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    function updateField(field: keyof typeof form, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isRegistered) return;
        setSubmitted(true);
        if (!formValid) return;

        setApiError("");
        setIsSubmitting(true);

        try {
            await registerUser({ email: form.email, username: form.username, password: form.password });
            setIsRegistered(true);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 409) {
                    setApiError(err.response.data.message || "Email atau username sudah digunakan");
                } else if (err.response?.status === 400) {
                    setApiError(getApiErrorMessage(err, "Data yang dimasukkan tidak valid"));
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
            await googleLogin(email, name);
            router.push('/beranda');
        } catch (err) {
            setGoogleError(err instanceof Error && err.message ? err.message : "Gagal login dengan Google. Silakan coba lagi.");
        } finally {
            setIsGoogleLogin(false);
        }
    }

    const inputClass = (hasError: boolean) => `w-full rounded-xl border py-3 pr-11 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-1 ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-neutral-300 focus:border-primary-600 focus:ring-primary-600"}`;

    return (
        <>
            <AlertViewport>
                {googleError && <Alert status="error" title="Login Google Gagal" description={googleError} onClose={handleCloseGoogleError} />}
                {isRegistered && (
                    <Alert
                        status="success"
                        title="Akun berhasil dibuat"
                        description="Yuk, masuk untuk mulai menggunakan Otewe."
                        autoDismissMs={3000}
                        onClose={handleRegisterAlertClosed}
                    />
                )}
            </AlertViewport>
            <section className="flex items-center justify-center px-4 py-10 sm:px-12 lg:px-16 xl:px-18">
                <div className="w-full max-w-md">
                    <Link href="/">
                        <Image src="/logo/logo.svg" alt="Otewe" width={160} height={48} priority className="mb-8 h-auto w-32 lg:hidden cursor-pointer" />
                    </Link>
                    <h2 className="text-2xl font-extrabold tracking-tight text-black">Siap buat Otewe?</h2>
                    <p className="mt-2 text-sm text-neutral-600">Daftar dan pilih transportasi yang pas buatmu.</p>
                    {apiError && <p role="alert" className="mt-6 text-sm text-red-600">{apiError}</p>}

                    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
                        <div><label htmlFor="email" className="text-sm font-semibold text-black">Email</label><div className="relative mt-2"><HiOutlineEnvelope className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Masukkan email aktif" className={inputClass(submitted && !emailValid)} /></div><p className={`mt-1 text-xs ${submitted && !emailValid ? "text-red-600" : "text-neutral-400"}`}>{submitted && !form.email ? "*Email wajib diisi" : submitted && !emailValid ? "*Format email tidak valid, contoh: nama@email.com" : "Gunakan email aktif yang bisa dihubungi"}</p></div>
                        <div><label htmlFor="username" className="text-sm font-semibold text-black">Username</label><div className="relative mt-2"><HiOutlineUser className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="username" type="text" autoComplete="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} placeholder="Buat username" className={inputClass(submitted && !usernameValid)} /></div><p className={`mt-1 text-xs ${submitted && !usernameValid ? "text-red-600" : "text-neutral-400"}`}>{submitted && !usernameValid ? "*3-20 karakter, hanya huruf, angka, dan underscore" : "3-20 karakter, hanya huruf, angka, dan underscore"}</p></div>
                        <div><label htmlFor="password" className="text-sm font-semibold text-black">Kata Sandi</label><div className="relative mt-2"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Buat kata sandi" className={inputClass(submitted && !passwordValid)} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div><p className={`mt-1 text-xs ${submitted && !passwordValid ? "text-red-600" : "text-neutral-400"}`}>Minimal 8 karakter dengan kombinasi huruf dan angka</p></div>
                        <div><label htmlFor="confirmation" className="text-sm font-semibold text-black">Konfirmasi Kata Sandi</label><div className="relative mt-2"><HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input id="confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" value={form.confirmation} onChange={(event) => updateField("confirmation", event.target.value)} placeholder="Ulangi kata sandi" className={inputClass(submitted && !confirmationValid)} /><button type="button" onClick={() => setShowConfirmation((current) => !current)} aria-label={showConfirmation ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">{showConfirmation ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}</button></div></div>
                        <div className="flex items-start gap-3 pt-2"><input id="terms" type="checkbox" checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer accent-primary-600 mt-0.5" /><label htmlFor="terms" className="cursor-pointer text-sm text-neutral-700 leading-snug">Saya menyetujui <Link href="/syarat-ketentuan" className="font-medium text-primary-600">Syarat &amp; Ketentuan</Link> dan <Link href="/kebijakan-privasi" className="font-medium text-primary-600">Kebijakan Privasi</Link></label></div>
                        <button type="submit" disabled={!formValid || isSubmitting || isRegistered} className="w-full cursor-pointer rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:hover:bg-neutral-400 disabled:opacity-50">{isSubmitting ? "Memproses..." : isRegistered ? "Berhasil" : "Daftar"}</button>
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
                                text="signup_with"
                                width={googleBtnWidth}
                            />
                        ) : (
                            <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-400">
                                <span>Memproses...</span>
                            </div>
                        )}
                    </div>
                    <p className="mt-5 text-center text-sm text-neutral-500">Sudah memiliki akun? <Link href="/login" className="font-medium text-primary-600 underline">Masuk</Link></p>
                </div>
            </section>
        </>
    );
}