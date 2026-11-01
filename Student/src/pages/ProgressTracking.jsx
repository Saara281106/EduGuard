import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Info,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
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
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import Avatar from '../components/Avatar.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import ProgressModal from '../components/ProgressModal.jsx'
import InterventionIcon from '../components/InterventionIcon.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getProgress, TREND_LABELS } from '../lib/progress.js'
import { formatDate } from '../lib/format.js'

function shortDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function TrendBadge({ delta }) {
  if (delta === 0) {
    return (
      <span className="trend-badge trend-flat">
        <Minus size={13} />
        No change
      </span>
    )
  }
  const positive = delta > 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span className={`trend-badge ${positive ? 'trend-up' : 'trend-down'}`}>
      <Icon size={13} />
      {positive ? '+' : ''}
      {delta}%
    </span>
  )
}

function CompareCard({ label, before, after, delta, color }) {
  return (
    <div className="compare-card">
      <div className="compare-head">
        <span>{label}</span>
        <TrendBadge delta={delta} />
      </div>
      <div className="compare-values">
        <div className="compare-before">
          <span>Before</span>
          <strong>{before}%</strong>
        </div>
        <ArrowRight size={18} className="compare-arrow" />
        <div className="compare-after">
          <span>Current</span>
          <strong>{after}%</strong>
        </div>
      </div>
      <div className="compare-bars">
        <div>
          <span style={{ width: `${before}%` }} className="bar-before" />
        </div>
        <div>
          <span style={{ width: `${after}%`, background: color }} className="bar-after" />
        </div>
      </div>
    </div>
  )
}

function ProgressTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{formatDate(point.rawDate)}</strong>
      <div>
        <span style={{ background: '#2f6fed' }} />
        Attendance: <b>{point.Attendance}%</b>
      </div>
      <div>
        <span style={{ background: '#0f9f6e' }} />
        Marks: <b>{point.Marks}%</b>
      </div>
      {point.note && <p className="tooltip-note">{point.note}</p>}
    </div>
  )
}

export default function ProgressTracking() {
  const { students, activeDataset } = useApp()
  const [selectedId, setSelectedId] = useState(students[0]?.id || '')
  const [progressOpen, setProgressOpen] = useState(false)

  const selected = students.find((student) => student.id === selectedId) || students[0]
  const progress = useMemo(() => (selected ? getProgress(selected) : null), [selected])

  const cohort = useMemo(() => {
    const tracked = students.map((student) => getProgress(student)).filter((item) => item.hasHistory)
    const improved = tracked.filter((item) => item.trend === 'improved').length
    const declined = tracked.filter((item) => item.trend === 'declined').length
    const stable = tracked.length - improved - declined
    const averageAttendance = tracked.length
      ? Math.round(
          tracked.reduce((sum, item) => sum + item.attendanceDelta, 0) / tracked.length,
        )
      : 0
    return { improved, declined, stable, averageAttendance, tracked: tracked.length }
  }, [students])

  const chartData = useMemo(() => {
    if (!progress) return []
    const data = progress.history.map((point) => ({
      date: shortDate(point.date),
      rawDate: point.date,
      Attendance: point.attendance,
      Marks: point.marks,
      note: point.note,
    }))
    const last = progress.history[progress.history.length - 1]
    if (
      selected &&
      (!last ||
        last.attendance !== selected.attendance ||
        last.marks !== selected.marks)
    ) {
      data.push({
        date: 'Current',
        rawDate: progress.current.date,
        Attendance: selected.attendance,
        Marks: selected.marks,
        note: 'Current values',
      })
    }
    return data
  }, [progress, selected])

  const historyRows = useMemo(() => {
    if (!progress) return []
    return progress.history
      .map((point, index) => {
        const previous = index > 0 ? progress.history[index - 1] : null
        return {
          ...point,
          attendanceDelta: previous ? point.attendance - previous.attendance : null,
          marksDelta: previous ? point.marks - previous.marks : null,
        }
      })
      .reverse()
  }, [progress])

  const openInterventions = selected?.interventions || []
  const activeInterventions = openInterventions.filter((item) => item.status !== 'Completed')

  if (!selected) {
    return (
      <div className="card empty-state standalone-empty">
        <Info size={32} />
        <h2>No students available</h2>
        <p>Add a student record to begin tracking progress.</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={activeDataset ? `Active dataset · ${activeDataset.filename}` : 'Before & after'}
        title="Progress tracking"
        subtitle={
          activeDataset
            ? 'Track changes for students in the active uploaded dataset. The upload itself provides the baseline snapshot.'
            : 'Record updated attendance and marks, then review whether indicators improved.'
        }
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setProgressOpen(true)}>
            <Plus size={17} />
            Record progress
          </button>
        }
      />

      <section className="stat-grid compact-stats">
        <StatCard
          label="Students improved"
          value={cohort.improved}
          hint="Both attendance and marks moved up"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Students declined"
          value={cohort.declined}
          hint="Both indicators moved down"
          icon={TrendingDown}
          tone="red"
        />
        <StatCard
          label="Stable or mixed"
          value={cohort.stable}
          hint={`${cohort.tracked} students with recorded history`}
          icon={Activity}
          tone="blue"
        />
        <StatCard
          label="Average attendance change"
          value={`${cohort.averageAttendance > 0 ? '+' : ''}${cohort.averageAttendance}%`}
          hint="Across every tracked student"
          icon={CalendarDays}
          tone="amber"
        />
      </section>

      <section className="card picker-card">
        <div className="picker-copy">
          <h2>Select a student</h2>
          <p>Review their latest snapshot, or add a new progress check-in.</p>
        </div>
        <div className="picker-controls">
          <select
            className="select"
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Select a student to track progress"
          >
            {[...students]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.id} · {student.riskCategory} risk
                </option>
              ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setProgressOpen(true)}
          >
            <Plus size={16} />
            Update indicators
          </button>
        </div>
      </section>

      <div className="progress-layout">
        <div className="progress-main">
          <section className="card profile-card">
            <div className="progress-student-summary">
              <Avatar name={selected.name} seed={selected.id} size="lg" />
              <div>
                <h2>{selected.name}</h2>
                <p>
                  {selected.id} ·{' '}
                  {selected.dataSource === 'dataset'
                    ? activeDataset?.filename || selected.institutionName
                    : selected.institutionType === 'School'
                      ? `Class ${selected.className}-${selected.section}`
                      : `${selected.department}, Semester ${selected.semester}`}
                </p>
              </div>
              <RiskBadge category={selected.riskCategory} score={selected.riskScore} />
              <span className={`progress-status trend-${progress.trend}`}>
                {TREND_LABELS[progress.trend]}
              </span>
            </div>

            <div className="compare-grid">
              <CompareCard
                label="Attendance"
                before={progress.baseline.attendance}
                after={selected.attendance}
                delta={progress.attendanceDelta}
                color="#2f6fed"
              />
              <CompareCard
                label="Academic marks"
                before={progress.baseline.marks}
                after={selected.marks}
                delta={progress.marksDelta}
                color="#0f9f6e"
              />
            </div>

            <div className="card-head progress-chart-head">
              <div>
                <h2>Indicator trend</h2>
                <p>All check-ins since the baseline assessment.</p>
              </div>
              <span className="card-chip">{progress.history.length} check-ins</span>
            </div>

            <div className="profile-chart">
              <ResponsiveContainer width="100%" height={270}>
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
                  <Tooltip content={<ProgressTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Attendance"
                    stroke="#2f6fed"
                    strokeWidth={2.6}
                    dot={{ r: 4, fill: '#2f6fed', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Marks"
                    stroke="#0f9f6e"
                    strokeWidth={2.6}
                    dot={{ r: 4, fill: '#0f9f6e', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-key profile-chart-key">
              <span><i className="key-blue" />Attendance</span>
              <span><i className="key-green" />Marks</span>
              <span className="chart-key-note">
                Baseline: {formatDate(progress.baseline.date)}
              </span>
            </div>

            {!progress.hasHistory && (
              <p className="progress-empty-note">
                Only one snapshot exists for this student. Record a check-in to unlock a
                before-and-after comparison.
              </p>
            )}
          </section>

          <section className="card profile-card">
            <div className="card-head">
              <div>
                <h2>Check-in history</h2>
                <p>Newest first. Each row is preserved in LocalStorage.</p>
              </div>
            </div>

            <div className="table-scroll">
              <table className="data-table history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Attendance</th>
                    <th>Change</th>
                    <th>Marks</th>
                    <th>Change</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, index) => (
                    <tr key={`${row.date}-${index}`}>
                      <td className="nowrap">{formatDate(row.date)}</td>
                      <td>
                        <strong>{row.attendance}%</strong>
                      </td>
                      <td>
                        {row.attendanceDelta === null ? (
                          <span className="delta delta-flat">Baseline</span>
                        ) : (
                          <TrendBadge delta={row.attendanceDelta} />
                        )}
                      </td>
                      <td>
                        <strong>{row.marks}%</strong>
                      </td>
                      <td>
                        {row.marksDelta === null ? (
                          <span className="delta delta-flat">Baseline</span>
                        ) : (
                          <TrendBadge delta={row.marksDelta} />
                        )}
                      </td>
                      <td>
                        <p className="notes-cell" title={row.note}>
                          {row.note}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="progress-side">
          <section className="card side-card">
            <div className="side-card-head">
              <h2>Support context</h2>
              <span>{activeInterventions.length} active</span>
            </div>

            {openInterventions.length === 0 ? (
              <div className="recommendation-empty">
                <HeartHandshake size={20} />
                <p>No interventions recorded for this student yet.</p>
              </div>
            ) : (
              <div className="support-context-list">
                {openInterventions.slice(0, 4).map((item) => (
                  <div key={item.id} className="support-context-item">
                    <span className={`recommendation-icon status-${item.status.toLowerCase().replace(' ', '-')}`}>
                      <InterventionIcon type={item.type} size={16} />
                    </span>
                    <div>
                      <strong>{item.type}</strong>
                      <span>{formatDate(item.assignedDate)}</span>
                    </div>
                    <span className={`status-pill status-${item.status.toLowerCase().replace(' ', '-')}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="side-divider" />

            <div className="support-summary">
              <div>
                <span>Fee status</span>
                <strong>{selected.feeStatus}</strong>
              </div>
              <div>
                <span>Current risk</span>
                <strong>{selected.riskScore}/100 · {selected.riskCategory}</strong>
              </div>
              <div>
                <span>Last updated</span>
                <strong>{formatDate(selected.updatedAt || selected.createdAt)}</strong>
              </div>
            </div>
          </section>

          <section className="card side-card">
            <div className="side-card-head">
              <h2>Before you update</h2>
            </div>
            <ul className="check-list">
              <li>
                <CheckCircle2 size={15} />
                Use the latest verified attendance and test marks.
              </li>
              <li>
                <CheckCircle2 size={15} />
                Add a short note so the change has context.
              </li>
              <li>
                <CheckCircle2 size={15} />
                {selected.dataSource === 'dataset'
                  ? 'The ML prediction stays fixed until a new dataset is uploaded.'
                  : 'Risk recalculates automatically after saving.'}
              </li>
              <li>
                <CheckCircle2 size={15} />
                Previous snapshots stay available for comparison.
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {progressOpen && (
        <ProgressModal
          open
          student={selected}
          onClose={() => setProgressOpen(false)}
        />
      )}
    </>
  )
}
