export type HalteStatus = 'AKTIF' | 'TIDAK_AKTIF';

export interface Halte {
    id: string;
    nama: string;
    alamat: string;
    latitude: string;
    longitude: string;
    status: HalteStatus;
}

export type HalteInput = Omit<Halte, 'id'>;
