import { useState } from 'react'
import { dashboardData } from './modules/dashboard/data/dashboardData'
import { DashboardPage } from './modules/dashboard/pages/DashboardPage'
import { MonitoringPage } from './modules/monitoring/pages/MonitoringPage'
import { SearchPage } from './modules/search/pages/SearchPage'
import { CompetencyProfilePage } from './modules/competency/pages/CompetencyProfilePage'
import { AppShell } from './shared/layout/AppShell'
import { PlaceholderPage } from './shared/pages/PlaceholderPage'
import { FasilitatorPage } from './modules/fasilitator/pages/FasilitatorPage'
import { FasilitatorFormPage } from './modules/fasilitator/pages/FasilitatorFormPage'
import { FasilitatorDetailPage } from './modules/fasilitator/pages/FasilitatorDetailPage'
import { CvPreviewPage } from './modules/cv/pages/CvPreviewPage'
import { PelatihanPage } from './modules/training/pages/PelatihanPage'
import { ImportExcelPage } from './modules/fasilitator/pages/ImportExcelPage'
import { ImportPelatihanExcelPage } from './modules/training/pages/ImportPelatihanExcelPage'

const pages = {
  dashboard: { label: 'Dashboard', component: DashboardPage },
  fasilitator: { label: 'Fasilitator', component: FasilitatorPage },
  'fasilitator-tambah': { label: 'Tambah Fasilitator', component: FasilitatorFormPage },
  'fasilitator-edit': { label: 'Edit Fasilitator', component: FasilitatorFormPage },
  'fasilitator-detail': { label: 'Detail Fasilitator', component: FasilitatorDetailPage },
  'fasilitator-cv': { label: 'CV Fasilitator', component: CvPreviewPage },
  'fasilitator-import': { label: 'Import Excel', component: ImportExcelPage },
  pelatihan: { label: 'Pelatihan', component: PelatihanPage },
  'pelatihan-import': { label: 'Import Excel Pelatihan', component: ImportPelatihanExcelPage },
  monitoring: { label: 'Monitoring', component: MonitoringPage, owner: 'Daniel' },
  pencarian: { label: 'Cari Fasilitator', component: SearchPage, owner: 'Daniel' },
  kompetensi: { label: 'Profil Kompetensi', component: CompetencyProfilePage, owner: 'Daniel' },
}

// Halaman-halaman ini butuh "reset total" tiap ganti fasilitator (biar file
// upload yang kepilih nggak nyangkut dari sesi sebelumnya). Halaman lain
// (termasuk 'pencarian') SENGAJA TIDAK dikasih key ini, supaya state
// internalnya (misal hasil pencarian) nggak ke-reset pas ganti halaman.
const REMOUNT_ON_FACILITATOR_CHANGE = [
  'fasilitator-edit',
  'fasilitator-tambah',
  'fasilitator-detail',
  'fasilitator-cv',
]

const APP_STATE_KEY = 'upelkes:last-route'
const initialRoute = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(APP_STATE_KEY) || '{}')
    return pages[saved.activePage] ? saved : {}
  } catch {
    return {}
  }
}

export default function App() {
  const [route] = useState(initialRoute)
  const [activePage, setActivePage] = useState(route.activePage || 'dashboard')
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState(route.selectedFacilitatorId || null)
  const [cvReturnTo, setCvReturnTo] = useState(route.cvReturnTo || 'fasilitator-detail')
  const page = pages[activePage]
  const Page = page.component

  function handleNavigate(pageId, facilitatorId = null, returnTo = null) {
    const nextReturnTo = pageId === 'fasilitator-cv' ? (returnTo || 'fasilitator-detail') : cvReturnTo
    setSelectedFacilitatorId(facilitatorId)
    if (pageId === 'fasilitator-cv') {
      setCvReturnTo(nextReturnTo)
    }
    setActivePage(pageId)
    localStorage.setItem(APP_STATE_KEY, JSON.stringify({ activePage: pageId, selectedFacilitatorId: facilitatorId, cvReturnTo: nextReturnTo }))
  }

  const pageKey = REMOUNT_ON_FACILITATOR_CHANGE.includes(activePage)
    ? `${activePage}-${selectedFacilitatorId ?? 'new'}`
    : activePage

  return (
    <AppShell activePage={activePage} onNavigate={handleNavigate}>
      <Page
        key={pageKey}
        data={dashboardData}
        title={page.label}
        owner={page.owner}
        onNavigate={handleNavigate}
        facilitatorId={selectedFacilitatorId}
        selectedFacilitatorId={selectedFacilitatorId}
        cvReturnTo={cvReturnTo}
        onSelectFacilitator={(id) => handleNavigate('kompetensi', id)}
      />
    </AppShell>
  )
}
