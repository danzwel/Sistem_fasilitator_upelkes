// src/modules/fasilitator/data/pendidikanPelatihanTerkaitData.js
//
// Mengisi tabel "Pendidikan/Pelatihan yang Terkait Materi" di CV
// (No | Nama Pendidikan/Pelatihan | Penyelenggara | Tahun).
//
// TODO(konfirmasi Adpen): definisi entitas ini masih ASUMSI SEMENTARA —
// diasumsikan sebagai sertifikasi/training singkat yang relevan dengan
// materi yang diajarkan (BUKAN gelar formal di pendidikanData.js, dan
// BUKAN pengalaman mengajar/menjadi fasilitator di pelatihanData.js).
// Konfirmasi ke Adpen / pemberi template sebelum modul ini dianggap final,
// karena bisa jadi field ini sebenarnya duplikat dari salah satu entitas
// lain dan cukup direferensikan, bukan dibuat tabel baru.

export const pendidikanPelatihanTerkaitList = [
  {
    id: "diklat-0001",
    fasilitatorId: "fas-0001",
    namaPendidikanPelatihan: null,
    penyelenggara: null,
    tahun: null,
    sertifikatUrl: null, // opsional, dokumen pendukung kalau ada
  },
];

export function getPendidikanPelatihanTerkaitByFasilitatorId(fasilitatorId) {
  return pendidikanPelatihanTerkaitList
    .filter((p) => p.fasilitatorId === fasilitatorId)
    .sort((a, b) => (b.tahun ?? 0) - (a.tahun ?? 0));
}