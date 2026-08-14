// src/modules/fasilitator/data/dokumenData.js
//
// Dokumen pendukung umum milik fasilitator (di luar foto/TTD yang
// sudah punya field khusus di fasilitatorData.js, dan di luar
// sertifikat pelatihan yang ada di pelatihanData.js).
// Contoh: SK, KTP, dokumen kepegawaian lain.

export const dokumenPendukungList = [
  {
    id: "dok-0001",
    fasilitatorId: "fas-0001",
    jenisDokumen: null, // ex: 'SK Pengangkatan', 'KTP', 'Dokumen Lainnya'
    namaFile: null,
    fileUrl: null,
    tanggalUpload: null,
  },
];

export function getDokumenByFasilitatorId(fasilitatorId) {
  return dokumenPendukungList.filter(
    (d) => d.fasilitatorId === fasilitatorId
  );
}