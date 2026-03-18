import { useState, useEffect } from 'react'
import IpCell from './IpCell.jsx'
import './ServerTable.css'

const STATUS_COLORS = {
  running:         '#22c55e',
  stopped:         '#94a3b8',
  pending:         '#f59e0b',
  stopping:        '#f97316',
  'shutting-down': '#ef4444',
  retry:           '#a855f7',
}

export default function ServerTable({ instances, onStart, onStop, onReserve }) {
  const [myIp, setMyIp] = useState(null)

  useEffect(() => {
    fetch('https://checkip.amazonaws.com/')
      .then(res => res.text())
      .then(text => setMyIp(text.trim()))
      .catch(() => {})
  }, [])

  if (instances.length === 0) {
    return <p className="status-msg">No instances found.</p>
  }

  return (
    <div className="table-wrapper">
      <table className="server-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Instance ID</th>
            <th>Region</th>
            <th>Type</th>
            <th>Status</th>
            <th>Public IP</th>
            <th>Cost / hr</th>
            <th>Reserved by</th>
            <th>Start</th>
            <th>Stop at</th>
            <th>Home Office IP</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instances.map((inst) => (
            <tr key={inst.instance_id}>
              <td>{inst.name || '—'}</td>
              <td className="mono">{inst.instance_id}</td>
              <td>{inst.region}</td>
              <td className="mono">{inst.instance_type}</td>
              <td>
                <span
                  className="status-badge"
                  style={{ '--color': STATUS_COLORS[inst.status] ?? '#94a3b8' }}
                >
                  {inst.status}
                </span>
              </td>
              <td className="mono">
                {inst.public_ip
                  ? <a href={`https://${inst.public_ip}:8443`} target="_blank" rel="noreferrer">{inst.public_ip}</a>
                  : '—'}
              </td>
              <td>{inst.cost_per_hour != null ? `$${inst.cost_per_hour.toFixed(3)}` : '—'}</td>
              <td>{inst.reserved_by || '—'}</td>
              <td>{inst.scheduled_start || '—'}</td>
              <td>{inst.stop_at || '—'}</td>
              <td><IpCell instanceId={inst.instance_id} region={inst.region} prefillIp={myIp} /></td>
              <td className="actions">
                <button
                  className="btn btn-primary"
                  disabled={inst.status === 'running' || inst.status === 'pending'}
                  onClick={() => onStart(inst.instance_id, inst.region)}
                >
                  Start
                </button>
                <button
                  className="btn btn-danger"
                  disabled={inst.status === 'stopped' || inst.status === 'stopping'}
                  onClick={() => onStop(inst.instance_id, inst.region)}
                >
                  Stop
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => onReserve(inst)}
                >
                  Reserve
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
