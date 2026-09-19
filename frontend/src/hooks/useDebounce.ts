import { useState, useEffect } from 'react';

/**
 * Debounce hook untuk input pencarian lokasi — cegah pemanggilan API berulang di setiap keystroke saat integrasi Google Places API nanti.
 * 
 * @param value - Nilai yang akan di-debounce
 * @param delayMs - Delay dalam milidetik (default: 400ms)
 * @returns Nilai yang sudah di-debounce
 */
export function useDebounce<T>(value: T, delayMs: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Cleanup untuk mencegah stale closure/memory leak
    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
