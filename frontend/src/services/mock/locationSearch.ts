import { stops } from '@/lib/mock/stops';

// TODO: Ganti implementasi ini dengan Google Places Autocomplete API saat tahap integrasi final. 
// Signature function TIDAK BOLEH berubah agar komponen pemanggil tidak perlu diubah.

export interface LocationSuggestion {
  id: string;
  name: string;
  district: string;
}

export async function searchLocationMock(query: string): Promise<LocationSuggestion[]> {
  // Jangan search jika query terlalu pendek
  if (query.length < 2) {
    return [];
  }

  // Simulasikan network delay 250-400ms untuk realistic feel
  const delay = Math.floor(Math.random() * 150) + 250;
  
  await new Promise(resolve => setTimeout(resolve, delay));

  // Filter stops berdasarkan name (case-insensitive), max 5 hasil
  const filtered = stops
    .filter(stop => 
      stop.name.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5)
    .map(stop => ({
      id: stop.id,
      name: stop.name,
      district: stop.district,
    }));

  return filtered;
}
