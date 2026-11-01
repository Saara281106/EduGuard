import { useState } from 'react'
import { AlertCircle, ArrowDownRight, ArrowUpRight, Check, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { todayISO } from '../lib/format.js'
import Modal from './Modal.jsx'

function Delta({ value, suffix = '' }) {
  if (value === 0) return <span className="delta delta-flat">No change</span>
  const positive = value > 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`delta ${positive ? 'delta-up' : 'delta-down'}`}>
      <Icon size={13} />
      {positive ? '+' : ''}
      {value}
      {suffix}
    </span>
  )
}

export default function ProgressModal({ open = true, onClose, student }) {
  const { addProgressUpdate } = useApp()
  const [attendance, setAttendance] = useState(String(student.attendance))
  const [marks, setMarks] = useState(String(student.marks))
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const attendanceDelta = (Number(attendance) || 0) - student.attendance
  const marksDelta = (Number(marks) || 0) - student.marks

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextAttendance = Number(attendance)
    const nextMarks = Number(marks)

    if (
      attendance === '' ||
      Number.isNaN(nextAttendance) ||
      nextAttendance < 0 ||
      nextAttendance > 100
    ) {
      setError('Attendance must be a number between 0 and 100.')
      return
    }
    if (marks === '' || Number.isNaN(nextMarks) || nextMarks < 0 || nextMarks > 100) {
      setError('Marks must be a number between 0 and 100.')
      return
    }
    if (!date) {
      setError('Choose the date of this progress check-in.')
      return
    }

    addProgressUpdate(student.id, {
      attendance: nextAttendance,
      marks: nextMarks,
      date,
      note,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a progress check-in"
      subtitle={`Update the latest attendance and marks for ${student.name}.`}
    >
      <form className="entity-form compact" onSubmit={handleSubmit}>
        {error && (
          <div className="form-alert" role="alert">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <div className="progress-modal-current">
          <div>
            <span>Current attendance</span>
            <strong>{student.attendance}%</strong>
          </div>
          <div>
            <span>Current marks</span>
            <strong>{student.marks}%</strong>
          </div>
          <div>
            <span>Current risk</span>
            <strong>{student.riskScore}/100</strong>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="progress-attendance">New attendance (%)</label>
            <input
              id="progress-attendance"
              type="number"
              min="0"
              max="100"
              className="input"
              value={attendance}
              onChange={(event) => setAttendance(event.target.value)}
            />
            <Delta value={attendanceDelta} suffix="%" />
          </div>

          <div className="field">
            <label htmlFor="progress-marks">New marks (%)</label>
            <input
              id="progress-marks"
              type="number"
              min="0"
              max="100"
              className="input"
              value={marks}
              onChange={(event) => setMarks(event.target.value)}
            />
            <Delta value={marksDelta} suffix="%" />
          </div>

          <div className="field field-span-2">
            <label htmlFor="progress-date">Check-in date</label>
            <input
              id="progress-date"
              type="date"
              className="input"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="field field-span-2">
            <label htmlFor="progress-note">Follow-up note</label>
            <textarea
              id="progress-note"
              className="input textarea"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Attended remedial classes regularly and improved test scores."
            />
          </div>
        </div>

        <div className="progress-hint">
          <TrendingUp size={17} />
          {student.dataSource === 'dataset'
            ? 'Saving this check-in adds a before/after point to the progress chart. The ML prediction stays fixed to the uploaded dataset until a new dataset is uploaded.'
            : 'Saving this check-in recalculates the risk score and adds a before/after point to the progress chart.'}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Check size={17} />
            Save progress
          </button>
        </div>
      </form>
    </Modal>
  )
}
