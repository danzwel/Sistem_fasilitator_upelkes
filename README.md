# Sistem Informasi Fasilitator UPTD UPELKES Jawa Barat

Aplikasi web untuk mengelola data fasilitator, pendidikan, kompetensi, pelatihan, sertifikat, evaluasi, monitoring, dan pembuatan CV fasilitator.

## Teknologi

- React + Vite untuk antarmuka web.
- Node.js HTTP API untuk backend.
- SQLite untuk database lokal.
- Token authentication untuk akses pengguna.
- Upload file untuk foto, tanda tangan, sertifikat, dan dokumen pendukung.

## Struktur utama

```text
src/                    Frontend React
src/modules/auth        Login dan autentikasi
src/modules/fasilitator Data master fasilitator dan import Excel
src/modules/training    Data pelatihan dan katalog pelatihan
src/modules/monitoring   Monitoring dan evaluasi
src/modules/competency   Profil kompetensi
src/modules/dashboard    Dashboard dan ringkasan data
server/                 Backend API, database, migration, dan repository
storage/                Database SQLite dan file upload
docs/                   Dokumentasi teknis dan kontrak API
```

## Persyaratan

- Node.js 22 atau yang lebih baru.
- npm.

## Instalasi

```bash
git clone https://github.com/danzwel/Sistem_fasilitator_upelkes.git
cd Sistem_fasilitator_upelkes
npm install
```

Salin `.env.example` menjadi `.env`, kemudian sesuaikan nilainya:

```env
VITE_API_BASE_URL=/api
API_PORT=8000
DATABASE_PATH=./storage/upelkes.sqlite
AUTH_REQUIRED=true
ADMIN_EMAIL=admin@upelkes.local
ADMIN_PASSWORD=ganti-password-ini
AUTH_SECRET=ganti-dengan-secret-acak-yang-aman
```

Jangan commit `.env` atau memasukkan password produksi ke repository.

## Menjalankan saat development

Jalankan backend dan frontend pada dua terminal terpisah.

Terminal 1:

```bash
npm run dev:api
```

Backend tersedia di `http://localhost:8000`.

Terminal 2:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Frontend tersedia di `http://localhost:5173`.

Login awal menggunakan nilai `ADMIN_EMAIL` dan `ADMIN_PASSWORD` pada `.env`. Pada penggunaan pertama, segera ganti password melalui pengaturan aplikasi.

Endpoint pemeriksaan backend:

```text
http://localhost:8000/api/health
```

Respons yang diharapkan:

```json
{"status":"ok"}
```

Migration database dijalankan otomatis ketika backend mulai. Perintah berikut tersedia jika ingin menjalankan migration secara eksplisit:

```bash
npm run migrate
```

## Akses dari komputer lain atau HP

### Jaringan lokal

Jalankan frontend dengan `--host 0.0.0.0`, kemudian akses alamat IP komputer server, misalnya:

```text
http://192.168.1.10:5173
```

Komputer server harus tetap menyala dan firewall harus mengizinkan port yang digunakan.

### Akses melalui internet atau jaringan berbeda

Untuk demo atau pengujian, port frontend dapat diteruskan menggunakan VS Code Ports/Developer Tunnel, Cloudflare Tunnel, atau ngrok.

Forward port `5173`, bukan port database. Backend tetap berjalan di komputer server dan frontend meneruskan request `/api` ke backend lokal melalui konfigurasi proxy Vite.

Setiap pengguna harus membuka URL tunnel yang sama. Dengan demikian semua pengguna memakai satu backend dan satu database yang sama.

Developer Tunnel cocok untuk pengujian sementara. Untuk operasional resmi, gunakan server tetap dengan HTTPS, backup otomatis, dan database server seperti PostgreSQL atau MySQL.

## Database bersama

SQLite hanya menjadi database bersama jika semua pengguna mengakses satu instance backend yang sama. Jangan menjalankan salinan backend/database terpisah di komputer Divisi A dan Divisi B, karena datanya tidak akan tersinkron otomatis.

Alur penggunaan bersama:

```text
Divisi A ─┐
          ├── Frontend bersama ─── Backend tunggal ─── Database tunggal
Divisi B ─┘
```

Aplikasi saat ini menggunakan REST API. Perubahan data tersimpan di database yang sama, tetapi pembaruan otomatis di layar pengguna lain memerlukan polling, Server-Sent Events, atau WebSocket.

## Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan Vite frontend |
| `npm run dev:api` | Menjalankan backend API |
| `npm run dev:all` | Mencoba menjalankan frontend dan backend bersamaan |
| `npm run start` | Menjalankan backend |
| `npm run migrate` | Menjalankan migration database |
| `npm run build` | Membuat build frontend produksi |
| `npm run preview` | Menjalankan hasil build untuk preview |
| `npm test` | Menjalankan test |

## Troubleshooting

### `EADDRINUSE: address already in use :::8000`

Port `8000` sudah dipakai proses backend lain. Gunakan backend yang sudah aktif atau hentikan proses lama terlebih dahulu, lalu jalankan kembali `npm run dev:api`.

Pemeriksaan port di Windows PowerShell:

```powershell
netstat -ano | Select-String ':8000'
```

### Halaman putih setelah menggunakan tunnel

1. Pastikan frontend lokal dapat dibuka di `http://localhost:5173`.
2. Pastikan `.env` menggunakan `VITE_API_BASE_URL=/api`, bukan `localhost:8000`.
3. Restart frontend setelah mengubah `.env`.
4. Hapus port lama pada tab **PORTS**, jalankan ulang frontend, lalu forward kembali port `5173`.
5. Gunakan URL forwarded yang baru.

### Uji build tanpa mode development

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Jika memakai preview, forward port `4173`.

## Reset data sebelum serah terima

Sebelum aplikasi diberikan kepada pihak pengguna:

1. Simpan backup arsip internal secara terpisah.
2. Buat database baru dari migration atau kosongkan database operasional.
3. Hapus data fasilitator, pelatihan, pendidikan, review, dan data dummy.
4. Hapus file pada `storage/uploads` yang tidak boleh diserahkan.
5. Ganti `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan `AUTH_SECRET`.
6. Pastikan `.env` tidak ikut terunggah ke GitHub.
7. Uji login, upload, backup, dan restore menggunakan data baru.

Jangan menghapus folder migration karena migration diperlukan untuk membangun struktur database yang benar.

## Pembagian ownership pengembangan

| Modul | Owner | Lokasi utama |
| --- | --- | --- |
| Dashboard dan shell bersama | Raihan | `src/modules/dashboard`, `src/shared/layout` |
| Fasilitator, import Excel, pelatihan, generate CV | Sofi | `src/modules/fasilitator`, `src/modules/training`, `src/modules/cv` |
| Monitoring, rating/review, search, profil kompetensi | Daniel | `src/modules/monitoring`, `src/modules/search`, `src/modules/competency` |

Aturan kontribusi detail tersedia di [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). Kontrak endpoint tersedia di [`docs/DANIEL_API_CONTRACT.md`](docs/DANIEL_API_CONTRACT.md).
