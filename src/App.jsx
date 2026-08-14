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


const pages = {
  dashboard: { label: 'Dashboard', component: DashboardPage },
  fasilitator: { label: 'Fasilitator', component: FasilitatorPage },
  'fasilitator-tambah': { label: 'Tambah Fasilitator', component: FasilitatorFormPage },
  'fasilitator-edit': { label: 'Edit Fasilitator', component: FasilitatorFormPage },
  'fasilitator-detail': { label: 'Detail Fasilitator', component: FasilitatorDetailPage },
  'fasilitator-cv': { label: 'CV Fasilitator', component: CvPreviewPage },
  'fasilitator-import': { label: 'Import Excel', component: ImportExcelPage },
  pelatihan: { label: 'Pelatihan', component: PelatihanPage },
  monitoring: { label: 'Monitoring', component: MonitoringPage, owner: 'Daniel' },
  pencarian: { label: 'Cari Fasilitator', component: SearchPage, owner: 'Daniel' },
  kompetensi: { label: 'Profil Kompetensi', component: CompetencyProfilePage, owner: 'Daniel' },
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState(null)
  const page = pages[activePage]
  const Page = page.component

  function handleNavigate(pageId, facilitatorId = null) {
    setSelectedFacilitatorId(facilitatorId)
    setActivePage(pageId)
  }

  return (
    <AppShell activePage={activePage} onNavigate={handleNavigate}>
      <Page
        data={dashboardData}
        title={page.label}
        owner={page.owner}
        onNavigate={handleNavigate}
        facilitatorId={selectedFacilitatorId}
        selectedFacilitatorId={selectedFacilitatorId}
        onSelectFacilitator={(id) => handleNavigate('kompetensi', id)}
      />
    </AppShell>
  )
}
