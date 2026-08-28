// Adapter sementara. Raihan dapat mengganti implementasi ini dengan API/database.
// Jangan menaruh query atau CRUD master data di modul dashboard.
export const dashboardData = {
  stats: [
    { key: 'facilitators', label: 'Total Fasilitator', value: null, tone: 'purple', icon: '♙' },
    { key: 'complete', label: 'Data Lengkap', value: null, tone: 'green', icon: '✓' },
    { key: 'incomplete', label: 'Data Belum Lengkap', value: null, tone: 'orange', icon: '!' },
    { key: 'activities', label: 'Total Pelatihan / Kegiatan', value: null, tone: 'blue', icon: '▣' },
    { key: 'newSubmissions', label: 'Pengajuan Baru', value: null, tone: 'pink', icon: '↗' },
    { key: 'thisMonth', label: 'Kegiatan Bulan Ini', value: null, tone: 'cyan', icon: '◷' },
  ],
  upcomingActivities: [],
  allActivities: [],
  calendarActivities: [],
  monitoring: [
    { key: 'photo', label: 'Belum memiliki foto', value: null },
    { key: 'signature', label: 'Belum memiliki TTD', value: null },
    { key: 'certificate', label: 'Belum memiliki sertifikat', value: null },
    { key: 'materials', label: 'Belum memiliki materi', value: null },
  ],
}
