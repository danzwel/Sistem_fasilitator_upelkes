export function calculateCompleteness(requirements = []) {
  const total = requirements.length
  const completed = requirements.filter((item) => item.isComplete).length
  return { total, completed, percentage: total ? Math.round((completed / total) * 100) : 0 }
}

export function monitoringStatus(requirements = []) {
  const missing = requirements.filter((item) => !item.isComplete)
  if (!missing.length && requirements.length) return { label: 'Lengkap', tone: 'complete' }
  if (!missing.length) return { label: 'Belum ada data', tone: 'missing' }
  return { label: `Perlu ${missing[0].label}`, tone: 'missing' }
}
