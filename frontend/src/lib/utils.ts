export function formatCurrency(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} menit`;
}

/** Jarak lingkaran besar antara dua koordinat dalam meter (untuk deteksi lokasi kembar). */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6_371_000;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
}
