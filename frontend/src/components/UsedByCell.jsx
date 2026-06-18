import { useState, useEffect } from 'react'
import './UsedByCell.css'

export default function UsedByCell({ instanceId, usedBy, onSave }) {
  const [value, setValue] = useState(usedBy || '')
  const [saved, setSaved] = useState(false)

  // Keep the input in sync when the server data refreshes.
  useEffect(() => {
    setValue(usedBy || '')
  }, [usedBy])

  const dirty = value.trim() !== (usedBy || '')

  async function handleSave() {
    await onSave(instanceId, value.trim() || null)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="usedby-cell">
      <input
        type="text"
        placeholder="initials"
        value={value}
        maxLength={5}
        onChange={(e) => { setValue(e.target.value.toUpperCase()); setSaved(false) }}
        onKeyDown={(e) => e.key === 'Enter' && dirty && handleSave()}
      />
      <button
        className="btn btn-secondary"
        disabled={!dirty}
        onClick={handleSave}
      >
        {saved ? 'Saved' : 'Set'}
      </button>
    </div>
  )
}
