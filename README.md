# Sistem Informasi Fasilitator UPTD UPELKES Jawa Barat

Fondasi frontend untuk kerja paralel tiga developer. Dashboard sudah memiliki layout, navigasi, komponen ringkasan, empty state, dan kontrak data yang siap dihubungkan ke backend.

## Menjalankan project

```bash
npm install
npm run dev
```

## Pembagian ownership

| Modul | Owner | Lokasi utama |
| --- | --- | --- |
| Dashboard + shell bersama | Raihan | `src/modules/dashboard`, `src/shared/layout` |
| Fasilitator, Import Excel, Pelatihan, Generate CV | Sofi | `src/modules/fasilitator`, `src/modules/training`, `src/modules/cv` |
| Monitoring, Rating/Review, Search, Profil Kompetensi | Daniel | `src/modules/monitoring`, `src/modules/search`, `src/modules/competency` |

Aturan detail kolaborasi ada di [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

## Prinsip integrasi

- Semua pekerjaan dimulai dari `main` terbaru dan dikerjakan pada branch fitur masing-masing.
- Dashboard tidak memiliki CRUD master data. Ia hanya membaca `DashboardData` dari adapter di `src/modules/dashboard/data/dashboardData.js`.
- Sofi adalah pemilik master data fasilitator dan pelatihan.
- Daniel membaca data Sofi untuk monitoring dan evaluasi; jangan membuat model fasilitator duplikat.
- Perubahan file milik owner lain dibahas dulu melalui pull request.
