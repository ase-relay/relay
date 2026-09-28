export type TarifSkema = 'FIXED_PRICE' | 'BERDASARKAN_JARAK';

export type TarifStatus = 'AKTIF' | 'TIDAK_AKTIF';

export interface Tarif {
    id: string;
    moda: string;
    skema: TarifSkema;
    hargaPerPerjalanan?: number;
    tarifMinimum?: number;
    batasJarakAwal?: number;
    tarifKmBerikutnya?: number;
    biayaLayanan?: number;
    status: TarifStatus;
}

export type TarifInput = Omit<Tarif, 'id'>;
