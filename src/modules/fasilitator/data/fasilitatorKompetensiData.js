// src/modules/fasilitator/data/fasilitatorKompetensiData.js
//
// Junction table: materi/kompetensi yang diajarkan tiap fasilitator,
// beserta tahun mulai mengajarkannya. Ini yang mengisi tabel
// "Materi yang Diajarkan" (No | Nama Materi | Tahun) di CV.
//
// Kenapa dipisah dari kompetensiData.js: satu kompetensi bisa diajarkan
// banyak fasilitator di tahun berbeda-beda, jadi butuh tabel relasi
// tersendiri (bukan cuma array of IDs).

import { getKompetensiById } from "./kompetensiData";

export const fasilitatorKompetensiList = [
  {
    id: "faskomp-0001",
    fasilitatorId: "fas-0001",
    kompetensiId: "komp-0001",
    tahun: null, // ex: 2024 — tahun mulai mengajarkan materi ini
  },
];

// Dipakai halaman detail fasilitator & generate CV: gabungkan relasi
// dengan detail kompetensi dari master list, urut dari tahun terbaru.
export function getMateriDiajarkanByFasilitatorId(fasilitatorId) {
  return fasilitatorKompetensiList
    .filter((fk) => fk.fasilitatorId === fasilitatorId)
    .map((fk) => ({
      ...fk,
      kompetensi: getKompetensiById(fk.kompetensiId),
    }))
    .sort((a, b) => (b.tahun ?? 0) - (a.tahun ?? 0));
}