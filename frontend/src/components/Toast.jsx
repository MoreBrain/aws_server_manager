import { useEffect } from 'react'
import './Toast.css'

export default function Toast({ message, type = 'error', onClose, duration = 6000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  )
}
