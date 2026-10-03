export type TipeModa = 'BUS' | 'KERETA' | 'OJEK_ONLINE';

export const TIPE_MODA_LABELS: Record<TipeModa, string> = {
    BUS: 'Bus',
    KERETA: 'Kereta',
    OJEK_ONLINE: 'Ojek online',
};

export interface Moda {
    id: number;
    namaModa: string;
    tipeModa: string | null;
    ikon: string | null;
    deskripsi: string | null;
    rataRataKecepatanKmh: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        rutes: number;
    };
}

export interface ModaInput {
    namaModa: string;
    tipeModa: TipeModa;
    rataRataKecepatanKmh: number | null;
    isActive: boolean;
}
