# Kontrak API — Monitoring dan Evaluasi

Modul Daniel hanya memakai data dari master fasilitator/pelatihan milik Sofi.

| Endpoint | Kegunaan |
| --- | --- |
| `GET /api/facilitators/monitoring?filter=` | tabel kelengkapan |
| `GET /api/facilitators/search?query=&competency=&min_rating=&status=` | pencarian server-side |
| `GET /api/facilitators/:id/competency-profile` | profil kompetensi |
| `POST /api/facilitators/:id/reviews` | body: `{ rating: 1..5, comment }` |

Endpoint monitoring mengembalikan `requirements[]` sebagai sumber kebenaran:

```json
{ "key": "photo", "label": "Foto", "isComplete": true }
```

Frontend menghitung persentase berdasarkan daftar tersebut, sehingga indikator mengikuti field database tanpa data fasilitator duplikat.
