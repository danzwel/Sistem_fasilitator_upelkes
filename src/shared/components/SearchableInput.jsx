export function SearchableInput({ id, label, value, onChange, options, placeholder, required, className = 'form-field' }) {
  return <label className={className}>
    {label && <span>{label}</span>}
    <input list={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
    <datalist id={id}>{options.map((option) => <option key={option} value={option} />)}</datalist>
  </label>
}
