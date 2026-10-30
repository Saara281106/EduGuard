import { useState } from 'react'
import { AlertCircle, CalendarDays, Check } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { INTERVENTION_STATUSES, INTERVENTION_TYPES } from '../lib/riskEngine.js'
import { todayISO } from '../lib/format.js'
import Modal from './Modal.jsx'
import Avatar from './Avatar.jsx'
import RiskBadge from './RiskBadge.jsx'
import InterventionIcon from './InterventionIcon.jsx'

function defaultStudentId(students, preferredId) {
  if (preferredId) return preferredId
  const highest = [...students].sort((a, b) => b.riskScore - a.riskScore)[0]
  return highest ? highest.id : ''
}

export default function AssignInterventionModal({
  open = true,
  onClose,
  studentId = '',
  defaultType = '',
}) {
  const { students, assignIntervention } = useApp()
  const [selectedId, setSelectedId] = useState(() => defaultStudentId(students, studentId))
  const selected = students.find((student) => student.id === selectedId)
  const [type, setType] = useState(
    () =>
      defaultType ||
      students.find((student) => student.id === defaultStudentId(students, studentId))
        ?.recommendations?.[0]?.type ||
      'Parent Call',
  )
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('Pending')
  const [assignedDate, setAssignedDate] = useState(todayISO())
  const [completedDate, setCompletedDate] = useState(todayISO())
  const [error, setError] = useState('')

  const handleStudentChange = (event) => {
    const nextId = event.target.value
    setSelectedId(nextId)
    const nextStudent = students.find((student) => student.id === nextId)
    if (nextStudent?.recommendations?.length) {
      setType(nextStudent.recommendations[0].type)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!selected) {
      setError('Select a student before assigning an intervention.')
      return
    }
    if (!type) {
      setError('Choose an intervention type.')
      return
    }
    if (!assignedDate) {
      setError('Record the date this intervention was assigned.')
      return
    }
    if (status === 'Completed' && !completedDate) {
      setError('Completed interventions need a completion date.')
      return
    }
    if (status === 'Completed' && completedDate < assignedDate) {
      setError('The completion date cannot be before the assigned date.')
      return
    }

    assignIntervention(selected.id, {
      type,
      notes,
      status,
      assignedDate,
      completedDate: status === 'Completed' ? completedDate : null,
    })
    onClose()
  }

  const suggested = selected?.recommendations || []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign an intervention"
      subtitle="Log the support action and keep a dated record for follow-up."
    >
      <form className="entity-form compact" onSubmit={handleSubmit}>
        {error && (
          <div className="form-alert" role="alert">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="intervention-student">Student</label>
          <select
            id="intervention-student"
            className="select"
            value={selectedId}
            onChange={handleStudentChange}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} · {student.id} · {student.riskCategory} risk
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div className="mini-student-card">
            <Avatar name={selected.name} seed={selected.id} />
            <div>
              <strong>{selected.name}</strong>
              <span>
                {selected.institutionType} ·{' '}
                {selected.institutionType === 'School'
                  ? `Class ${selected.className}-${selected.section}`
                  : `${selected.department}, Sem ${selected.semester}`}
              </span>
            </div>
            <div className="mini-student-risk">
              <RiskBadge category={selected.riskCategory} small />
              <span>Score {selected.riskScore}/100</span>
            </div>
          </div>
        )}

        <div className="field">
          <label>Recommended for this student</label>
          <div className="recommendation-chips">
            {suggested.length === 0 && (
              <span className="muted-note">
                No major risk factors detected. Any intervention can still be assigned.
              </span>
            )}
            {suggested.map((item) => (
              <button
                key={item.type}
                type="button"
                className={`chip-button ${type === item.type ? 'active' : ''}`}
                onClick={() => setType(item.type)}
              >
                <InterventionIcon type={item.type} size={15} />
                {item.type}
                {type === item.type && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="intervention-type">Intervention type</label>
            <select
              id="intervention-type"
              className="select"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {INTERVENTION_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="intervention-status">Status</label>
            <select
              id="intervention-status"
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {INTERVENTION_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="assigned-date">Assigned date</label>
            <div className="input-with-icon">
              <CalendarDays size={16} />
              <input
                id="assigned-date"
                type="date"
                className="input"
                value={assignedDate}
                onChange={(event) => setAssignedDate(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="completed-date">Completed date</label>
            <div className="input-with-icon">
              <CalendarDays size={16} />
              <input
                id="completed-date"
                type="date"
                className="input"
                value={completedDate}
                disabled={status !== 'Completed'}
                onChange={(event) => setCompletedDate(event.target.value)}
              />
            </div>
            {status !== 'Completed' && (
              <span className="field-help">Enabled once the status is Completed.</span>
            )}
          </div>

          <div className="field field-span-2">
            <label htmlFor="intervention-notes">Notes</label>
            <textarea
              id="intervention-notes"
              className="input textarea"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What was agreed? Who attended? What is the follow-up?"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Check size={17} />
            Assign intervention
          </button>
        </div>
      </form>
    </Modal>
  )
}
