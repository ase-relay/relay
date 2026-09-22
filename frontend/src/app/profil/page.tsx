'use client';

import { FormEvent, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/ui/Alert';
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
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

export default function ProfilPage() {
    const { user } = useAuth();
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

    const profileRows = (
        <div className="grid grid-cols-[minmax(120px,.8fr)_minmax(0,1fr)_auto] items-center gap-x-6 gap-y-0 sm:grid-cols-[1fr_1.4fr_auto]">
            <div className="contents">
                <p className="py-8 flex items-center gap-4 text-base font-medium text-neutral-400"><EmailIcon />Email</p>
                <p className="py-8 text-base font-semibold text-neutral-900">{user?.email ?? '—'}</p>
                <div className="py-8 flex items-center justify-end"><span aria-hidden="true" /></div>
            </div>

            <div className="contents">
                <div className="col-span-full border-t border-neutral-300" />
                <p className="py-8 flex items-center gap-4 text-base font-medium text-neutral-400"><UserIcon />Username</p>
                {editingUsername ? (
                    <form onSubmit={saveUsername} className="contents">
                        <div className="py-8 max-w-[425px]">
                            <input
                                aria-label="Username baru"
                                autoComplete="username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="Masukkan username baru"
                                className={`w-full rounded-[22px] border bg-white px-5 py-3.5 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 ${usernameSubmitted && !usernameValid ? 'border-red-500' : 'border-neutral-300'}`}
                            />
                            <p className={`mt-2 text-xs ${usernameSubmitted && !usernameValid ? 'text-red-600' : 'text-neutral-400'}`}>3-20 karakter, hanya huruf, angka, dan underscore</p>
                        </div>
                        <div className="py-8 flex items-center justify-end">
                            <IconButton type="submit" className="self-start bg-primary-600">Simpan</IconButton>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className="py-8 text-base font-semibold text-neutral-900">{user?.username ?? '—'}</p>
                        <div className="py-8 flex items-center justify-end">
                            <IconButton onClick={beginUsernameEdit} className="bg-primary-600"><EditIcon />Ubah</IconButton>
                        </div>
                    </>
                )}
            </div>

            <div className="contents">
                <div className="col-span-full border-t border-neutral-300" />
                <p className="py-8 flex items-center gap-4 text-base font-medium text-neutral-400"><PadlockIcon />Kata Sandi</p>
                <p className="py-8 text-base font-semibold tracking-[0.22em] text-neutral-950">••••••••</p>
                <div className="py-8 flex items-center justify-end">
                    <IconButton onClick={() => { setEditingUsername(false); setChangingPassword(true); setPasswordSubmitted(false); }} className="bg-primary-600"><EditIcon />Ubah</IconButton>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col text-neutral-900">
            <Navbar />
            {alert && <Alert status="success" title={alert.title} description={alert.description} onClose={() => setAlert(null)} autoDismissMs={3000} className="fixed top-30 left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-xl -translate-x-1/2 shadow-[0_10px_25px_rgba(15,23,42,0.14)]" />}
            <main className="mx-auto w-full max-w-292.5 flex-1 px-5 py-8 sm:px-8 lg:py-12">
                <div className={`grid items-start gap-7 ${changingPassword ? 'lg:grid-cols-[minmax(0,1fr)_minmax(480px,.82fr)]' : ''}`}>
                    <section className="rounded-[20px] border border-neutral-200 bg-white px-8 py-8 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-12 sm:py-10">
                        <h1 className="text-xl font-bold tracking-tight text-black">Informasi Profil</h1>
                        <div className="mt-8">{profileRows}</div>
                    </section>

                    {changingPassword && (
                        <section className="rounded-[20px] border border-neutral-200 bg-white px-8 py-8 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-12 sm:py-10">
                            <div className="flex items-center justify-between"><h2 className="text-xl font-bold tracking-tight text-black">Ubah Kata Sandi</h2><button type="button" onClick={() => setChangingPassword(false)} aria-label="Tutup form ubah kata sandi" className="cursor-pointer text-neutral-900"><HiXMark className="h-7 w-7" /></button></div>
                            <form onSubmit={savePassword} className="mt-9 space-y-7">
                                <PasswordInput label="Kata Sandi Saat Ini" name="current" placeholder="Masukkan kata sandi saat ini" value={passwords.current} shown={shownPasswords.current} onToggle={() => setShownPasswords((value) => ({ ...value, current: !value.current }))} onChange={(value) => setPasswords((state) => ({ ...state, current: value }))} error={passwordSubmitted && !passwords.current} />
                                <PasswordInput label="Kata Sandi Baru" name="next" placeholder="Buat kata sandi" value={passwords.next} shown={shownPasswords.next} onToggle={() => setShownPasswords((value) => ({ ...value, next: !value.next }))} onChange={(value) => setPasswords((state) => ({ ...state, next: value }))} help="Minimal 8 karakter dengan kombinasi huruf dan angka" error={passwordSubmitted && !passwordValid} />
                                <PasswordInput label="Konfirmasi Kata Sandi Baru" name="confirmation" placeholder="Ulangi kata sandi" value={passwords.confirmation} shown={shownPasswords.confirmation} onToggle={() => setShownPasswords((value) => ({ ...value, confirmation: !value.confirmation }))} onChange={(value) => setPasswords((state) => ({ ...state, confirmation: value }))} error={passwordSubmitted && !passwordsMatch} />
                                <IconButton type="submit" className="w-full bg-primary-600">Simpan Perubahan</IconButton>
                            </form>
                        </section>
                    )}
                </div>

                <section className="mt-7 rounded-[20px] border border-neutral-200 bg-white px-8 py-9 shadow-[0_8px_12px_rgba(15,23,42,0.10)] sm:px-12 sm:py-11">
                    <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
                        <div><h2 className="flex items-center gap-4 text-xl font-bold text-red-600"><StatusIcon type="info" color="var(--color-status-error)" />Hapus Akun</h2><p className="mt-4 text-base text-neutral-400">Jika kamu tidak lagi menggunakan akun ini, kamu dapat menghapus akun secara permanen.</p></div>
                        <IconButton className="shrink-0 bg-red-600"><TrashIcon />Hapus Akun</IconButton>
                    </div>
                </section>
            </main>
            <Footer className="bg-[#f6faff]" />
        </div>
    );
}

function PasswordInput({ label, name, placeholder, value, shown, onToggle, onChange, help, error }: { label: string; name: string; placeholder: string; value: string; shown: boolean; onToggle: () => void; onChange: (value: string) => void; help?: string; error: boolean }) {
    return <div><label htmlFor={name} className="text-base font-semibold text-neutral-900">{label}</label><div className="relative mt-3"><span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2"><PadlockIcon /></span><input id={name} type={shown ? 'text' : 'password'} autoComplete={name === 'current' ? 'current-password' : 'new-password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`w-full rounded-[20px] border bg-white py-3.5 pr-12 pl-14 text-base outline-none placeholder:text-neutral-400 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 ${error ? 'border-red-500' : 'border-neutral-300'}`} /><button type="button" onClick={onToggle} aria-label={shown ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-neutral-400">{shown ? <HiOutlineEyeSlash className="h-6 w-6" /> : <HiOutlineEye className="h-6 w-6" />}</button></div>{help && <p className={`mt-2 text-xs ${error ? 'text-red-600' : 'text-neutral-400'}`}>{help}</p>}</div>;
}
