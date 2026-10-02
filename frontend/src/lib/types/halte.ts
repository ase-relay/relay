export interface Halte {
    id: number;
    namaHalte: string;
    alamat: string | null;
    latitude: number;
    longitude: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        ruteStops: number;
    };
}

export interface HalteInput {
    namaHalte: string;
    alamat?: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
}
