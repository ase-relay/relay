// Menggunakan tile server publik OSM. Untuk production/traffic tinggi nanti, 
// pertimbangkan tile provider ber-cache seperti CartoDB (masih gratis untuk usage wajar) 
// agar tidak membebani server OSM gratis secara berlebihan.

export const MAP_DEFAULT_CENTER: [number, number] = [-6.9175, 107.6191]; // Bandung
export const MAP_DEFAULT_ZOOM = 13;
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
