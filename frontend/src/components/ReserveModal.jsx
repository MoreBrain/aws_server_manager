import { useState } from 'react'
import './ReserveModal.css'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function ReserveModal({ instance, onConfirm, onClose }) {
  const [date, setDate] = useState(today())
  const [startTime, setStartTime] = useState('09:00')
  const [stopTime, setStopTime] = useState('18:00')
  const [noStopTime, setNoStopTime] = useState(false)
  const [reservedBy, setReservedBy] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({
      date,
      start_time: startTime,
      stop_time: noStopTime ? null : stopTime,
      reserved_by: reservedBy,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Reserve Instance</h2>
        <p className="modal-subtitle">
          {instance.name || instance.instance_id} &middot; {instance.region}
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Your name
            <input
              type="text"
              value={reservedBy}
              onChange={(e) => setReservedBy(e.target.value)}
              placeholder="e.g. alice"
              required
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={date}
              min={today()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label>
            Start time
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </label>

          <label>
            Stop time
            <div className="stop-time-row">
              <input
                type="time"
                value={stopTime}
                disabled={noStopTime}
                onChange={(e) => setStopTime(e.target.value)}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={noStopTime}
                  onChange={(e) => setNoStopTime(e.target.checked)}
                />
                Don't stop
              </label>
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
