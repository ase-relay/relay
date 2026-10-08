'use client';

import { FormEvent, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/ui/Alert';
import { AlertViewport } from '@/components/ui/AlertViewport';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/Skeleton';
import EditIcon from '@/components/icons/common/EditIcon';
import EmailIcon from '@/components/icons/common/EmailIcon';
import PadlockIcon from '@/components/icons/common/PadlockIcon';
import TrashIcon from '@/components/icons/common/TrashIcon';
import UserIcon from '@/components/icons/common/UserIcon';
import { StatusIcon } from '@/components/icons/status/StatusIcon';
import {
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiXMark,
} from 'react-icons/hi2';
import { updateProfile, changePassword, deleteAccount } from '@/lib/api';

const usernamePattern = /^[A-Za-z0-9_]{3,30}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
// Harus sama dengan class `duration-500` pada wrapper panel kata sandi di bawah
const PASSWORD_PANEL_MS = 500;
// Animasi baris profil (mis. field username membuka form edit)
const ROW_ANIMATION_MS = 400;
const ROW_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function IconButton({ children, className = '', ...props }: React.ComponentProps<'button'>) {
    return (
        <button
            type="button"
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] px-4 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-60 min-h-11 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

function IconWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <span className={className}>{children}</span>;
}

export default function ProfilPage() {
    const { user, checkingAuth, setUser, logout } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [editingUsername, setEditingUsername] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [usernameSubmitted, setUsernameSubmitted] = useState(false);
    const [isSavingUsername, setIsSavingUsername] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const [usernameError, setUsernameError] = useState('');
    const [passwords, setPasswords] = useState({ current: '', next: '', confirmation: '' });
    const [passwordSubmitted, setPasswordSubmitted] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [shownPasswords, setShownPasswords] = useState<Record<string, boolean>>({});
    const [alert, setAlert] = useState<{ title: string; description: string; status?: 'success' | 'error' } | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleCloseAlert = useCallback(() => setAlert(null), []);

    // Panel tetap ter-render selama animasi tutup berjalan, baru di-unmount setelah selesai
    const [passwordPanelMounted, setPasswordPanelMounted] = useState(false);

    useEffect(() => {
        if (changingPassword) return;
        const timer = setTimeout(() => setPasswordPanelMounted(false), PASSWORD_PANEL_MS);
        return () => clearTimeout(timer);
    }, [changingPassword]);

    // Animasi tinggi: kartu profil (yang ikut meregang) dan kartu "Hapus Akun" bergeser mulus
    const layoutRef = useRef<HTMLDivElement>(null);
    const profileCardRef = useRef<HTMLElement>(null);
    const layoutFromHeightRef = useRef<number | null>(null);
    const layoutHeightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function captureLayoutHeight() {
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
        layoutFromHeightRef.current = isDesktop ? (layoutRef.current?.offsetHeight ?? null) : null;
    }

    useIsoLayoutEffect(() => {
        const layout = layoutRef.current;
        const from = layoutFromHeightRef.current;
        layoutFromHeightRef.current = null;
        if (!layout || from === null) return;

        if (layoutHeightTimerRef.current) clearTimeout(layoutHeightTimerRef.current);
        layout.style.height = '';

        let to: number;
        if (changingPassword) {
            to = layout.offsetHeight;
        } else {
            const profile = profileCardRef.current;
            if (!profile) return;
            profile.style.alignSelf = 'start';
            to = profile.offsetHeight;
            profile.style.alignSelf = '';
        }
        if (Math.abs(from - to) < 1) return;

        layout.style.height = `${from}px`;
        void layout.offsetHeight;
        layout.style.height = `${to}px`;
        layoutHeightTimerRef.current = setTimeout(() => {
            layout.style.height = '';
        }, PASSWORD_PANEL_MS);
    }, [changingPassword]);

    // Animasi baris profil: tinggi kartu tumbuh/menyusut mulus, baris di bawahnya ikut bergeser
    const rowsRef = useRef<HTMLDivElement>(null);
    const passwordRowRef = useRef<HTMLDivElement>(null);
    const rowsFromHeightRef = useRef<number | null>(null);
    const rowAnimationsRef = useRef<Animation[]>([]);

    function captureRowsHeight() {
        rowsFromHeightRef.current = rowsRef.current?.offsetHeight ?? null;
    }

    useIsoLayoutEffect(() => {
        const rows = rowsRef.current;
        const from = rowsFromHeightRef.current;
        rowsFromHeightRef.current = null;
        if (!rows || from === null) return;

        rowAnimationsRef.current.forEach((animation) => animation.cancel());
        rowAnimationsRef.current = [];
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const to = rows.offsetHeight;
        const delta = to - from;
        if (Math.abs(delta) < 1) return;

        const options: KeyframeAnimationOptions = { duration: ROW_ANIMATION_MS, easing: ROW_EASING };
        const animations = [rows.animate([{ height: `${from}px` }, { height: `${to}px` }], options)];
        Array.from(passwordRowRef.current?.children ?? []).forEach((child) => {
            animations.push(child.animate([{ transform: `translateY(${-delta}px)` }, { transform: 'translateY(0)' }], options));
        });
        rowAnimationsRef.current = animations;
    }, [editingUsername]);

    function beginPasswordChange() {
        if (editingUsername) captureRowsHeight();
        captureLayoutHeight();
        setEditingUsername(false);
        setPasswordSubmitted(false);
        setPasswordPanelMounted(true);
        setChangingPassword(true);
    }

    function closePasswordPanel() {
        captureLayoutHeight();
        setChangingPassword(false);
    }

    const usernameValid = usernamePattern.test(username);
    const passwordValid = passwordPattern.test(passwords.next);
    const passwordsMatch = passwords.next === passwords.confirmation && passwords.confirmation.length > 0;

    function beginUsernameEdit() {
        captureRowsHeight();
        if (changingPassword) closePasswordPanel();
        setUsername(user?.username ?? '');
        setUsernameSubmitted(false);
        setEditingUsername(true);
    }

    async function saveUsername(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setUsernameSubmitted(true);
        setUsernameError('');

        if (!usernameValid) {
            return;
        }

        setIsSavingUsername(true);
        try {
            const updatedUser = await updateProfile({ username });
            setUser(updatedUser);
            captureRowsHeight();
            setEditingUsername(false);
            setAlert({ title: 'Username Berhasil Diubah!', description: 'Username kamu berhasil diperbarui' });
        } catch (error: any) {
            if (error.response?.data?.message) {
                setUsernameError(error.response.data.message);
            } else {
                setUsernameError('Terjadi kesalahan, silakan coba lagi');
            }
        } finally {
            setIsSavingUsername(false);
        }
    }

    async function savePassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPasswordSubmitted(true);
        setPasswordError('');

        if (!passwords.current || !passwordValid || !passwordsMatch) {
            return;
        }

        setIsSavingPassword(true);
        try {
            await changePassword({ oldPassword: passwords.current, newPassword: passwords.next });
            closePasswordPanel();
            setPasswords({ current: '', next: '', confirmation: '' });
            setAlert({ title: 'Kata Sandi Berhasil Diubah!', description: 'Kata sandi kamu berhasil diperbarui' });
        } catch (error: any) {
            setPasswordError(error.message || 'Terjadi kesalahan, silakan coba lagi');
        } finally {
            setIsSavingPassword(false);
        }
    }

    async function handleConfirmDeleteAccount() {
        if (isDeletingAccount) return;
        setIsDeletingAccount(true);
        try {
            await deleteAccount();
            setConfirmDeleteOpen(false);
            logout();
            router.replace('/login');
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } }; message?: string };
            const message = apiError.response?.data?.message || apiError.message || 'Gagal menghapus akun, silakan coba lagi';
            setConfirmDeleteOpen(false);
            setAlert({ title: 'Gagal Menghapus Akun', description: message, status: 'error' });
        } finally {
            setIsDeletingAccount(false);
        }
    }

    const profileRows = !mounted || checkingAuth ? (
        <div className="space-y-4 sm:grid sm:grid-cols-[minmax(120px,.8fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:gap-y-0">
            <div className="sm:contents">
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><EmailIcon /></IconWrapper>Email</p>
                <Skeleton variant="text" className="py-3 h-6 w-full sm:w-64 sm:py-3" />
                <div className="py-4 sm:py-8 flex items-center justify-end sm:hidden"><span aria-hidden="true" /></div>
            </div>

            <div className="sm:contents">
                <div className="border-t border-neutral-300 sm:col-span-full" />
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><UserIcon /></IconWrapper>Username</p>
                <Skeleton variant="text" className="py-3 h-6 w-full sm:w-48 sm:py-3" />
                <div className="py-4 sm:py-8 flex items-center justify-end">
                    <Skeleton variant="rounded" className="h-9 w-20 sm:h-10" />
                </div>
            </div>

            <div className="sm:contents">
                <div className="border-t border-neutral-300 sm:col-span-full" />
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><PadlockIcon /></IconWrapper>Kata Sandi</p>
                <Skeleton variant="text" className="py-3 h-6 w-full sm:w-32 sm:py-3" />
                <div className="py-4 sm:py-8 flex items-center justify-end">
                    <Skeleton variant="rounded" className="h-9 w-20 sm:h-10" />
                </div>
            </div>
        </div>
    ) : (
        <div className="space-y-4 sm:grid sm:grid-cols-[minmax(120px,.8fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:gap-y-0">
            <div className="sm:contents">
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><EmailIcon /></IconWrapper>Email</p>
                <p className="py-4 sm:py-8 text-sm sm:text-base font-semibold text-neutral-900">{user?.email ?? '—'}</p>
                <div className="py-4 sm:py-8 flex items-center justify-end sm:hidden"><span aria-hidden="true" /></div>
            </div>

            <div className="sm:contents">
                <div className="border-t border-neutral-300 sm:col-span-full" />
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><UserIcon /></IconWrapper>Username</p>
                {editingUsername ? (
                    <form onSubmit={saveUsername} className="space-y-3 sm:contents">
                        <div className="animate-fadeIn w-full sm:max-w-106.25 sm:py-8">
                            <input
                                aria-label="Username baru"
                                autoComplete="username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="Masukkan username baru"
                                className={`w-full rounded-[20px] border bg-white px-4 py-3 sm:px-5 sm:py-3.5 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 ${usernameSubmitted && !usernameValid ? 'border-red-500' : 'border-neutral-300'}`}
                            />
                            <p className={`mt-2 text-xs ${usernameSubmitted && !usernameValid ? 'text-red-600' : 'text-neutral-400'}`}>3-30 karakter, hanya huruf, angka, dan underscore</p>
                            {usernameError && <p className="mt-2 text-xs text-red-600">{usernameError}</p>}
                        </div>
                        <div className="animate-fadeIn w-full sm:py-8 flex justify-end sm:justify-end">
                            <IconButton type="submit" disabled={isSavingUsername} className="w-full sm:w-auto bg-primary-600">{isSavingUsername ? 'Menyimpan...' : 'Simpan'}</IconButton>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className="py-4 sm:py-8 text-sm sm:text-base font-semibold text-neutral-900">{user?.username ?? '—'}</p>
                        <div className="py-4 sm:py-8 flex items-center justify-end">
                            <IconButton onClick={beginUsernameEdit} className="bg-primary-600"><IconWrapper className="h-4 w-4 sm:h-5 sm:w-5"><EditIcon /></IconWrapper>Ubah</IconButton>
                        </div>
                    </>
                )}
            </div>

            <div ref={passwordRowRef} className="sm:contents">
                <div className="border-t border-neutral-300 sm:col-span-full" />
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><PadlockIcon /></IconWrapper>Kata Sandi</p>
                <p className="py-4 sm:py-8 text-sm sm:text-base font-semibold tracking-[0.22em] text-neutral-950">••••••••</p>
                <div className="py-4 sm:py-8 flex items-center justify-end">
                    <IconButton onClick={beginPasswordChange} aria-expanded={changingPassword} className="bg-primary-600"><IconWrapper className="h-4 w-4 sm:h-5 sm:w-5"><EditIcon /></IconWrapper>Ubah</IconButton>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col text-neutral-900">
            <Navbar />
            <AlertViewport>
                {alert && <Alert status={alert.status ?? 'success'} title={alert.title} description={alert.description} onClose={handleCloseAlert} autoDismissMs={3000} />}
            </AlertViewport>
            <main className="mx-auto w-full max-w-292.5 flex-1 px-4 py-6 sm:py-8 sm:px-8 lg:py-12 xl:px-0">
                <div
                    ref={layoutRef}
                    className={`grid grid-cols-1 transition-[grid-template-columns,grid-template-rows,gap,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:grid-rows-1 ${
                        changingPassword
                            ? 'grid-rows-[auto_1fr] gap-6 lg:grid-cols-[minmax(0,1fr)_.82fr] lg:gap-7'
                            : 'grid-rows-[auto_0fr] gap-0 lg:grid-cols-[minmax(0,1fr)_0fr] lg:gap-0'
                    }`}
                >
                    <section ref={profileCardRef} className="rounded-[20px] border border-neutral-200 bg-white px-5 pt-6 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black">Informasi Profil</h1>
                        <div ref={rowsRef} className="mt-6">{profileRows}</div>
                    </section>

                    <div
                        aria-hidden={!changingPassword}
                        className={`-mx-3 -mb-6 min-h-0 min-w-0 overflow-hidden px-3 pb-6 transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:mx-0 lg:mb-0 lg:overflow-visible lg:px-0 lg:pb-0 ${
                            changingPassword
                                ? 'translate-x-0 translate-y-0 opacity-100'
                                : 'pointer-events-none translate-y-4 opacity-0 lg:translate-x-12 lg:translate-y-0'
                        }`}
                    >
                        {passwordPanelMounted && (
                            <section className="rounded-[20px] border border-neutral-200 bg-white px-5 py-6 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-8 sm:py-8 lg:h-full lg:min-w-105 lg:overflow-hidden lg:px-12 lg:py-10">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-black">Ubah Kata Sandi</h2>
                                    <button type="button" onClick={closePasswordPanel} aria-label="Tutup form ubah kata sandi" className="cursor-pointer text-neutral-900 p-2 -ml-2 -mt-2"><HiXMark className="h-6 w-6 sm:h-7 sm:w-7" /></button>
                                </div>
                                <form onSubmit={savePassword} className="space-y-5 sm:space-y-6 sm:mt-9">
                                    <PasswordInput label="Kata Sandi Saat Ini" name="current" placeholder="Masukkan kata sandi saat ini" value={passwords.current} shown={shownPasswords.current} onToggle={() => setShownPasswords((value) => ({ ...value, current: !value.current }))} onChange={(value) => setPasswords((state) => ({ ...state, current: value }))} error={passwordSubmitted && !passwords.current} />
                                    <PasswordInput label="Kata Sandi Baru" name="next" placeholder="Buat kata sandi" value={passwords.next} shown={shownPasswords.next} onToggle={() => setShownPasswords((value) => ({ ...value, next: !value.next }))} onChange={(value) => setPasswords((state) => ({ ...state, next: value }))} help="Minimal 8 karakter dengan kombinasi huruf dan angka" error={passwordSubmitted && !passwordValid} />
                                    <PasswordInput label="Konfirmasi Kata Sandi Baru" name="confirmation" placeholder="Ulangi kata sandi" value={passwords.confirmation} shown={shownPasswords.confirmation} onToggle={() => setShownPasswords((value) => ({ ...value, confirmation: !value.confirmation }))} onChange={(value) => setPasswords((state) => ({ ...state, confirmation: value }))} error={passwordSubmitted && !passwordsMatch} />
                                    {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                                    <IconButton type="submit" disabled={isSavingPassword} className="w-full sm:w-auto bg-primary-600">{isSavingPassword ? 'Menyimpan...' : 'Simpan Perubahan'}</IconButton>
                                </form>
                            </section>
                        )}
                    </div>
                </div>

                {/* Hapus akun disembunyikan untuk admin: menghapus satu-satunya
                    akun admin akan mengunci seluruh panel admin (backend tidak
                    mencegahnya), jadi aksi ini tidak ditawarkan di UI. */}
                {user?.role !== 'ADMIN' && (
                <section className="mt-6 rounded-[20px] border border-neutral-200 bg-white px-5 py-6 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-red-600"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><StatusIcon type="info" color="var(--color-status-error)" /></IconWrapper>Hapus Akun</h2>
                            <p className="mt-3 text-sm sm:text-base text-neutral-400">Jika kamu tidak lagi menggunakan akun ini, kamu dapat menghapus akun secara permanen.</p>
                        </div>
                        <IconButton onClick={() => setConfirmDeleteOpen(true)} className="w-full sm:w-auto shrink-0 bg-red-600"><IconWrapper className="h-4 w-4 sm:h-5 sm:w-5"><TrashIcon /></IconWrapper>Hapus Akun</IconButton>
                    </div>
                </section>
                )}
            </main>
            <Footer />

            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onCancel={() => !isDeletingAccount && setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDeleteAccount}
                isLoading={isDeletingAccount}
            />
        </div>
    );
}

function PasswordInput({ label, name, placeholder, value, shown, onToggle, onChange, help, error }: { label: string; name: string; placeholder: string; value: string; shown: boolean; onToggle: () => void; onChange: (value: string) => void; help?: string; error: boolean }) {
    return (
        <div>
            <label htmlFor={name} className="text-sm sm:text-base font-semibold text-neutral-900">{label}</label>
            <div className="relative mt-2 sm:mt-3">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"><IconWrapper className="h-5 w-5"><PadlockIcon /></IconWrapper></span>
                <input
                    id={name}
                    type={shown ? 'text' : 'password'}
                    autoComplete={name === 'current' ? 'current-password' : 'new-password'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className={`w-full rounded-[20px] border bg-white py-3 sm:py-3.5 pr-11 pl-12 text-base outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 ${error ? 'border-red-500' : 'border-neutral-300'}`}
                />
                <button type="button" onClick={onToggle} aria-label={shown ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">
                    {shown ? <HiOutlineEyeSlash className="h-5 w-5 sm:h-6 sm:w-6" /> : <HiOutlineEye className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
            </div>
            {help && <p className={`mt-2 text-xs ${error ? 'text-red-600' : 'text-neutral-400'}`}>{help}</p>}
        </div>
    );
}