import { useEffect, useState } from 'react'
import { facilitatorEvaluationApi } from '../api/facilitatorEvaluationApi'
import { calculateCompleteness, monitoringStatus } from '../utils/completeness'
import { resolveAssetUrl } from '../../../shared/utils/resolveAssetUrl'

const filters = [['', 'Semua'], ['missing_photo', 'Belum Foto'], ['missing_signature', 'Belum TTD'], ['missing_certificate', 'Belum Sertifikat'], ['missing_material', 'Belum Materi'], ['incomplete', 'Data Belum Lengkap']]

export function MonitoringPage({ onSelectFacilitator, onNavigate }) {
  const [filter, setFilter] = useState('')
  const [state, setState] = useState({ loading: true, error: '', records: [] })
  useEffect(() => { let active = true; setState((s) => ({ ...s, loading: true, error: '' })); facilitatorEvaluationApi.getMonitoring({ filter }).then((payload) => active && setState({ loading: false, error: '', records: payload.data || payload })).catch((error) => active && setState({ loading: false, error: error.message, records: [] })); return () => { active = false } }, [filter])
  return <section className="module-page page-enter">
    <div className="module-banner">
      <div className="module-banner-content">
        <p className="eyebrow">MONITORING KELENGKAPAN</p>
        <h2>Data Fasilitator</h2>
        <p className="muted">Dokumen dan data penting yang dibaca dari master data fasilitator.</p>
      </div>
    </div>
    <div className="filter-tabs">{filters.map(([value, label]) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="table-panel">{state.loading ? <Loading text="Memuat data kelengkapan..." /> : state.error ? <ApiError message={state.error} /> : !state.records.length ? <Empty text="Belum ada data fasilitator untuk ditampilkan." /> : <table><thead><tr><th></th><th>Fasilitator</th><th>Foto</th><th>TTD</th><th>Sertifikat</th><th>Materi</th><th>Kelengkapan</th><th>Status</th><th></th></tr></thead><tbody>{state.records.map((record) => <MonitoringRow key={record.id} record={record} onSelect={onSelectFacilitator} onNavigate={onNavigate} />)}</tbody></table>}</div></section>
}

function MonitoringRow({ record, onSelect, onNavigate }) {
  const requirements = record.requirements || []
  const summary = calculateCompleteness(requirements)
  const status = monitoringStatus(requirements)
  const requirement = (key) => requirements.find((item) => item.key === key)?.isComplete
  return <tr>
    <td style={{ width: 44 }}>
      {record.photoUrl ? (
        <img src={resolveAssetUrl(record.photoUrl)} alt={record.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid #3e3451' }} />
      ) : (
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#c96df8,#7048dc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
          {(record.name || '?').charAt(0).toUpperCase()}
        </div>
      )}
    </td>
    <td><b>{record.name}</b><small>{record.position || '—'}</small></td>
    {['photo', 'signature', 'certificate', 'material'].map((key) => <td key={key}><span className={`check ${requirement(key) ? 'yes' : 'no'}`}>{requirement(key) ? '✓' : '—'}</span></td>)}
    <td><div className="progress"><span style={{ width: `${summary.percentage}%` }} /></div><small>{summary.percentage}% ({summary.completed}/{summary.total})</small></td>
    <td><span className={`badge ${status.tone}`}>{status.label}</span></td>
    <td>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="text-button" onClick={() => onSelect(record.id)}>Profil →</button>
        <button className="text-button" onClick={() => onNavigate?.('fasilitator-edit', record.id, 'monitoring')}>Edit</button>
      </div>
    </td>
  </tr>
}
export function Loading({ text }) { return <div className="module-state"><span className="spinner" /><p>{text}</p></div> }
export function Empty({ text }) { return <div className="module-state"><span>◌</span><p>{text}</p><small>Data akan tersedia setelah API master data terhubung.</small></div> }
export function ApiError({ message }) { return <div className="module-state error"><span>!</span><p>Data belum dapat dimuat.</p><small>{message}</small></div> }
