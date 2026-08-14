// src/modules/fasilitator/data/pendidikanData.js
//
// Riwayat pendidikan formal (SD s.d. S3), banyak per fasilitator.
// Format tanggal mengikuti tampilan CV: "Universitas X – Kota, Negara
// Sept 2023 – Sept 2025" lalu baris "S2 Administrasi Pendidikan".

export const pendidikanList = [
  {
    id: "didik-0001",
    fasilitatorId: "fas-0001",
    jenjang: null, // 'SD' | 'SMP' | 'SMA/SMK' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3'
    jurusan: null, // relevan untuk D3 ke atas, null untuk SD/SMP/SMA
    namaInstitusi: null,
    kota: null,
    negara: "Indonesia",
    tanggalMulai: null, // 'YYYY-MM' cukup bulan+tahun, sesuai tampilan CV
    tanggalSelesai: null, // 'YYYY-MM', null jika masih berjalan
    dokumenPendukungUrl: null, // ijazah, opsional
  },
];

export function getPendidikanByFasilitatorId(fasilitatorId) {
  return pendidikanList
    .filter((p) => p.fasilitatorId === fasilitatorId)
    .sort((a, b) => (b.tanggalSelesai ?? "").localeCompare(a.tanggalSelesai ?? ""));
}

export function getPendidikanTerakhir(fasilitatorId) {
  return getPendidikanByFasilitatorId(fasilitatorId)[0] ?? null;
}

// Helper format tampilan sesuai baris di CV, ex:
// "Universitas Pendidikan Indonesia – Bandung, Indonesia  Sept 2023 – Sept 2025"
// "S2 Administrasi Pendidikan"
export function formatBarisPendidikan(pendidikan) {
  const lokasi = [pendidikan.kota, pendidikan.negara].filter(Boolean).join(", ");
  const rentang = [pendidikan.tanggalMulai, pendidikan.tanggalSelesai]
    .filter(Boolean)
    .join(" – ");
  const baris1 = [pendidikan.namaInstitusi, lokasi].filter(Boolean).join(" – ");
  const baris2 = [pendidikan.jenjang, pendidikan.jurusan].filter(Boolean).join(" ");
  return { baris1, rentang, baris2 };
}