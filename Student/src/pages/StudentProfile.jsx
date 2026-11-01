import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  HeartPulse,
  Info,
  Layers,
  MessageSquare,
  Pencil,
  Plus,
  SearchX,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { getProgress, TREND_LABELS } from '../lib/progress.js'
import { formatDate } from '../lib/format.js'
import { formatProbability, predictionConfidence } from '../lib/dataset.js'
import { INTERVENTION_STATUSES, RISK_LEVELS } from '../lib/riskEngine.js'
import Avatar from '../components/Avatar.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import InterventionIcon from '../components/InterventionIcon.jsx'
import Modal from '../components/Modal.jsx'
import StudentForm from '../components/StudentForm.jsx'
import ProgressModal from '../components/ProgressModal.jsx'
import AssignInterventionModal from '../components/AssignInterventionModal.jsx'

const FACTOR_ICONS = {
  attendance: CalendarDays,
  marks: BookOpen,
  fees: Wallet,
  backlogs: Layers,
  remarks: MessageSquare,
  mentor: MessageSquare,
  personal: HeartPulse,
}

function shortDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function displayValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—'
  return `${value}${suffix}`
}

function feeChipClass(status) {
  if (status === 'Paid') return 'fee-paid'
  if (status === 'Partial') return 'fee-partial'
  if (status === 'Pending') return 'fee-pending'
  return 'fee-unknown'
}

function Delta({ value }) {
  if (value === 0) return <span className="delta delta-flat">No change</span>
  const positive = value > 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`delta ${positive ? 'delta-up' : 'delta-down'}`}>
      <Icon size={13} />
      {positive ? '+' : ''}
      {value}%
    </span>
  )
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey}>
          <span style={{ background: item.color }} />
          {item.name}: <b>{item.value}%</b>
        </div>
      ))}
    </div>
  )
}

export default function StudentProfile({ studentId, navigate }) {
  const {
    students,
    activeDataset,
    updateStudent,
    updateIntervention,
  } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignType, setAssignType] = useState('')

  const student = students.find((item) => item.id === studentId)

  const progress = useMemo(
    () => (student ? getProgress(student) : null),
    [student],
  )

  if (!student) {
    return (
      <div className="card empty-state standalone-empty">
        <SearchX size={34} />
        <h2>Student not found</h2>
        <p>The record may have been reset. Return to the student list to continue.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/students')}>
          <ArrowLeft size={16} />
          Back to students
        </button>
      </div>
    )
  }

  const isDatasetRecord = student.dataSource === 'dataset'
  const isSchool = student.institutionType === 'School'
  const level = RISK_LEVELS[student.riskCategory] || RISK_LEVELS.Medium
  const activeInterventions = (student.interventions || []).filter(
    (item) => item.status !== 'Completed',
  ).length

  const chartData = progress.history.map((point) => ({
    date: shortDate(point.date),
    Attendance: point.attendance,
    Marks: point.marks,
  }))
  const lastPoint = progress.history[progress.history.length - 1]
  if (
    !lastPoint ||
    lastPoint.attendance !== student.attendance ||
    lastPoint.marks !== student.marks
  ) {
    chartData.push({
      date: 'Current',
      Attendance: student.attendance,
      Marks: student.marks,
    })
  }

  const openAssign = (type = '') => {
    setAssignType(type)
    setAssignOpen(true)
  }

  const handleEditSubmit = (payload) => {
    updateStudent(student.id, payload)
    setEditOpen(false)
  }

  return (
    <>
      <button type="button" className="back-link" onClick={() => navigate('/students')}>
        <ArrowLeft size={16} />
        Back to students
      </button>

      <section className="profile-hero card">
        <div className="profile-identity">
          <Avatar name={student.name} seed={student.id} size="xl" />
          <div className="profile-identity-text">
            <div className="profile-name-row">
              <h1>{student.name}</h1>
              <RiskBadge category={student.riskCategory} />
            </div>
            <p className="profile-id">
              {student.id}
              {student.institutionType && student.institutionType !== 'Not specified'
                ? ` · ${student.institutionType} student`
                : ''}
            </p>
            <div className="profile-chips">
              <span>
                <Building2 size={14} />
                {student.institutionName || 'Not provided'}
              </span>
              {(isSchool || student.department || student.semester !== null) && (
                <span>
                  <GraduationCap size={14} />
                  {isSchool
                    ? `Class ${student.className || '—'} · Section ${student.section || '—'}`
                    : [student.department, student.semester !== null ? `Semester ${student.semester}` : null]
                        .filter(Boolean)
                        .join(' · ') || 'Not provided'}
                </span>
              )}
              <span>
                <Wallet size={14} />
                {student.feeStatus || 'Not provided'} fees
              </span>
            </div>
          </div>
        </div>

        <div className="profile-hero-right">
          <div className="profile-score-block">
            <div
              className="score-ring"
              style={{
                background: `conic-gradient(${level.color} ${student.riskScore * 3.6}deg, #e8eef7 0deg)`,
              }}
            >
              <div className="score-ring-inner">
                <strong>{student.riskScore}</strong>
                <span>/100</span>
              </div>
            </div>
            <div className="profile-score-label">
              <span>
                {isDatasetRecord ? 'ML dropout probability' : 'Rule-based risk score'}
              </span>
              <strong>{level.label}</strong>
              <small>
                {isDatasetRecord
                  ? `${student.predicted_outcome || 'Outcome unavailable'} · ${level.range}`
                  : `Range ${level.range}`}
              </small>
            </div>
          </div>
          <div className="profile-hero-actions">
            {!isDatasetRecord && (
              <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(true)}>
                <Pencil size={15} />
                Edit record
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setProgressOpen(true)}>
              <TrendingUp size={16} />
              Record progress
            </button>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <div className="profile-main">
          <section className="card profile-card">
            <div className="card-head">
              <div>
                <h2>Student information</h2>
                <p>Enrolment, institution and contact-record details.</p>
              </div>
              <span className="card-chip">{student.institutionType}</span>
            </div>

            <dl className="info-grid">
              {isDatasetRecord ? (
                <>
                  <div className="info-span-2">
                    <dt>Active dataset</dt>
                    <dd>{activeDataset?.filename || student.institutionName}</dd>
                  </div>
                  <div>
                    <dt>Attendance</dt>
                    <dd>{displayValue(student.attendance, '%')}</dd>
                  </div>
                  <div>
                    <dt>Semester marks</dt>
                    <dd>{displayValue(student.semesterMarks, '%')}</dd>
                  </div>
                  <div>
                    <dt>Internal marks</dt>
                    <dd>{displayValue(student.internalMarks, '%')}</dd>
                  </div>
                  <div>
                    <dt>Assignment completion</dt>
                    <dd>{displayValue(student.assignmentCompletion, '%')}</dd>
                  </div>
                  <div>
                    <dt>Previous CGPA</dt>
                    <dd>{displayValue(student.previousCgpa)}</dd>
                  </div>
                  <div>
                    <dt>Backlogs</dt>
                    <dd>{displayValue(student.backlogs)}</dd>
                  </div>
                  <div>
                    <dt>Fee status</dt>
                    <dd>
                      <span className={`fee-chip ${feeChipClass(student.feeStatus)}`}>
                        {student.feeStatus}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Scholarship</dt>
                    <dd>{displayValue(student.scholarship)}</dd>
                  </div>
                  <div>
                    <dt>Financial issue</dt>
                    <dd>{displayValue(student.financialIssue)}</dd>
                  </div>
                  <div>
                    <dt>LMS logins / month</dt>
                    <dd>{displayValue(student.lmsLogins)}</dd>
                  </div>
                  <div>
                    <dt>Library visits / month</dt>
                    <dd>{displayValue(student.libraryVisits)}</dd>
                  </div>
                  <div>
                    <dt>Class participation</dt>
                    <dd>{displayValue(student.classParticipation)}</dd>
                  </div>
                  <div>
                    <dt>Mentor meetings / semester</dt>
                    <dd>{displayValue(student.mentorMeetings)}</dd>
                  </div>
                  <div>
                    <dt>Record opened</dt>
                    <dd>{formatDate(student.createdAt)}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt>Institution</dt>
                    <dd>{student.institutionName}</dd>
                  </div>
                  <div>
                    <dt>Institution type</dt>
                    <dd>{student.institutionType}</dd>
                  </div>

                  {isSchool ? (
                    <>
                      <div>
                        <dt>Class</dt>
                        <dd>Class {student.className}</dd>
                      </div>
                      <div>
                        <dt>Section</dt>
                        <dd>Section {student.section}</dd>
                      </div>
                      <div className="info-span-2">
                        <dt>Class teacher</dt>
                        <dd>{student.classTeacher || 'Not assigned'}</dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt>Department</dt>
                        <dd>{student.department}</dd>
                      </div>
                      <div>
                        <dt>Semester</dt>
                        <dd>Semester {student.semester}</dd>
                      </div>
                      <div>
                        <dt>Hostel status</dt>
                        <dd>{student.hostelStatus || 'Day Scholar'}</dd>
                      </div>
                      <div>
                        <dt>Backlogs</dt>
                        <dd>{student.backlogs}</dd>
                      </div>
                    </>
                  )}

                  <div>
                    <dt>Fee status</dt>
                    <dd>
                      <span className={`fee-chip ${feeChipClass(student.feeStatus)}`}>
                        {student.feeStatus}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Record opened</dt>
                    <dd>{formatDate(student.createdAt)}</dd>
                  </div>
                  <div className="info-span-2">
                    <dt>{isSchool ? 'Teacher remarks' : 'Mentor observations'}</dt>
                    <dd className="notes-dd">
                      {(isSchool ? student.teacherRemarks : student.mentorNotes) ||
                        'No remarks recorded yet.'}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <section className="card profile-card">
            <div className="card-head">
              <div>
                <h2>{isDatasetRecord ? 'ML dropout prediction' : 'Why this risk score?'}</h2>
                <p>
                  {isDatasetRecord
                    ? 'Prediction returned by the trained model when the dataset was uploaded.'
                    : 'Each contributing rule adds weighted points, capped at 100.'}
                </p>
              </div>
              <span className={`score-text score-${student.riskCategory.toLowerCase()}`}>
                {student.riskScore}
                <small>/100</small>
              </span>
            </div>

            <div className="risk-meter">
              <div className="risk-meter-labels">
                <span>Low 0–30</span>
                <span>Medium 31–60</span>
                <span>High 61–100</span>
              </div>
              <div className="risk-meter-track">
                <span className="risk-meter-zone zone-low" />
                <span className="risk-meter-zone zone-medium" />
                <span className="risk-meter-zone zone-high" />
                <span
                  className="risk-meter-marker"
                  style={{ left: `${student.riskScore}%`, background: level.color }}
                />
              </div>
            </div>

            {isDatasetRecord ? (
              <>
                <div className="quick-facts">
                  <span>
                    Predicted outcome{' '}
                    <strong>{student.predicted_outcome || '—'}</strong>
                  </span>
                  <span>
                    Dropout probability{' '}
                    <strong>{formatProbability(student.dropout_probability)}</strong>
                  </span>
                  <span>
                    Confidence{' '}
                    <strong>{formatProbability(predictionConfidence(student))}</strong>
                  </span>
                </div>
                <div className="model-note">
                  <Info size={16} />
                  <p>
                    This prediction comes from the trained ML model and the active uploaded
                    dataset. Progress check-ins do not re-run the model; upload a new dataset to
                    refresh predictions.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="factor-list">
                  {student.riskFactors.length === 0 && (
                    <div className="factor-empty">
                      <ShieldCheck size={22} />
                      <div>
                        <strong>No major risk factors detected</strong>
                        <span>
                          Attendance, marks and fee status are currently within safe thresholds.
                        </span>
                      </div>
                    </div>
                  )}

                  {student.riskFactors.map((factor) => {
                    const Icon = FACTOR_ICONS[factor.key] || Info
                    return (
                      <div key={factor.key} className={`factor-row factor-${factor.severity}`}>
                        <span className="factor-icon">
                          <Icon size={17} />
                        </span>
                        <div className="factor-body">
                          <div className="factor-title">
                            <strong>{factor.label}</strong>
                            <span>+{factor.points} pts</span>
                          </div>
                          <p>{factor.detail}</p>
                          <div className="factor-track">
                            <span
                              style={{
                                width: `${Math.round((factor.points / factor.max) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="model-note">
                  <Info size={16} />
                  <p>
                    This score comes from an <strong>illustrative rule-based model</strong> for a
                    hackathon prototype. It is not a validated machine-learning prediction and
                    should not be used as a sole decision-making tool.
                  </p>
                </div>
              </>
            )}
          </section>

          <section className="card profile-card">
            <div className="card-head">
              <div>
                <h2>Academic progress</h2>
                <p>Before-and-after view from the first recorded snapshot to today.</p>
              </div>
              <button type="button" className="btn btn-sm btn-soft" onClick={() => setProgressOpen(true)}>
                <Plus size={15} />
                Add check-in
              </button>
            </div>

            <div className="trend-cards">
              <div className="trend-card">
                <span>Attendance</span>
                <strong>{student.attendance}%</strong>
                <Delta value={progress.attendanceDelta} />
                <small>From {progress.baseline.attendance}% baseline</small>
              </div>
              <div className="trend-card">
                <span>Marks</span>
                <strong>{student.marks}%</strong>
                <Delta value={progress.marksDelta} />
                <small>From {progress.baseline.marks}% baseline</small>
              </div>
              <div className={`trend-status trend-${progress.trend}`}>
                <span>Overall trend</span>
                <strong>{TREND_LABELS[progress.trend]}</strong>
                <small>{progress.history.length} recorded check-ins</small>
              </div>
            </div>

            <div className="profile-chart">
              <ResponsiveContainer width="100%" height={245}>
                <LineChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8eef7" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Attendance"
                    stroke="#2f6fed"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#2f6fed', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Marks"
                    stroke="#0f9f6e"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#0f9f6e', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-key profile-chart-key">
              <span><i className="key-blue" />Attendance</span>
              <span><i className="key-green" />Marks</span>
              <span className="chart-key-note">
                Baseline recorded on {formatDate(progress.baseline.date)}
              </span>
            </div>
          </section>

          <section className="card profile-card">
            <div className="card-head">
              <div>
                <h2>Intervention history</h2>
                <p>Support actions assigned to this student and their current status.</p>
              </div>
              <button type="button" className="btn btn-sm btn-soft" onClick={() => openAssign()}>
                <Plus size={15} />
                Assign
              </button>
            </div>

            <div className="intervention-list">
              {(student.interventions || []).length === 0 && (
                <div className="empty-state compact-empty">
                  <HeartPulse size={25} />
                  <strong>No interventions assigned yet</strong>
                  <span>Use the recommended actions beside this profile to get started.</span>
                </div>
              )}

              {(student.interventions || []).map((item) => (
                <div key={item.id} className="intervention-item">
                  <span className={`intervention-type-icon status-${item.status.toLowerCase().replace(' ', '-')}`}>
                    <InterventionIcon type={item.type} />
                  </span>
                  <div className="intervention-body">
                    <div className="intervention-top">
                      <strong>{item.type}</strong>
                      <select
                        className={`status-select status-${item.status.toLowerCase().replace(' ', '-')}`}
                        value={item.status}
                        onChange={(event) =>
                          updateIntervention(student.id, item.id, { status: event.target.value })
                        }
                        aria-label={`Update status for ${item.type}`}
                      >
                        {INTERVENTION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p>{item.notes}</p>
                    <div className="intervention-dates">
                      <span>
                        <CalendarDays size={13} />
                        Assigned {formatDate(item.assignedDate)}
                      </span>
                      {item.completedDate && (
                        <span>
                          <CheckCircle2 size={13} />
                          Completed {formatDate(item.completedDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="profile-side">
          {student.riskCategory === 'High' && (
            <div className="profile-alert">
              <AlertTriangle size={20} />
              <div>
                <strong>Urgent follow-up recommended</strong>
                <p>
                  Assign at least one intervention and record a check-in within the next two weeks.
                </p>
              </div>
            </div>
          )}

          <section className="card side-card">
            <div className="side-card-head">
              <h2>Key indicators</h2>
              <span>Live values</span>
            </div>
            <div className="metric-tiles">
              <div className="metric-tile">
                <span>Attendance</span>
                <strong className={student.attendance < 60 ? 'metric-low' : ''}>
                  {student.attendance}%
                </strong>
                <div className="mini-track">
                  <span
                    className={`mini-fill ${student.attendance < 60 ? 'mini-fill-low' : ''}`}
                    style={{ width: `${student.attendance}%` }}
                  />
                </div>
              </div>
              <div className="metric-tile">
                <span>Marks</span>
                <strong className={student.marks < 40 ? 'metric-low' : ''}>
                  {student.marks}%
                </strong>
                <div className="mini-track">
                  <span
                    className={`mini-fill ${student.marks < 40 ? 'mini-fill-low' : ''}`}
                    style={{ width: `${student.marks}%` }}
                  />
                </div>
              </div>
              <div className="metric-tile">
                <span>Fee status</span>
                <strong className="metric-text">{student.feeStatus}</strong>
                <small>{student.feeStatus === 'Paid' ? 'No dues' : 'Follow-up needed'}</small>
              </div>
              <div className="metric-tile">
                <span>Active support</span>
                <strong>{activeInterventions}</strong>
                <small>{(student.interventions || []).length} total interventions</small>
              </div>
            </div>
          </section>

          <section className="card side-card">
            <div className="side-card-head">
              <h2>Recommended interventions</h2>
              <span>{student.recommendations.length} suggested</span>
            </div>

            <div className="recommendation-list">
              {student.recommendations.length === 0 && (
                <div className="recommendation-empty">
                  <ShieldCheck size={20} />
                  <p>No intervention needed right now. Continue routine monitoring.</p>
                </div>
              )}

              {student.recommendations.map((item) => (
                <div key={item.type} className="recommendation-item">
                  <span className="recommendation-icon">
                    <InterventionIcon type={item.type} />
                  </span>
                  <div>
                    <strong>{item.type}</strong>
                    <p>{item.description}</p>
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn-soft"
                    onClick={() => openAssign(item.type)}
                    title={`Assign ${item.type}`}
                    aria-label={`Assign ${item.type}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => navigate('/interventions')}
            >
              Open intervention desk
            </button>
          </section>

          <section className="card side-card">
            <div className="side-card-head">
              <h2>Support summary</h2>
            </div>
            <div className="support-summary">
              <div>
                <span>{isDatasetRecord ? 'Dataset' : 'Institution'}</span>
                <strong>
                  {isDatasetRecord
                    ? activeDataset?.filename || student.institutionName
                    : student.institutionName}
                </strong>
              </div>
              <div>
                <span>
                  {isDatasetRecord
                    ? 'Predicted outcome'
                    : isSchool
                      ? 'Class teacher'
                      : 'Hostel status'}
                </span>
                <strong>
                  {isDatasetRecord
                    ? student.predicted_outcome || '—'
                    : isSchool
                      ? student.classTeacher
                      : student.hostelStatus || 'Day Scholar'}
                </strong>
              </div>
              <div>
                <span>Last updated</span>
                <strong>{formatDate(student.updatedAt || student.createdAt)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {editOpen && !isDatasetRecord && (
        <Modal
          open
          onClose={() => setEditOpen(false)}
          size="lg"
          title="Edit student record"
          subtitle={`Changes to ${student.name} recalculate the risk score immediately.`}
        >
          <StudentForm
            initial={student}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      )}

      {progressOpen && (
        <ProgressModal
          open
          student={student}
          onClose={() => setProgressOpen(false)}
        />
      )}

      {assignOpen && (
        <AssignInterventionModal
          open
          studentId={student.id}
          defaultType={assignType}
          onClose={() => setAssignOpen(false)}
        />
      )}
    </>
  )
}
