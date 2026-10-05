import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan - Otewe",
  description:
    "Syarat & Ketentuan Otewe: aturan pemakaian layanan informasi rute transportasi umum Bandung dan Cimahi.",
};

const DAFTAR_ISI = [
  { id: "penerimaan", label: "1. Penerimaan syarat" },
  { id: "layanan", label: "2. Deskripsi layanan" },
  { id: "aturan", label: "3. Ketentuan penggunaan dan larangan" },
  { id: "akurasi", label: "4. Batasan akurasi informasi" },
  { id: "tanggung-jawab", label: "5. Batasan tanggung jawab" },
  { id: "haki", label: "6. Hak kekayaan intelektual" },
  { id: "pihak-ketiga", label: "7. Tautan dan layanan pihak ketiga" },
  { id: "perubahan", label: "8. Perubahan layanan dan ketentuan" },
  { id: "hukum", label: "9. Hukum yang berlaku" },
  { id: "kontak", label: "10. Kontak" },
];

function Bagian({ id, nomor, judul, children }: { id: string; nomor: string; judul: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className="scroll-mt-24">
      <h2 id={`${id}-judul`} className="text-xl font-bold tracking-tight text-black sm:text-2xl">
        {nomor}. {judul}
      </h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

export default function SyaratKetentuanPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-clip bg-white text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
        <p className="text-sm font-semibold tracking-wide text-primary-600">Dokumen legal</p>
        <h1 className="mt-2 text-4xl leading-none font-bold tracking-tight sm:text-5xl">
          Syarat &amp; Ketentuan
        </h1>
        <p className="mt-4 text-sm text-neutral-500">Terakhir diperbarui: [TANGGAL BERLAKU]</p>

        <nav aria-label="Daftar isi" className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
          <p className="text-sm font-bold text-neutral-900">Daftar isi</p>
          <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {DAFTAR_ISI.map((item) => (
              <li key={item.id}>
                <Link href={`#${item.id}`} className="text-primary-600 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          <Bagian id="penerimaan" nomor="1" judul="Penerimaan syarat">
            <p>
              Dengan membuat akun, mencentang persetujuan saat mendaftar, atau memakai
              aplikasi Otewe, Anda dianggap telah membaca, memahami, dan menyetujui seluruh
              Syarat &amp; Ketentuan ini beserta Kebijakan Privasi kami. Bila tidak setuju,
              mohon tidak memakai layanan ini. Layanan ini ditujukan untuk pengguna berusia
              18 tahun ke atas; pengguna di bawah 18 tahun hanya boleh memakai layanan
              dengan didampingi atau atas persetujuan orang tua atau wali.
            </p>
          </Bagian>

          <Bagian id="layanan" nomor="2" judul="Deskripsi layanan">
            <p>
              Otewe adalah layanan informasi rute transportasi umum di wilayah Bandung dan
              Cimahi. Anda bisa mencari titik awal dan tujuan, lalu aplikasi menampilkan
              pilihan perjalanan beserta estimasi ongkos, durasi, jumlah transit, dan
              panduan langkah perjalanan di peta. Sebagian fitur (misalnya riwayat
              pencarian) hanya tersedia bila Anda masuk (login) ke akun.
            </p>
          </Bagian>

          <Bagian id="aturan" nomor="3" judul="Ketentuan penggunaan dan larangan">
            <p>Dalam memakai layanan, Anda dilarang:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Menyalahgunakan akun, termasuk berbagi kata sandi atau memalsukan identitas.</li>
              <li>Mengganggu berjalannya layanan, misalnya mengirim permintaan berlebihan secara otomatis.</li>
              <li>Menggunakan informasi rute untuk kegiatan yang melanggar hukum.</li>
              <li>Mengaku sebagai penyelenggara atau mengatasnamakan Otewe tanpa izin.</li>
            </ul>
            <p>
              Kami dapat menangguhkan atau menghapus akun yang melanggar ketentuan ini.
            </p>
          </Bagian>

          <Bagian id="akurasi" nomor="4" judul="Batasan akurasi informasi">
            <p>
              Informasi rute, jadwal keberangkatan, tarif, dan estimasi durasi maupun jarak
              bersifat perkiraan dan dapat berubah sewaktu-waktu mengikuti kondisi di
              lapangan (misalnya kemacetan, pengalihan arus, atau perubahan operasional).
              Data tidak dijamin akurat atau bersifat real-time. Selalu periksa informasi
              resmi operator transportasi sebelum berangkat, terutama untuk perjalanan
              yang terikat waktu.
            </p>
          </Bagian>

          <Bagian id="tanggung-jawab" nomor="5" judul="Batasan tanggung jawab">
            <p>
              Sejauh diizinkan hukum, penyelenggara tidak bertanggung jawab atas kerugian
              yang timbul dari penggunaan informasi di aplikasi ini, termasuk keterlambatan,
              ketinggalan kendaraan, selisih tarif, atau gangguan layanan pihak ketiga.
              Penggunaan rute dan keputusan perjalanan sepenuhnya menjadi tanggung jawab Anda.
            </p>
          </Bagian>

          <Bagian id="haki" nomor="6" judul="Hak kekayaan intelektual">
            <p>
              Seluruh tampilan, logo, ikon, teks, dan kode aplikasi Otewe dilindungi hak
              kekayaan intelektual. Anda boleh memakai layanan untuk keperluan pribadi yang
              wajar, tetapi dilarang menyalin, mengubah, atau mendistribusikan ulang
              bagian aplikasi tanpa izin tertulis. Data peta berasal dari kontributor
              OpenStreetMap beserta lisensinya.
            </p>
          </Bagian>

          <Bagian id="pihak-ketiga" nomor="7" judul="Tautan dan layanan pihak ketiga">
            <p>Agar berfungsi, aplikasi memakai layanan pihak ketiga berikut:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>OpenStreetMap (tile peta) dan Photon/Komoot (pencarian nama tempat).</li>
              <li>OSRM publik (perhitungan jalur jalan).</li>
              <li>Google (login OAuth).</li>
              <li>Supabase (basis data) dan Vercel (hosting).</li>
            </ul>
            <p>
              Masing-masing tunduk pada syarat dan kebijakan privasinya sendiri. Kami tidak
              mengendalikan dan tidak bertanggung jawab atas isi maupun ketersediaan
              layanan tersebut.
            </p>
          </Bagian>

          <Bagian id="perubahan" nomor="8" judul="Perubahan layanan dan ketentuan">
            <p>
              Fitur, tampilan, dan isi dokumen ini dapat berubah mengikuti perkembangan
              layanan atau aturan hukum. Versi terbaru selalu tersedia di halaman ini.
              Pemakaian berkelanjutan setelah perubahan dianggap sebagai persetujuan Anda
              atas versi yang baru.
            </p>
          </Bagian>

          <Bagian id="hukum" nomor="9" judul="Hukum yang berlaku">
            <p>
              Syarat &amp; Ketentuan ini tunduk pada dan ditafsirkan menurut hukum
              Republik Indonesia. Setiap perselisihan diselesaikan lebih dulu secara
              musyawarah; bila tidak tercapai, mengikuti ketentuan peraturan
              perundang-undangan yang berlaku.
            </p>
          </Bagian>

          <Bagian id="kontak" nomor="10" judul="Kontak">
            <p>
              [NAMA PENYELENGGARA], [ALAMAT]. Email: [EMAIL KONTAK].
            </p>
          </Bagian>
        </div>
      </main>
      <Footer className="pt-6 sm:pt-8" />
    </div>
  );
}
