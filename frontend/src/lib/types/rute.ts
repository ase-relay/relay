export type RuteStatus = 'AKTIF' | 'TIDAK_AKTIF';

export interface Rute {
    id: string;
    namaJalur: string;
    moda: string;
    halte: string[];
    jumlahHalte: number;
    status: RuteStatus;
}

export type RuteInput = Omit<Rute, 'id' | 'jumlahHalte'>;
