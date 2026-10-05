export interface RuteStopItem {
    id: number;
    halteId: number;
    urutan: number;
    estimasiMenit: number | null;
    jarakMeter: number | null;
    jadwalKeberangkatan?: string[];
    halte: {
        id: number;
        namaHalte: string;
        isActive: boolean;
    };
}

export interface Rute {
    id: number;
    namaRute: string;
    kodeRute: string | null;
    deskripsi: string | null;
    modaId: number;
    jamMulaiOperasi: string | null;
    jamSelesaiOperasi: string | null;
    intervalWaktu: string | null;
    isActive: boolean;
    moda: {
        id: number;
        namaModa: string;
        isActive?: boolean;
    };
    _count?: {
        stops: number;
    };
    stops?: RuteStopItem[];
}

export interface RuteInput {
    namaRute: string;
    kodeRute?: string;
    modaId: number;
    jamMulaiOperasi?: string | null;
    jamSelesaiOperasi?: string | null;
    intervalWaktu?: string | null;
    isActive: boolean;
    stops: {
        halteId: number;
        estimasiMenit: number | null;
        jarakMeter: number | null;
        jadwalKeberangkatan?: string[];
    }[];
}
