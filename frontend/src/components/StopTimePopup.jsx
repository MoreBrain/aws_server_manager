import { useState, useEffect, useRef } from 'react'
import './StopTimePopup.css'

export default function StopTimePopup({ currentStopAt, onSave, onClose }) {
  // currentStopAt is like "2026-03-18 18:00" or null
  const initialTime = currentStopAt ? currentStopAt.split(' ')[1] : '18:00'
  const [time, setTime] = useState(initialTime)
  const [noStop, setNoStop] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  function handleSave() {
    onSave(noStop ? null : time)
  }

  return (
    <div className="stop-time-popup" ref={ref}>
      <input
        type="time"
        value={time}
        disabled={noStop}
        onChange={(e) => setTime(e.target.value)}
        autoFocus={!noStop}
      />
      <label className="stop-time-popup-check">
        <input
          type="checkbox"
          checked={noStop}
          onChange={(e) => setNoStop(e.target.checked)}
        />
        Don't stop
      </label>
      <div className="stop-time-popup-actions">
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
      </div>
    </div>
  )
}
