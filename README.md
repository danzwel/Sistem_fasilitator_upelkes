# Sistem Informasi Fasilitator UPTD UPELKES Jawa Barat

Aplikasi web untuk mengelola data fasilitator UPTD UPELKES Jawa Barat: profil, pendidikan, kompetensi/materi, pelatihan, sertifikat, agenda, penilaian, monitoring kelengkapan, dan CV PDF.

## Fitur

- Login administrator dan pengaturan akun.
- Dashboard ringkasan data, agenda, kelengkapan, dan penilaian.
- Kelola fasilitator: tambah, ubah, hapus, pencarian, import Excel, foto, tanda tangan, sertifikat, dan dokumen pendukung.
- Riwayat pendidikan, pelatihan terkait, pengalaman mengajar, serta kompetensi/materi.
- Katalog pelatihan berdasarkan kegiatan dan materi, dengan pencarian materi maupun fasilitator.
- Monitoring kelengkapan data dan export laporan.
- Pratinjau dan unduh CV PDF.
- Antarmuka responsif untuk desktop dan ponsel. Tabel, kumpulan tombol, dan CV yang lebar dapat digeser horizontal tanpa memotong data.

## Teknologi

- React + Vite.
- Node.js HTTP API.
- SQLite.
- Autentikasi token dan penyimpanan file lokal.

## Persyaratan

- Node.js 22 atau lebih baru.
- npm (tersedia bersama Node.js).
- Git, jika memasang dari repository.

Periksa versi yang terpasang:

```powershell
node --version
npm --version
```

## Instalasi

### 1. Ambil kode aplikasi

```powershell
git clone https://github.com/danzwel/Sistem_fasilitator_upelkes.git
cd Sistem_fasilitator_upelkes
```

Untuk memakai branch fitur tertentu:

```powershell
git switch feat/monitoring-daniel
```

### 2. Pasang dependensi

```powershell
npm install
```

### 3. Buat konfigurasi lokal

```powershell
Copy-Item .env.example .env
```

Atur nilai berikut di `.env` sebelum dipakai di lingkungan selain pengembangan:

```env
VITE_API_BASE_URL=/api
VITE_ASSET_BASE_URL=
API_PORT=8000
DATABASE_PATH=./storage/upelkes.sqlite
AUTH_REQUIRED=true
ADMIN_EMAIL=admin@upelkes.local
ADMIN_PASSWORD=ganti-password-awal-ini
AUTH_SECRET=ganti-dengan-secret-acak-yang-aman
```

Nilai `VITE_API_BASE_URL=/api` adalah pengaturan yang direkomendasikan. Vite akan meneruskan request API dan upload ke backend lokal; cara ini juga berfungsi ketika aplikasi dibuka dari HP. Jangan commit `.env`, password produksi, database operasional, atau upload pengguna.

## Menjalankan aplikasi

Jalankan backend dan frontend di dua terminal PowerShell terpisah.

Terminal 1 — backend dan migration database:

```powershell
npm run dev:api
```

Terminal 2 — frontend:

```powershell
npm run dev -- --host 0.0.0.0 --port 5173
```

Buka [http://localhost:5173](http://localhost:5173). Migration database berjalan otomatis ketika backend pertama kali dimulai. Akun admin awal menggunakan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` pada `.env`.

Pemeriksaan backend: [http://localhost:8000/api/health](http://localhost:8000/api/health)

```json
{"status":"ok"}
```

Untuk menjalankan migration secara eksplisit:

```powershell
npm run migrate
```

## Akses dari HP pada jaringan lokal

1. Sambungkan HP dan komputer server ke Wi-Fi/jaringan yang sama.
2. Jalankan frontend dengan `--host 0.0.0.0` seperti contoh di atas.
3. Cari IPv4 komputer server:

   ```powershell
   ipconfig
   ```

4. Buka URL seperti `http://192.168.1.10:5173` dari browser HP.
5. Jika tidak dapat dibuka, izinkan Node.js/Vite pada Windows Firewall untuk jaringan privat atau buka port `5173`.

Jangan memakai `VITE_API_BASE_URL=http://localhost:8000/api` untuk penggunaan dari HP. `localhost` akan menunjuk ke HP itu sendiri; gunakan `/api` agar request diteruskan melalui Vite ke backend komputer server.

## Build dan pemeriksaan

```powershell
npm run build
npm test
```

Untuk menguji hasil build secara lokal:

```powershell
npm run preview -- --host 0.0.0.0 --port 4173
```

Proxy API dan upload juga aktif pada mode preview.

## Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan frontend Vite. |
| `npm run dev:api` | Menjalankan backend API. |
| `npm run dev:all` | Menjalankan frontend dan backend bersamaan. |
| `npm run start` | Menjalankan backend tanpa Vite. |
| `npm run migrate` | Menjalankan migration database. |
| `npm run build` | Membuat build frontend produksi. |
| `npm run preview` | Menjalankan hasil build untuk uji lokal. |
| `npm test` | Menjalankan test backend dan utilitas frontend. |

## Struktur proyek

```text
src/                    Frontend React
src/modules/auth        Login dan autentikasi
src/modules/dashboard   Dashboard, agenda, dan rating
src/modules/fasilitator Data fasilitator dan import Excel
src/modules/training    Katalog serta agenda pelatihan
src/modules/cv          Pratinjau dan export CV PDF
src/modules/monitoring  Monitoring kelengkapan fasilitator
src/modules/settings    Pengaturan aplikasi dan akun
server/                 API, SQLite, migration, dan repository
storage/                Database SQLite dan file upload lokal
docs/                   Kontrak API dan panduan kontribusi
```

## Penggunaan bersama dan deployment

SQLite menjadi database bersama hanya apabila semua pengguna mengakses backend yang sama.

```text
Komputer/HP pengguna ── Frontend bersama ── Backend tunggal ── SQLite tunggal
```

Untuk operasional resmi, gunakan server yang selalu aktif, HTTPS, backup database dan `storage/uploads` secara rutin, serta reverse proxy yang meneruskan `/api` dan `/uploads` ke backend. Untuk jumlah pengguna atau data yang besar, pertimbangkan PostgreSQL atau MySQL.

## Troubleshooting

### Port `8000` atau `5173` sudah dipakai

```powershell
netstat -ano | Select-String ':8000|:5173'
```

Gunakan port frontend lain bila perlu:

```powershell
npm run dev -- --host 0.0.0.0 --port 5174
```

### Aplikasi terbuka dari HP, tetapi data tidak termuat

- Pastikan `npm run dev:api` dan Vite sama-sama aktif.
- Akses URL IP komputer, bukan `localhost`, dari HP.
- Pastikan `.env` memakai `VITE_API_BASE_URL=/api`.
- Restart Vite setelah mengubah `.env`.
- Periksa Windows Firewall pada jaringan privat.

### Foto atau dokumen tidak tampil

Frontend harus dibuka melalui Vite/reverse proxy yang meneruskan `/uploads` ke backend. Lokasi default file upload adalah `storage/uploads`.

## Sebelum serah terima atau deployment

1. Cadangkan database dan folder `storage/uploads`.
2. Hapus data dummy serta file upload yang tidak boleh diserahkan.
3. Ganti email admin, password awal, dan `AUTH_SECRET`.
4. Pastikan `.env`, database operasional, serta file upload pengguna tidak ikut terunggah ke Git.
5. Uji login, input fasilitator, upload, export CV, import Excel, dan akses dari HP.

Detail kontribusi tersedia di [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). Kontrak endpoint tersedia di [`docs/DANIEL_API_CONTRACT.md`](docs/DANIEL_API_CONTRACT.md).
