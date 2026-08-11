import { useState } from 'react'
import { dashboardData } from './modules/dashboard/data/dashboardData'
import { DashboardPage } from './modules/dashboard/pages/DashboardPage'
import { AppShell } from './shared/layout/AppShell'
import { PlaceholderPage } from './shared/pages/PlaceholderPage'

const pages = {
  dashboard: { label: 'Dashboard', component: DashboardPage },
  fasilitator: { label: 'Fasilitator', component: PlaceholderPage, owner: 'Sofi' },
  pelatihan: { label: 'Pelatihan', component: PlaceholderPage, owner: 'Sofi' },
  monitoring: { label: 'Monitoring', component: PlaceholderPage, owner: 'Daniel' },
  pencarian: { label: 'Cari Fasilitator', component: PlaceholderPage, owner: 'Daniel' },
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const page = pages[activePage]
  const Page = page.component

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      <Page data={dashboardData} title={page.label} owner={page.owner} onNavigate={setActivePage} />
    </AppShell>
  )
}
