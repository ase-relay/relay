export interface RuteStopItem {
    id: number;
    halteId: number;
    urutan: number;
    estimasiMenit: number | null;
    jarakMeter: number | null;
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
    isActive: boolean;
    stops: {
        halteId: number;
        estimasiMenit: number | null;
        jarakMeter: number | null;
    }[];
}
