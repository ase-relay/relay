/**
 * Normalisasi string untuk perbandingan duplikat:
 * - trim whitespace
 * - lowercase
 * - ganti spasi ganda jadi satu spasi
 * - hapus spasi sebelum angka di akhir nama (mis. "Cicendo 1" -> "cicendo 1")
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s+(\d+)$/, '$1');
}

/**
 * Cek apakah nama sudah digunakan (setelah normalisasi).
 * Kecualikan ID tertentu (untuk update).
 * Bisa dipakai untuk berbagai entitas dengan field nama yang berbeda.
 */
export async function checkDuplicateName<T extends { id: number }>(
  name: string,
  getAllItems: () => Promise<T[]>,
  getName: (item: T) => string,
  excludeId?: number
): Promise<boolean> {
  const normalizedInput = normalizeName(name);
  const allItems = await getAllItems();

  for (const item of allItems) {
    if (excludeId !== undefined && item.id === excludeId) continue;
    const normalizedExisting = normalizeName(getName(item));
    if (normalizedExisting === normalizedInput) {
      return true;
    }
  }
  return false;
}