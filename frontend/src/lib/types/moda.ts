export interface Moda {
    id: number;
    namaModa: string;
    tipeModa: string | null;
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
    isActive: boolean;
}
