import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Kebijakan Privasi - Otewe",
  description:
    "Kebijakan Privasi Otewe: data yang dikumpulkan, tujuan penggunaan, pembagian ke pihak ketiga, dan hak pengguna.",
};

const DAFTAR_ISI = [
  { id: "pendahuluan", label: "1. Pendahuluan dan penyelenggara" },
  { id: "data", label: "2. Data yang dikumpulkan" },
  { id: "tujuan", label: "3. Tujuan penggunaan data" },
  { id: "dasar", label: "4. Dasar pemrosesan dan persetujuan" },
  { id: "pihak-ketiga", label: "5. Pembagian data ke pihak ketiga" },
  { id: "lokasi", label: "6. Data lokasi" },
  { id: "penyimpanan-lokal", label: "7. Penyimpanan di perangkat" },
  { id: "retensi", label: "8. Masa penyimpanan data" },
  { id: "keamanan", label: "9. Keamanan data" },
  { id: "hak", label: "10. Hak pengguna" },
  { id: "anak", label: "11. Anak di bawah umur" },
  { id: "perubahan", label: "12. Perubahan kebijakan" },
  { id: "kontak", label: "13. Kontak" },
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

export default function KebijakanPrivasiPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-clip bg-white text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
        <p className="text-sm font-semibold tracking-wide text-primary-600">Dokumen legal</p>
        <h1 className="mt-2 text-4xl leading-none font-bold tracking-tight sm:text-5xl">
          Kebijakan Privasi
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
          <Bagian id="pendahuluan" nomor="1" judul="Pendahuluan dan penyelenggara">
            <p>
              Kebijakan Privasi ini menjelaskan data apa saja yang dikumpulkan aplikasi Otewe
              (informasi rute transportasi umum Bandung dan Cimahi), untuk apa data tersebut
              digunakan, kepada siapa data dibagikan, dan apa hak Anda sebagai pengguna.
            </p>
            <p>
              Penyelenggara aplikasi ini adalah [NAMA PENYELENGGARA], beralamat di [ALAMAT].
              Jika ada pertanyaan tentang kebijakan ini, hubungi kami di [EMAIL KONTAK].
            </p>
          </Bagian>

          <Bagian id="data" nomor="2" judul="Data yang dikumpulkan">
            <p>Kami mengumpulkan data berikut, sesuai fitur yang Anda gunakan:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Data akun:</strong> username, alamat email, dan kata sandi yang sudah
                diacak (hash) saat Anda mendaftar, masuk, atau masuk dengan Google. Untuk
                login Google, kami menerima alamat email dan nama dari akun Google Anda.
              </li>
              <li>
                <strong>Data lokasi:</strong> titik awal dan tujuan yang Anda ketik atau pilih,
                serta koordinat perangkat bila Anda menekan tombol &quot;lokasi saya&quot;.
              </li>
              <li>
                <strong>Riwayat pencarian rute:</strong> bagi pengguna yang masuk (login), nama
                tempat, koordinat, dan rute yang dipilih dari setiap pencarian tersimpan di
                akun Anda. Pencarian tanpa login tidak disimpan di server kami.
              </li>
              <li>
                <strong>Data perubahan akun:</strong> username atau kata sandi baru saat Anda
                mengubah profil, serta permintaan penghapusan akun.
              </li>
            </ul>
          </Bagian>

          <Bagian id="tujuan" nomor="3" judul="Tujuan penggunaan data">
            <ul className="list-disc space-y-2 pl-6">
              <li>Menghitung dan menampilkan rekomendasi rute beserta estimasi ongkos dan durasi.</li>
              <li>Membuat dan mengelola akun Anda, termasuk proses masuk dan pengamanan kata sandi.</li>
              <li>Menyimpan riwayat pencarian agar bisa Anda lihat dan hapus kembali.</li>
              <li>Menjaga keamanan layanan, misalnya mendeteksi penyalahgunaan.</li>
            </ul>
            <p>Kami tidak menggunakan data Anda untuk iklan bertarget dan tidak menjual data Anda.</p>
          </Bagian>

          <Bagian id="dasar" nomor="4" judul="Dasar pemrosesan dan persetujuan">
            <p>
              Pemrosesan data pribadi tunduk pada Undang-Undang Nomor 27 Tahun 2022 tentang
              Pelindungan Data Pribadi. Dengan membuat akun, mencentang persetujuan Syarat
              &amp; Ketentuan, atau memakai fitur yang meminta data (misalnya menekan tombol
              &quot;lokasi saya&quot;), Anda dianggap menyetujui pemrosesan data sebagaimana
              dijelaskan di halaman ini. Anda dapat menarik persetujuan kapan saja dengan cara
              menghapus data atau akun Anda (lihat bagian 10).
            </p>
          </Bagian>

          <Bagian id="pihak-ketiga" nomor="5" judul="Pembagian data ke pihak ketiga">
            <p>Agar aplikasi berjalan, sebagian data diteruskan ke layanan berikut:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>OpenStreetMap</strong> (tile peta) dan <strong>Photon/Komoot</strong>
                (pencarian nama tempat): teks yang Anda ketik di kolom pencarian dikirim agar
                bisa ditemukan kecocokannya.
              </li>
              <li>
                <strong>OSRM publik</strong> (perutean): koordinat asal dan tujuan dikirim dari
                server kami untuk menghitung geometri jalur jalan.
              </li>
              <li>
                <strong>Google</strong> (login OAuth): bila Anda masuk dengan Google, proses
                otentikasi berjalan di sisi Google sesuai kebijakan privasinya.
              </li>
              <li>
                <strong>Supabase</strong> (basis data) dan <strong>Vercel</strong> (hosting):
                menyimpan data akun dan riwayat; penyedia hosting/CDN dapat mencatat alamat
                IP dan log akses standar.
              </li>
            </ul>
            <p>
              Tidak ada cookie pelacak, analytics, atau pelacak error pihak ketiga yang
              dipasang aplikasi ini.
            </p>
          </Bagian>

          <Bagian id="lokasi" nomor="6" judul="Data lokasi">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Lokasi perangkat hanya diminta saat Anda menekan tombol &quot;lokasi
                saya&quot;. Aplikasi tidak melacak lokasi di latar belakang.
              </li>
              <li>
                Koordinat asal dan tujuan dikirim ke server untuk menghitung rute; bila Anda
                login, pencarian tersebut tersimpan sebagai riwayat sampai Anda menghapusnya.
              </li>
              <li>
                Anda bisa menolak izin lokasi di browser/perangkat dan tetap memakai aplikasi
                dengan mengetik nama tempat secara manual. Izin yang sudah diberikan bisa
                dicabut lewat pengaturan browser atau perangkat Anda.
              </li>
            </ul>
          </Bagian>

          <Bagian id="penyimpanan-lokal" nomor="7" judul="Penyimpanan di perangkat">
            <p>
              Aplikasi menyimpan sebagian data di browser perangkat Anda (bukan cookie
              pelacak):
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>localStorage:</strong> token masuk, riwayat lokasi beranda per akun,
                dan data peta agar bisa dipakai luring.
              </li>
              <li>
                <strong>sessionStorage:</strong> lokasi dan hasil pencarian terakhir selama
                tab dibuka; terhapus otomatis saat tab ditutup (lokasi awal/tujuan dihapus
                setelah sekali dipakai kembali).
              </li>
              <li>
                <strong>Cache service worker:</strong> salinan data master dan tile peta agar
                halaman tetap terbuka saat koneksi buruk. Menghapusnya bisa lewat menu
                keluar (logout) atau pengaturan penyimpanan situs di browser.
              </li>
            </ul>
          </Bagian>

          <Bagian id="retensi" nomor="8" judul="Masa penyimpanan data">
            <p>
              Data akun dan riwayat pencarian disimpan selama akun Anda aktif atau sampai
              Anda menghapusnya sendiri: riwayat pencarian bisa dihapus satu per satu lewat
              fitur riwayat, dan akun (beserta seluruh riwayatnya) bisa dihapus lewat fitur
              hapus akun di halaman profil. Penghapusan riwayat saat akun dihapus berjalan
              otomatis lewat basis data.
            </p>
          </Bagian>

          <Bagian id="keamanan" nomor="9" judul="Keamanan data">
            <p>
              Kata sandi disimpan dalam bentuk acak (hash) dan tidak bisa dibaca siapa pun,
              termasuk kami. Akses ke fitur kelola data dibatasi untuk akun dengan peran
              yang berwenang. Meski begitu, tidak ada sistem yang sepenuhnya kebal;
              segera hubungi kami bila mencurigai penyalahgunaan akun Anda.
            </p>
          </Bagian>

          <Bagian id="hak" nomor="10" judul="Hak pengguna">
            <p>Anda berhak untuk:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Mengetahui dan meminta salinan data pribadi Anda.</li>
              <li>Memperbaiki data yang tidak akurat lewat halaman profil.</li>
              <li>Menghapus riwayat pencarian lewat fitur riwayat.</li>
              <li>Menghapus akun beserta seluruh riwayatnya lewat fitur hapus akun.</li>
              <li>Menarik persetujuan, misalnya dengan berhenti memakai layanan dan menghapus akun.</li>
            </ul>
            <p>
              Untuk permintaan yang tidak bisa dilakukan sendiri lewat aplikasi, hubungi
              [EMAIL KONTAK] dari alamat email akun Anda.
            </p>
          </Bagian>

          <Bagian id="anak" nomor="11" judul="Anak di bawah umur">
            <p>
              Layanan ini ditujukan untuk pengguna berusia 18 tahun ke atas. Pengguna di
              bawah 18 tahun hanya boleh memakai layanan dengan didampingi atau atas
              persetujuan orang tua atau wali.
            </p>
          </Bagian>

          <Bagian id="perubahan" nomor="12" judul="Perubahan kebijakan">
            <p>
              Kebijakan ini dapat diperbarui mengikuti perubahan fitur atau aturan hukum.
              Versi terbaru selalu tersedia di halaman ini beserta tanggal berlakunya.
              Perubahan penting akan kami sampaikan lewat aplikasi bila memungkinkan.
            </p>
          </Bagian>

          <Bagian id="kontak" nomor="13" judul="Kontak">
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
