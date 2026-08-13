# Kontrak API — Monitoring dan Evaluasi

Modul Daniel memakai data master fasilitator dan riwayat pelatihan/kegiatan dari API ini.

## Fasilitator

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/facilitators` | daftar fasilitator |
| `GET` | `/api/facilitators/:id` | detail fasilitator |
| `POST` | `/api/facilitators` | membuat fasilitator |
| `PUT` | `/api/facilitators/:id` | memperbarui fasilitator |
| `DELETE` | `/api/facilitators/:id` | menghapus beserta data terkait |
| `POST` | `/api/facilitators/:id/photo` | upload foto multipart/form-data |
| `POST` | `/api/facilitators/:id/signature` | upload TTD multipart/form-data |

Body create/update menggunakan JSON. Field khusus CV:

```json
{
  "rank": "III/c",
  "officeAddress": "Jl. Alamat Kantor",
  "homeAddress": "Jl. Alamat Rumah",
  "competencies": [
    { "name": "Manajemen Pelatihan", "startedTeachingYear": 2018 }
  ]
}
```

`competencies` adalah array objek. Ini menjadi sumber bagian “Materi yang Diajarkan” pada CV; `startedTeachingYear` boleh `null`. Array string lama tetap diterima untuk kompatibilitas dan disimpan sebagai objek dengan tahun `null`.

Upload tidak dikirim sebagai base64 JSON. Kirim field file bernama `file` dengan `Content-Type: multipart/form-data`. Respons mengembalikan objek fasilitator dengan `photoUrl` atau `signatureUrl`, misalnya `/uploads/photo-....jpg`; file dapat diakses melalui host API, misalnya `http://localhost:8000/uploads/photo-....jpg`. Folder upload dipatok ke `<project>/storage/uploads` dan tidak bergantung pada folder tempat perintah `node server/index.js` dijalankan.

## Monitoring, pencarian, profil, dan ulasan

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/facilitators/monitoring?filter=` | tabel kelengkapan |
| `GET` | `/api/facilitators/search?query=&competency=&min_rating=&status=` | pencarian server-side |
| `GET` | `/api/facilitators/:id/competency-profile` | profil kompetensi lengkap |
| `POST` | `/api/facilitators/:id/reviews` | body `{ authorName, rating: 1..5, comment }` |

## Pelatihan / riwayat kegiatan

Tabel `trainings` dipakai untuk dua jenis data tersebut. `category=related_training` mengisi “Pendidikan/Pelatihan yang Terkait Materi”, sedangkan `category=teaching_experience` mengisi “Pengalaman Melatih/Mengajar”. `role` mengisi kolom Peran.

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/facilitators/:id/trainings` | daftar riwayat |
| `POST` | `/api/facilitators/:id/trainings` | body wajib `{ name, date: "YYYY" atau "YYYY-MM-DD" }` |
| `PUT` | `/api/facilitators/:id/trainings/:trainingId` | memperbarui riwayat |
| `DELETE` | `/api/facilitators/:id/trainings/:trainingId` | menghapus riwayat |

Field opsional riwayat: `material`, `organizer`, `role`, `category`, `certificateUrl`, `notes`.

Riwayat pendidikan juga tersedia melalui `GET/POST /api/facilitators/:id/educations`, `PUT/DELETE /api/facilitators/:id/educations/:educationId`. Body: `{ institution, degree, graduationYear }`.

## Mapping langsung ke Template CV Narasumber

| Bagian template | Field API |
| --- | --- |
| Nama, TTL, NIK, NIP, Pangkat/Gol., Jabatan, Unit Kerja | `name`, `birthInfo`, `nik`, `nip`, `rank`, `position`, `unit` |
| Alamat Kantor, Alamat Rumah, No. HP, Email | `officeAddress`, `homeAddress`, `phone`, `email` |
| Materi yang Diajarkan | `competencies[]` (`name`, `startedTeachingYear`) |
| Pendidikan/Pelatihan yang Terkait Materi | `trainings[]` dengan `category=related_training` |
| Pengalaman Melatih/Mengajar | `trainings[]` dengan `category=teaching_experience` dan `role` |
| TTD | `signatureUrl` dari endpoint upload signature |

Endpoint monitoring mengembalikan `requirements[]` sebagai sumber kebenaran. Database SQLite berada di `storage/upelkes.sqlite`; migration otomatis berjalan ketika API pertama kali dinyalakan.

Untuk deployment, isi `AUTH_SECRET` dan aktifkan `AUTH_REQUIRED=true`. Saat development, endpoint tulis terbuka.
