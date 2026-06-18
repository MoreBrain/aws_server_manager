import { useState, useEffect, useCallback } from 'react'
import ServerTable from './components/ServerTable.jsx'
import ReserveModal from './components/ReserveModal.jsx'
import Toast from './components/Toast.jsx'
import fpLogo from './images/fp-logo.png'
import './App.css'

export default function App() {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [reserveTarget, setReserveTarget] = useState(null)
  const [busy, setBusy] = useState({}) // instance_id -> 'start' | 'stop'

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/instances')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setInstances(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInstances()
    const interval = setInterval(fetchInstances, 30000)
    return () => clearInterval(interval)
  }, [fetchInstances])

  async function handleStart(instanceId, region) {
    setBusy(b => ({ ...b, [instanceId]: 'start' }))
    try {
      const res = await fetch(`/api/instances/${instanceId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const detail = data.detail || `HTTP ${res.status}`
        const message = detail === 'InsufficientInstanceCapacity'
          ? `Could not start ${instanceId}: AWS has insufficient capacity in ${region} right now. Try again shortly or reserve it to retry automatically.`
          : `Could not start ${instanceId}: ${detail}`
        setToast({ type: 'error', message })
      }
    } catch (e) {
      setToast({ type: 'error', message: `Could not start ${instanceId}: ${e.message}` })
    } finally {
      await fetchInstances()
      setBusy(b => { const { [instanceId]: _, ...rest } = b; return rest })
    }
  }

  async function handleStop(instanceId, region) {
    setBusy(b => ({ ...b, [instanceId]: 'stop' }))
    try {
      await fetch(`/api/instances/${instanceId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
      })
    } catch (e) {
      setToast({ type: 'error', message: `Could not stop ${instanceId}: ${e.message}` })
    } finally {
      await fetchInstances()
      setBusy(b => { const { [instanceId]: _, ...rest } = b; return rest })
    }
  }

  async function handleSetStopTime(instanceId, region, stopTime) {
    await fetch(`/api/instances/${instanceId}/stop-time`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stop_time: stopTime, region }),
    })
    fetchInstances()
  }

  async function handleSetUsedBy(instanceId, usedBy) {
    await fetch(`/api/instances/${instanceId}/used-by`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ used_by: usedBy }),
    })
    fetchInstances()
  }

  async function handleReserve(instanceId, reservation) {
    await fetch(`/api/instances/${instanceId}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reservation, region: reserveTarget.region }),
    })
    setReserveTarget(null)
    fetchInstances()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <img src={fpLogo} alt="FP" className="app-logo" />
          <h1>AWS Server Manager</h1>
        </div>
        <button className="btn btn-secondary" onClick={fetchInstances}>
          Refresh
        </button>
      </header>

      <main className="app-main">
        {loading && <p className="status-msg">Loading instances...</p>}
        {error && <p className="status-msg error">Error: {error}</p>}
        {!loading && !error && (
          <ServerTable
            instances={instances}
            busy={busy}
            onStart={handleStart}
            onStop={handleStop}
            onReserve={(instance) => setReserveTarget(instance)}
            onSetStopTime={handleSetStopTime}
            onSetUsedBy={handleSetUsedBy}
          />
        )}
      </main>

      {reserveTarget && (
        <ReserveModal
          instance={reserveTarget}
          onConfirm={(reservation) => handleReserve(reserveTarget.instance_id, reservation)}
          onClose={() => setReserveTarget(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
