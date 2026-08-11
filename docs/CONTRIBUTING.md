# Panduan kerja paralel

## Branch

```text
main
├── feat/dashboard-raihan
├── feat/fasilitator-sofi
└── feat/monitoring-daniel
```

Sebelum mulai:

```bash
git switch main
git pull origin main
git switch -c feat/<modul>-<nama>
```

## Alur push dan merge

```bash
git add .
git commit -m "feat(dashboard): add dashboard foundation"
git push -u origin feat/<modul>-<nama>
```

Buat Pull Request ke `main`. Jangan push langsung ke `main`. Sebelum merge, owner branch melakukan rebase/merge dari `main` terbaru dan menyelesaikan konflik di branch sendiri.

## Batas file

- Raihan mengubah `src/modules/dashboard/**`, `src/shared/layout/**`, dan dokumentasi dashboard.
- Sofi membuat modul master data di `src/modules/fasilitator/**`, `src/modules/training/**`, dan `src/modules/cv/**`.
- Daniel membuat modul konsumsi/evaluasi di `src/modules/monitoring/**`, `src/modules/search/**`, dan `src/modules/competency/**`.
- `src/shared/**` adalah area bersama. Perubahan besar harus melalui PR dan diberi tahu ke semua anggota.
- Jangan mengedit file modul milik orang lain untuk menyelesaikan fitur sendiri.

## Kontrak data Dashboard

Dashboard mengharapkan adapter berikut:

```js
{
  stats: [{ key, label, value, tone, icon }],
  upcomingActivities: [{ id, name, facilitator, day, month, status }],
  calendarActivities: [{ id, title, date }],
  monitoring: [{ key, label, value }]
}
```

`value: null` berarti data belum tersedia dan UI akan menampilkan empty state/`—`. Ganti adapter dengan service API ketika endpoint backend siap; jangan menaruh angka produksi langsung di komponen UI.
