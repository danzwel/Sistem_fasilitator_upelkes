// src/modules/fasilitator/data/kompetensiData.js
//
// Master list kompetensi/materi. Relasi ke fasilitator (termasuk tahun
// mulai mengajarkannya, sesuai kolom "Tahun" di tabel "Materi yang
// Diajarkan" pada CV) ada di fasilitatorKompetensiData.js, BUKAN di sini,
// supaya master list ini tetap independen dan reusable.

export const kompetensiList = [
  {
    id: "komp-0001",
    nama: "Contoh Materi/Kompetensi",
    kategori: null, // ex: 'Manajerial', 'Teknis', 'Kepemimpinan' — opsional, buat pengelompokan filter
    deskripsi: null,
  },
];

export function getKompetensiById(id) {
  return kompetensiList.find((k) => k.id === id) ?? null;
}