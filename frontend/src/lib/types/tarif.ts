export type TarifSkema = 'FLAT' | 'PER_KM';

export interface Tarif {
    id: number;
    modaId: number;
    tipeTarif: TarifSkema;
    nominalDasar: number;
    nominalPerKm: number | null;
    jarakMinimumKm: number | null;
    biayaLayanan: number;
    keterangan: string | null;
    createdAt: string;
    updatedAt: string;
    moda: {
        id: number;
        namaModa: string;
        isActive: boolean;
    };
}

export interface TarifInput {
    modaId: number;
    tipeTarif: TarifSkema;
    nominalDasar: number;
    nominalPerKm?: number;
    jarakMinimumKm?: number | null;
    biayaLayanan?: number;
}
