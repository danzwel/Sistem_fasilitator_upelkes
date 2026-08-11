// src/modules/training/data/pelatihanData.js
//
// Riwayat pelatihan/kegiatan tempat fasilitator BERPERAN mengajar/melatih
// (bukan pelatihan yang mereka ikuti sebagai peserta — itu ada di
// pendidikanPelatihanTerkaitData.js). Mengisi tabel "Pengalaman
// Melatih/Mengajar" di CV (No | Nama Pelatihan/Kegiatan | Peran |
// Penyelenggara | Tahun).
//
// Relasi ke fasilitator lewat `fasilitatorId` supaya otomatis muncul di
// halaman detail fasilitator & di CV.

export const pelatihanList = [
  {
    id: "latih-0001",
    fasilitatorId: "fas-0001",
    namaPelatihan: null,
    materi: null,
    peran: null, // ex: 'Narasumber', 'Fasilitator', 'Instruktur' — kolom "Peran" di CV
    tanggal: null, // 'YYYY-MM-DD'
    penyelenggara: null,
    sertifikatUrl: null,
    catatan: null,
    status: "terjadwal", // 'terjadwal' | 'selesai' | 'dibatalkan'
    createdAt: null,
    updatedAt: null,
  },
];

export function getPelatihanByFasilitatorId(fasilitatorId) {
  return pelatihanList
    .filter((p) => p.fasilitatorId === fasilitatorId)
    .sort((a, b) => new Date(b.tanggal ?? 0) - new Date(a.tanggal ?? 0));
}