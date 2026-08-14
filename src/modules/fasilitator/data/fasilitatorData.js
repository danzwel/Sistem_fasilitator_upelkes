// src/modules/fasilitator/data/fasilitatorData.js
//
// Kontrak data dummy untuk modul Fasilitator.
// Field & label di bawah disamakan persis dengan Template_CV_Narasumber.docx
// dan kolom "BANK DATA FASILITATOR" di file Excel referensi Adpen.
//
// Nilai `null` = data belum diisi (UI tampilkan '-' atau empty state).

export const fasilitatorList = [
  {
    id: "fas-0001",
    nama: "Contoh Nama Fasilitator",
    gelar: null, // ex: "S.Pd., M.M." — ditulis nempel ke nama di CV
    tempatLahir: null,
    tanggalLahir: null, // 'YYYY-MM-DD'
    nik: null,
    nip: null,
    pangkatGolongan: null, // label CV: "Pangkat/Gol."
    jabatan: null,
    unitKerja: null,
    alamatKantor: null, // dua field alamat terpisah sesuai template CV
    alamatRumah: null,
    noHp: null,
    email: null,
    fotoUrl: null, // ditampilkan di pojok kanan atas CV (bukan bagian layout asli docx, ditambahkan saat generate PDF)
    ttdUrl: null,
    pengalamanMengajar: null, // ringkasan bebas, opsional — detail per kegiatan ada di pelatihanData.js
    statusKelengkapan: "belum_lengkap", // 'lengkap' | 'belum_lengkap'
    createdAt: null,
    updatedAt: null,
  },
];

export function getFasilitatorById(id) {
  return fasilitatorList.find((f) => f.id === id) ?? null;
}

// 14 field ini persis kolom "kelengkapan data" yang dipakai Adpen di sheet
// BANK DATA FASILITATOR / Rekap Kelengkapan Data. Dipusatkan di sini supaya
// Daniel bisa reuse definisi yang sama persis untuk modul Monitoring dia,
// tanpa perlu menduga-duga field mana yang dicek.
export const FIELD_KELENGKAPAN_WAJIB = [
  "nama",
  "tempatLahir",
  "tanggalLahir",
  "nik",
  "nip",
  "pangkatGolongan",
  "jabatan",
  "unitKerja",
  "alamatKantor",
  "alamatRumah",
  "noHp",
  "email",
  "fotoUrl",
  "ttdUrl",
  // riwayatPendidikan, materiYangDiajarkan, pendidikanPelatihanTerkait,
  // pengalamanMengajar dicek terpisah karena datanya ada di tabel lain
  // (lihat hitungStatusKelengkapan di bawah)
];

export function hitungStatusKelengkapan(fasilitator, relasiData = {}) {
  const {
    punyaRiwayatPendidikan = false,
    punyaMateriDiajarkan = false,
    punyaPengalamanMengajar = false,
  } = relasiData;

  const adaFieldKosong = FIELD_KELENGKAPAN_WAJIB.some(
    (field) => !fasilitator[field]
  );

  const belumLengkap =
    adaFieldKosong ||
    !punyaRiwayatPendidikan ||
    !punyaMateriDiajarkan ||
    !punyaPengalamanMengajar;

  return belumLengkap ? "belum_lengkap" : "lengkap";
}