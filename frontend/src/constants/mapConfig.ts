// Menggunakan tile server publik OSM. Untuk production/traffic tinggi nanti, 
// pertimbangkan tile provider ber-cache seperti CartoDB (masih gratis untuk usage wajar) 
// agar tidak membebani server OSM gratis secara berlebihan.

export const MAP_DEFAULT_CENTER: [number, number] = [-6.9175, 107.6191]; // Bandung
export const MAP_DEFAULT_ZOOM = 13;
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Batas geser peta: kotak pembatas poligon layanan (lib/serviceArea) + padding.
// Menjaga pengguna tetap di sekitar wilayah layanan tanpa terasa "terkunci".
// [[lat selatan, lng barat], [lat utara, lng timur]]
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-7.41, 107.09],
  [-6.6, 108.02],
];
// Zoom minimum: cukup jauh untuk melihat seisi wilayah, tidak sampai tile
// kosong di luar batas mendominasi layar (cek juga di layar HP).
export const MAP_MIN_ZOOM = 10;
