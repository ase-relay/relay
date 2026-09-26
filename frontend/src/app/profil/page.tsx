'use client';

import { FormEvent, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/ui/Alert';
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

const usernamePattern = /^[A-Za-z0-9_]{3,20}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function IconButton({ children, className = '', ...props }: React.ComponentProps<'button'>) {
    return (
        <button
            type="button"
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] px-4 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px] ${className}`}
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
    const { user, checkingAuth } = useAuth();
    const [editingUsername, setEditingUsername] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [usernameSubmitted, setUsernameSubmitted] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', next: '', confirmation: '' });
    const [passwordSubmitted, setPasswordSubmitted] = useState(false);
    const [shownPasswords, setShownPasswords] = useState<Record<string, boolean>>({});
    const [alert, setAlert] = useState<{ title: string; description: string } | null>(null);

    const usernameValid = usernamePattern.test(username);
    const passwordValid = passwordPattern.test(passwords.next);
    const passwordsMatch = passwords.next === passwords.confirmation && passwords.confirmation.length > 0;

    function beginUsernameEdit() {
        setChangingPassword(false);
        setUsername(user?.username ?? '');
        setUsernameSubmitted(false);
        setEditingUsername(true);
    }

    function saveUsername(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setUsernameSubmitted(true);
        if (usernameValid) {
            setEditingUsername(false);
            setAlert({ title: 'Username Berhasil Diubah!', description: 'Username kamu berhasil diperbarui' });
        }
    }

    function savePassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPasswordSubmitted(true);
        if (passwords.current && passwordValid && passwordsMatch) {
            setChangingPassword(false);
            setPasswords({ current: '', next: '', confirmation: '' });
            setAlert({ title: 'Kata Sandi Berhasil Diubah!', description: 'Kata sandi kamu berhasil diperbarui' });
        }
    }

    const profileRows = checkingAuth ? (
        <div className="space-y-4 sm:grid sm:grid-cols-[minmax(120px,.8fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:gap-y-0">
            <div className="sm:contents">
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><EmailIcon /></IconWrapper>Email</p>
                <Skeleton variant="text" className="py-3 h-6 w-full sm:w-64 sm:py-8" />
                <div className="py-4 sm:py-8 flex items-center justify-end sm:hidden"><span aria-hidden="true" /></div>
            </div>

            <div className="sm:contents">
                <div className="border-t border-neutral-300 sm:col-span-full" />
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><UserIcon /></IconWrapper>Username</p>
                <Skeleton variant="text" className="py-3 h-6 w-full sm:w-48 sm:py-8" />
                <div className="py-4 sm:py-8 flex items-center justify-end">
                    <Skeleton variant="rounded" className="h-9 w-20 sm:h-10" />
                </div>
            </div>

            <div className="sm:contents">
                <div className="border-t border-neutral-300 sm:col-span-full" />
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><PadlockIcon /></IconWrapper>Kata Sandi</p>
                <Skeleton variant="text" className="py-3 h-6 w-full sm:w-32 sm:py-8" />
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
                        <div className="w-full sm:max-w-[425px] sm:py-8">
                            <input
                                aria-label="Username baru"
                                autoComplete="username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="Masukkan username baru"
                                className={`w-full rounded-[20px] border bg-white px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 ${usernameSubmitted && !usernameValid ? 'border-red-500' : 'border-neutral-300'}`}
                            />
                            <p className={`mt-2 text-xs ${usernameSubmitted && !usernameValid ? 'text-red-600' : 'text-neutral-400'}`}>3-20 karakter, hanya huruf, angka, dan underscore</p>
                        </div>
                        <div className="w-full sm:py-8 flex justify-end sm:justify-end">
                            <IconButton type="submit" className="w-full sm:w-auto bg-primary-600">Simpan</IconButton>
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

            <div className="sm:contents">
                <div className="border-t border-neutral-300 sm:col-span-full" />
                <p className="py-4 sm:py-8 flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-neutral-400"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><PadlockIcon /></IconWrapper>Kata Sandi</p>
                <p className="py-4 sm:py-8 text-sm sm:text-base font-semibold tracking-[0.22em] text-neutral-950">••••••••</p>
                <div className="py-4 sm:py-8 flex items-center justify-end">
                    <IconButton onClick={() => { setEditingUsername(false); setChangingPassword(true); setPasswordSubmitted(false); }} className="bg-primary-600"><IconWrapper className="h-4 w-4 sm:h-5 sm:w-5"><EditIcon /></IconWrapper>Ubah</IconButton>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col text-neutral-900">
            <Navbar />
            {alert && <Alert status="success" title={alert.title} description={alert.description} onClose={() => setAlert(null)} autoDismissMs={3000} className="fixed top-28 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 shadow-[0_10px_25px_rgba(15,23,42,0.14)] sm:top-30" />}
            <main className="mx-auto w-full max-w-292.5 flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:py-12">
                <div className={`space-y-6 ${changingPassword ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(480px,.82fr)] lg:gap-7 lg:space-y-0' : ''}`}>
                    <section className="rounded-[20px] border border-neutral-200 bg-white px-5 py-6 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black">Informasi Profil</h1>
                        <div className="mt-6">{profileRows}</div>
                    </section>

                    {changingPassword && (
                        <section className="rounded-[20px] border border-neutral-200 bg-white px-5 py-6 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-black">Ubah Kata Sandi</h2>
                                <button type="button" onClick={() => setChangingPassword(false)} aria-label="Tutup form ubah kata sandi" className="cursor-pointer text-neutral-900 p-2 -ml-2 -mt-2"><HiXMark className="h-6 w-6 sm:h-7 sm:w-7" /></button>
                            </div>
                            <form onSubmit={savePassword} className="space-y-5 sm:space-y-6 sm:mt-9">
                                <PasswordInput label="Kata Sandi Saat Ini" name="current" placeholder="Masukkan kata sandi saat ini" value={passwords.current} shown={shownPasswords.current} onToggle={() => setShownPasswords((value) => ({ ...value, current: !value.current }))} onChange={(value) => setPasswords((state) => ({ ...state, current: value }))} error={passwordSubmitted && !passwords.current} />
                                <PasswordInput label="Kata Sandi Baru" name="next" placeholder="Buat kata sandi" value={passwords.next} shown={shownPasswords.next} onToggle={() => setShownPasswords((value) => ({ ...value, next: !value.next }))} onChange={(value) => setPasswords((state) => ({ ...state, next: value }))} help="Minimal 8 karakter dengan kombinasi huruf dan angka" error={passwordSubmitted && !passwordValid} />
                                <PasswordInput label="Konfirmasi Kata Sandi Baru" name="confirmation" placeholder="Ulangi kata sandi" value={passwords.confirmation} shown={shownPasswords.confirmation} onToggle={() => setShownPasswords((value) => ({ ...value, confirmation: !value.confirmation }))} onChange={(value) => setPasswords((state) => ({ ...state, confirmation: value }))} error={passwordSubmitted && !passwordsMatch} />
                                <IconButton type="submit" className="w-full sm:w-auto bg-primary-600">Simpan Perubahan</IconButton>
                            </form>
                        </section>
                    )}
                </div>

                <section className="mt-6 rounded-[20px] border border-neutral-200 bg-white px-5 py-6 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-red-600"><IconWrapper className="h-5 w-5 sm:h-6 sm:w-6"><StatusIcon type="info" color="var(--color-status-error)" /></IconWrapper>Hapus Akun</h2>
                            <p className="mt-3 text-sm sm:text-base text-neutral-400">Jika kamu tidak lagi menggunakan akun ini, kamu dapat menghapus akun secara permanen.</p>
                        </div>
                        <IconButton className="w-full sm:w-auto shrink-0 bg-red-600"><IconWrapper className="h-4 w-4 sm:h-5 sm:w-5"><TrashIcon /></IconWrapper>Hapus Akun</IconButton>
                    </div>
                </section>
            </main>
            <Footer />
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
                    className={`w-full rounded-[20px] border bg-white py-3 sm:py-3.5 pr-11 pl-12 text-sm sm:text-base outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 ${error ? 'border-red-500' : 'border-neutral-300'}`}
                />
                <button type="button" onClick={onToggle} aria-label={shown ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400">
                    {shown ? <HiOutlineEyeSlash className="h-5 w-5 sm:h-6 sm:w-6" /> : <HiOutlineEye className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
            </div>
            {help && <p className={`mt-2 text-xs ${error ? 'text-red-600' : 'text-neutral-400'}`}>{help}</p>}
        </div>
    );
}