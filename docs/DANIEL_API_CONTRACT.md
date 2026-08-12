# Kontrak API — Monitoring dan Evaluasi

Modul Daniel hanya memakai data dari master fasilitator/pelatihan milik Sofi.

| Endpoint | Kegunaan |
| --- | --- |
| `GET /api/facilitators/monitoring?filter=` | tabel kelengkapan |
| `GET /api/facilitators/search?query=&competency=&min_rating=&status=` | pencarian server-side |
| `GET /api/facilitators/:id/competency-profile` | profil kompetensi |
| `POST /api/facilitators/:id/reviews` | body: `{ authorName, rating: 1..5, comment }` |

Endpoint monitoring mengembalikan `requirements[]` sebagai sumber kebenaran:

```json
{ "key": "photo", "label": "Foto", "isComplete": true }
```

Frontend menghitung persentase berdasarkan daftar tersebut, sehingga indikator mengikuti field database tanpa data fasilitator duplikat.

## Backend lokal

Jalankan pada dua terminal:

```bash
npm run dev:api
npm run dev
```

Database SQLite berada di `storage/upelkes.sqlite`; migration otomatis berjalan ketika API pertama kali dinyalakan. Endpoint master data yang digunakan frontend Sofi tersedia di `POST /api/facilitators` dan `PUT /api/facilitators/:id`.

Untuk keamanan deployment, isi `AUTH_SECRET` dan aktifkan `AUTH_REQUIRED=true`. Saat development, endpoint tulis terbuka agar frontend dapat diintegrasikan lebih dahulu.
