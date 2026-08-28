const PREFIX_DEGREES = /^(prof\.?|dr\.?|drg\.?|ir\.?|h\.?|hj\.?|kh\.?|r\.?|dra\.?|drs\.?|tn\.?|ny\.?|nyi\.?)$/i

export function formatFacilitatorName(personOrName, degreeValue) {
  const name = typeof personOrName === 'string' ? personOrName : personOrName?.name
  const degree = typeof personOrName === 'string' ? degreeValue : personOrName?.degree
  if (!name) return '-'
  const parts = String(degree || '').split(',').map((part) => part.trim()).filter(Boolean)
  const prefix = []
  const suffix = []
  for (const part of parts) {
    if (!suffix.length && PREFIX_DEGREES.test(part)) prefix.push(part)
    else suffix.push(part)
  }
  return [prefix.join(' '), name, suffix.length ? `, ${suffix.join(', ')}` : ''].filter(Boolean).join(' ')
}

export function completenessScore(person) {
  return Object.values(person?.completeness?.checks || {}).filter(Boolean).length
}

export function compareRecommendedFacilitators(a, b) {
  return completenessScore(b) - completenessScore(a)
    || Number(b?.rating?.average ?? b?.averageRating ?? 0) - Number(a?.rating?.average ?? a?.averageRating ?? 0)
    || String(a?.name || '').localeCompare(String(b?.name || ''))
}
