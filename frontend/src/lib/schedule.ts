/**
 * Helper jadwal keberangkatan (dipakai detail rute).
 * Murni (pure): mudah ditest tanpa DOM.
 */

/** "HH:MM" -> menit sejak tengah malam. Null bila format tidak valid. */
export function parseClockToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Menit saat ini dalam WIB (Asia/Jakarta), terlepas dari zona waktu perangkat. */
export function getWibNowMinutes(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

export interface NextDeparture {
  /** Jam "HH:MM" keberangkatan terdekat. */
  time: string;
  /** True bila jadwal hari ini sudah habis — jam ini untuk besok. */
  isTomorrow: boolean;
  /** Jumlah jadwal valid yang ditemukan (untuk label "semua N jadwal"). */
  totalCount: number;
}

/**
 * Ambil jadwal keberangkatan terdekat dari daftar "HH:MM".
 * - Entri tidak valid dibuang; sisanya diurutkan (tidak mengubah array asli).
 * - Bila semua jadwal hari ini lewat, kembali ke jadwal pertama (= besok).
 * - Daftar kosong/invalid semua -> null (pemanggil tidak me-render blok).
 */
export function getNextDeparture(
  schedules: string[],
  nowMinutes: number = getWibNowMinutes(),
): NextDeparture | null {
  const valid = schedules.filter((entry) => parseClockToMinutes(entry) !== null);
  if (valid.length === 0) return null;

  const sorted = valid
    .map((time) => ({ time, minutes: parseClockToMinutes(time) as number }))
    .sort((a, b) => a.minutes - b.minutes);

  const upcoming = sorted.find((entry) => entry.minutes >= nowMinutes);
  if (upcoming) {
    return { time: upcoming.time, isTomorrow: false, totalCount: sorted.length };
  }
  return { time: sorted[0].time, isTomorrow: true, totalCount: sorted.length };
}
