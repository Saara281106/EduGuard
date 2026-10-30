import { useMemo, useState } from 'react'
import { AlertCircle, GraduationCap, Save, School } from 'lucide-react'
import { computeRisk } from '../lib/riskEngine.js'
import RiskBadge from './RiskBadge.jsx'

const SCHOOL_OPTIONS = ['Sunrise Public School', 'Greenwood International School']
const COLLEGE_OPTIONS = ['Northfield College of Arts & Science', 'Crescent Institute of Technology']
const DEPARTMENTS = [
  'Computer Science',
  'Commerce',
  'Mechanical Engineering',
  'Psychology',
  'Biotechnology',
  'Business Administration',
  'Electronics',
  'English Literature',
]

const DEFAULT_FORM = {
  name: '',
  institutionType: 'School',
  institutionName: SCHOOL_OPTIONS[0],
  className: '8',
  section: 'A',
  classTeacher: '',
  department: 'Computer Science',
  semester: 3,
  backlogs: 0,
  hostelStatus: 'Day Scholar',
  attendance: 80,
  marks: 65,
  feeStatus: 'Paid',
  teacherRemarks: '',
  mentorNotes: '',
}

function buildInitial(initial) {
  const values = { ...DEFAULT_FORM }
  if (initial) {
    Object.keys(DEFAULT_FORM).forEach((key) => {
      if (initial[key] !== undefined && initial[key] !== null) {
        values[key] = initial[key]
      }
    })
  }
  return values
}

export default function StudentForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => buildInitial(initial))
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(initial)
  const isSchool = form.institutionType === 'School'

  const preview = useMemo(
    () =>
      computeRisk({
        ...form,
        attendance: Number(form.attendance) || 0,
        marks: Number(form.marks) || 0,
        backlogs: isSchool ? 0 : Number(form.backlogs) || 0,
      }),
    [form, isSchool],
  )

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
  }

  const handleTypeChange = (type) => {
    setForm((previous) => ({
      ...previous,
      institutionType: type,
      institutionName: type === 'School' ? SCHOOL_OPTIONS[0] : COLLEGE_OPTIONS[0],
    }))
  }

  const validate = () => {
    const next = {}

    if (!form.name.trim()) next.name = 'Student name is required.'
    if (!form.institutionName.trim()) next.institutionName = 'Select an institution.'

    const attendance = Number(form.attendance)
    if (form.attendance === '' || Number.isNaN(attendance) || attendance < 0 || attendance > 100) {
      next.attendance = 'Attendance must be between 0 and 100.'
    }

    const marks = Number(form.marks)
    if (form.marks === '' || Number.isNaN(marks) || marks < 0 || marks > 100) {
      next.marks = 'Marks must be between 0 and 100.'
    }

    if (isSchool) {
      if (!form.className.trim()) next.className = 'Class is required.'
      if (!form.section.trim()) next.section = 'Section is required.'
      if (!form.classTeacher.trim()) next.classTeacher = 'Class teacher is required.'
    } else {
      const semester = Number(form.semester)
      if (Number.isNaN(semester) || semester < 1 || semester > 8) {
        next.semester = 'Semester must be between 1 and 8.'
      }
      const backlogs = Number(form.backlogs)
      if (Number.isNaN(backlogs) || backlogs < 0 || backlogs > 20) {
        next.backlogs = 'Backlogs must be between 0 and 20.'
      }
      if (!form.department.trim()) next.department = 'Department is required.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      name: form.name.trim(),
      institutionType: form.institutionType,
      institutionName: form.institutionName.trim(),
      className: isSchool ? form.className.trim() : '',
      section: isSchool ? form.section.trim() : '',
      classTeacher: isSchool ? form.classTeacher.trim() : '',
      department: isSchool ? '' : form.department.trim(),
      semester: isSchool ? null : Number(form.semester),
      backlogs: isSchool ? 0 : Number(form.backlogs),
      hostelStatus: isSchool ? '' : form.hostelStatus,
      attendance: Number(form.attendance),
      marks: Number(form.marks),
      feeStatus: form.feeStatus,
      teacherRemarks: isSchool ? form.teacherRemarks.trim() : '',
      mentorNotes: isSchool ? '' : form.mentorNotes.trim(),
    })
  }

  const errorCount = Object.values(errors).filter(Boolean).length

  return (
    <form className="entity-form" onSubmit={handleSubmit} noValidate>
      {errorCount > 0 && (
        <div className="form-alert" role="alert">
          <AlertCircle size={17} />
          Please fix the highlighted fields before saving.
        </div>
      )}

      <section className="form-section">
        <div className="form-section-head">
          <h3>Student information</h3>
          <p>Basic identity and institution details.</p>
        </div>

        <div className="form-grid">
          <div className="field field-span-2">
            <label htmlFor="student-name">Full name</label>
            <input
              id="student-name"
              className={`input ${errors.name ? 'has-error' : ''}`}
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. Ananya Sharma"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field field-span-2">
            <label>Institution type</label>
            <div className="segmented segmented-form">
              <button
                type="button"
                className={isSchool ? 'active' : ''}
                onClick={() => handleTypeChange('School')}
              >
                <School size={16} /> School
              </button>
              <button
                type="button"
                className={!isSchool ? 'active' : ''}
                onClick={() => handleTypeChange('College')}
              >
                <GraduationCap size={17} /> College
              </button>
            </div>
          </div>

          <div className="field field-span-2">
            <label htmlFor="institution-name">Institution</label>
            <select
              id="institution-name"
              className={`select ${errors.institutionName ? 'has-error' : ''}`}
              value={form.institutionName}
              onChange={(event) => update('institutionName', event.target.value)}
            >
              {(isSchool ? SCHOOL_OPTIONS : COLLEGE_OPTIONS).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.institutionName && (
              <span className="field-error">{errors.institutionName}</span>
            )}
          </div>

          {isSchool ? (
            <>
              <div className="field">
                <label htmlFor="class-name">Class</label>
                <select
                  id="class-name"
                  className="select"
                  value={form.className}
                  onChange={(event) => update('className', event.target.value)}
                >
                  {['6', '7', '8', '9', '10', '11', '12'].map((value) => (
                    <option key={value} value={value}>
                      Class {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="section">Section</label>
                <select
                  id="section"
                  className="select"
                  value={form.section}
                  onChange={(event) => update('section', event.target.value)}
                >
                  {['A', 'B', 'C', 'D'].map((value) => (
                    <option key={value} value={value}>
                      Section {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field-span-2">
                <label htmlFor="class-teacher">Class teacher</label>
                <input
                  id="class-teacher"
                  className={`input ${errors.classTeacher ? 'has-error' : ''}`}
                  value={form.classTeacher}
                  onChange={(event) => update('classTeacher', event.target.value)}
                  placeholder="e.g. Mrs. Anjali Rao"
                />
                {errors.classTeacher && (
                  <span className="field-error">{errors.classTeacher}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="field field-span-2">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  className="select"
                  value={form.department}
                  onChange={(event) => update('department', event.target.value)}
                >
                  {DEPARTMENTS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="semester">Semester</label>
                <select
                  id="semester"
                  className="select"
                  value={form.semester}
                  onChange={(event) => update('semester', event.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                    <option key={value} value={value}>
                      Semester {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="backlogs">Backlogs</label>
                <input
                  id="backlogs"
                  type="number"
                  min="0"
                  max="20"
                  className={`input ${errors.backlogs ? 'has-error' : ''}`}
                  value={form.backlogs}
                  onChange={(event) => update('backlogs', event.target.value)}
                />
                {errors.backlogs && <span className="field-error">{errors.backlogs}</span>}
              </div>
              <div className="field field-span-2">
                <label htmlFor="hostel-status">Hostel status</label>
                <select
                  id="hostel-status"
                  className="select"
                  value={form.hostelStatus}
                  onChange={(event) => update('hostelStatus', event.target.value)}
                >
                  <option value="Day Scholar">Day Scholar</option>
                  <option value="Hosteller">Hosteller</option>
                </select>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head">
          <h3>Academic & financial indicators</h3>
          <p>These inputs drive the rule-based risk score.</p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="attendance">Attendance (%)</label>
            <input
              id="attendance"
              type="number"
              min="0"
              max="100"
              className={`input ${errors.attendance ? 'has-error' : ''}`}
              value={form.attendance}
              onChange={(event) => update('attendance', event.target.value)}
            />
            {errors.attendance && <span className="field-error">{errors.attendance}</span>}
          </div>
          <div className="field">
            <label htmlFor="marks">Marks (%)</label>
            <input
              id="marks"
              type="number"
              min="0"
              max="100"
              className={`input ${errors.marks ? 'has-error' : ''}`}
              value={form.marks}
              onChange={(event) => update('marks', event.target.value)}
            />
            {errors.marks && <span className="field-error">{errors.marks}</span>}
          </div>
          <div className="field field-span-2">
            <label htmlFor="fee-status">Fee status</label>
            <select
              id="fee-status"
              className="select"
              value={form.feeStatus}
              onChange={(event) => update('feeStatus', event.target.value)}
            >
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="field field-span-2">
            <label htmlFor={isSchool ? 'teacher-remarks' : 'mentor-notes'}>
              {isSchool ? 'Teacher remarks' : 'Mentor observations'}
            </label>
            <textarea
              id={isSchool ? 'teacher-remarks' : 'mentor-notes'}
              className="input textarea"
              rows={3}
              value={isSchool ? form.teacherRemarks : form.mentorNotes}
              onChange={(event) =>
                update(isSchool ? 'teacherRemarks' : 'mentorNotes', event.target.value)
              }
              placeholder={
                isSchool
                  ? 'e.g. Irregular attendance; homework not submitted regularly.'
                  : 'e.g. Struggling with core subjects; financial difficulty at home.'
              }
            />
            <span className="field-help">
              Negative remarks or observations add to the illustrative risk score.
            </span>
          </div>
        </div>
      </section>

      <div className="form-risk-preview">
        <div>
          <span className="form-risk-label">Live risk preview</span>
          <p>
            Score <strong>{preview.riskScore}/100</strong> based on the current inputs.
          </p>
        </div>
        <RiskBadge category={preview.riskCategory} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={17} />
          {isEditing ? 'Save changes' : 'Add student'}
        </button>
      </div>
    </form>
  )
}
