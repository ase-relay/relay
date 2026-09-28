export type ModaStatus = 'AKTIF' | 'TIDAK_AKTIF';

export interface Moda {
    id: string;
    nama: string;
    status: ModaStatus;
}

export type ModaInput = Omit<Moda, 'id'>;
