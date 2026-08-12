import { useState } from 'react'
import { dashboardData } from './modules/dashboard/data/dashboardData'
import { DashboardPage } from './modules/dashboard/pages/DashboardPage'
import { MonitoringPage } from './modules/monitoring/pages/MonitoringPage'
import { SearchPage } from './modules/search/pages/SearchPage'
import { CompetencyProfilePage } from './modules/competency/pages/CompetencyProfilePage'
import { AppShell } from './shared/layout/AppShell'
import { PlaceholderPage } from './shared/pages/PlaceholderPage'
import { FasilitatorPage } from './modules/fasilitator/pages/FasilitatorPage'

const pages = {
  dashboard: { label: 'Dashboard', component: DashboardPage },
  fasilitator: { label: 'Fasilitator', component: FasilitatorPage },
  pelatihan: { label: 'Pelatihan', component: PlaceholderPage, owner: 'Sofi' },
  monitoring: { label: 'Monitoring', component: MonitoringPage, owner: 'Daniel' },
  pencarian: { label: 'Cari Fasilitator', component: SearchPage, owner: 'Daniel' },
  kompetensi: { label: 'Profil Kompetensi', component: CompetencyProfilePage, owner: 'Daniel' },
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState(null)
  const page = pages[activePage]
  const Page = page.component

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      <Page data={dashboardData} title={page.label} owner={page.owner} onNavigate={setActivePage} selectedFacilitatorId={selectedFacilitatorId} onSelectFacilitator={(id) => { setSelectedFacilitatorId(id); setActivePage('kompetensi') }} />
    </AppShell>
  )
}
