import { useState, useEffect, useCallback } from 'react'
import ServerTable from './components/ServerTable.jsx'
import ReserveModal from './components/ReserveModal.jsx'
import './App.css'

export default function App() {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reserveTarget, setReserveTarget] = useState(null)

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
    await fetch(`/api/instances/${instanceId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region }),
    })
    fetchInstances()
  }

  async function handleStop(instanceId, region) {
    await fetch(`/api/instances/${instanceId}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region }),
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
        <h1>AWS Server Manager</h1>
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
            onStart={handleStart}
            onStop={handleStop}
            onReserve={(instance) => setReserveTarget(instance)}
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
    </div>
  )
}
