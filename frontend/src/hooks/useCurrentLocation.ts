import { useCallback, useState } from 'react';
import { CURRENT_LOCATION_ID, type LocationSuggestion } from '@/services/locationSearch';

/**
 * Hook untuk mendapat koordinat ASLI perangkat via `navigator.geolocation`.
 *
 * - `maximumAge: 0` → selalu ambil posisi baru, tidak memakai cache lama.
 * - `enableHighAccuracy: false` → cukup akurat untuk titik awal rute dan lebih cepat.
 * - `timeout: 10_000` → gagal dalam 10 detik dengan pesan error bahasa Indonesia.
 */
export function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = useCallback((): Promise<LocationSuggestion> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        reject(new Error('Browser tidak mendukung deteksi lokasi. Silakan ketik nama lokasi manual.'));
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            id: CURRENT_LOCATION_ID,
            name: 'Lokasi saya',
            district: 'Lokasi perangkat saat ini',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setIsLocating(false);
          const message =
            error.code === error.PERMISSION_DENIED
              ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser atau ketik nama lokasi manual.'
              : error.code === error.TIMEOUT
                ? 'Waktu deteksi lokasi habis (10 detik). Coba lagi atau ketik nama lokasi manual.'
                : 'Lokasi perangkat tidak dapat dideteksi. Silakan ketik nama lokasi manual.';
          reject(new Error(message));
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 0 },
      );
    });
  }, []);

  return { isLocating, getCurrentLocation };
}
