import { useState, useEffect } from 'react'
import './IpCell.css'

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/

export default function IpCell({ instanceId, region, prefillIp }) {
  const [ip, setIp] = useState('')
  const [status, setStatus] = useState(null) // 'ok' | 'error' | null

  useEffect(() => {
    if (prefillIp && status !== 'ok') {
      setIp(prefillIp)
      setStatus(null)
    }
  }, [prefillIp])

  async function handleAdd() {
    if (!IP_RE.test(ip)) {
      setStatus('error')
      return
    }
    try {
      const res = await fetch(`/api/instances/${instanceId}/allow-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, ip }),
      })
      setStatus(res.ok ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="ip-cell">
      <input
        type="text"
        className={status === 'error' ? 'error' : ''}
        placeholder="x.x.x.x"
        value={ip}
        onChange={(e) => { setIp(e.target.value); setStatus(null) }}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        maxLength={15}
      />
      <button className="btn btn-secondary" onClick={handleAdd}>
        {status === 'ok' ? 'Added' : 'Add'}
      </button>
    </div>
  )
}
