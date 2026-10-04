import type { ReactNode } from "react";

// Blok teks kiri yang sama untuk semua AuthSlide, sesuai desain (card 699x257).
// Titik tengah blok berada di y = 137px dan sisi kirinya di x = 46px.
export function AuthSlideText({ title, description }: { title: ReactNode; description: string }) {
    return (
        <div className="absolute top-34.25 left-11.5 w-84 -translate-y-1/2">
            <h3 className="text-2xl leading-tight font-bold text-black">{title}</h3>
            <p className="mt-5.5 text-base leading-relaxed text-black">{description}</p>
        </div>
    );
}