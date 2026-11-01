import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import { RISK_LEVELS } from '../lib/riskEngine.js'
import { useApp } from '../context/AppContext.jsx'

const RISK_COLORS = {
  Low: RISK_LEVELS.Low?.color || '#0f9f6e',
  Medium: RISK_LEVELS.Medium?.color || '#e17b00',
  High: RISK_LEVELS.High?.color || '#dc2626',
}

function getFirstValue(record, keys) {
  for (const key of keys) {
    const value = record?.[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return null
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(String(value).replace('%', '').trim())
  return Number.isFinite(number) ? number : null
}

function getDropoutProbability(student) {
  const raw = getFirstValue(student, [
    'dropout_probability',
    'dropoutProbability',
    'risk_probability',
    'riskProbability',
    'probability',
  ])

  let probability = toNumber(raw)

  if (probability !== null) {
    // The API may return either a 0–1 probability or a 0–100 percentage.
    if (probability > 1) probability /= 100
    return Math.min(1, Math.max(0, probability))
  }

  // Fallback to the predicted class when a probability was not returned.
  const outcome = String(
    getFirstValue(student, ['predicted_outcome', 'prediction', 'outcome']) || '',
  ).toLowerCase()

  if (outcome === 'dropout') return 0.8
  if (outcome === 'graduate') return 0.1
  if (outcome === 'enrolled') return 0.45
  return null
}

function getRiskCategory(student) {
  const probability = getDropoutProbability(student)

  if (probability === null) return 'Medium'

  // Use the same rounded score thresholds as the dataset mapper so the
  // dashboard, sidebar and risk list always report identical counts.
  const score = Math.round(probability * 100)
  if (score <= 30) return 'Low'
  if (score <= 60) return 'Medium'
  return 'High'
}

function getAttendance(student) {
  return toNumber(
    getFirstValue(student, [
      'attendance',
      'attendance_percentage',
      'attendance_percent',
      'attendance_rate',
      'Attendance',
    ]),
  )
}

function getMarks(student) {
  return toNumber(
    getFirstValue(student, [
      'marks',
      'marks_percentage',
      'marks_percent',
      'academic_score',
      'grade',
      'Marks',
    ]),
  )
}

function average(records, getter) {
  const values = records.map(getter).filter((value) => value !== null)
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey || item.name}>
          <span style={{ background: item.color }} />
          {item.name}: <b>{item.value}%</b>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ navigate }) {
  const { students, activeDataset, datasetLoading } = useApp()
  const predictions = activeDataset && Array.isArray(students) ? students : []

  // All dashboard analytics below are derived from the active uploaded dataset.
  const analytics = useMemo(() => {
    const records = predictions.map((student, index) => {
      const id = String(
        getFirstValue(student, ['student_id', 'studentId', 'id', 'roll_no', 'roll_number']) ??
          `Student-${index + 1}`,
      )
      const name = String(
        getFirstValue(student, ['name', 'student_name', 'full_name']) ?? id,
      )
      const probability = getDropoutProbability(student)
      const riskCategory = getRiskCategory(student)
      const riskScore =
        probability === null ? 50 : Math.round(probability * 100)

      return {
        ...student,
        id,
        name,
        probability,
        riskCategory,
        riskScore,
        attendance: getAttendance(student),
        marks: getMarks(student),
      }
    })

    const counts = { Low: 0, Medium: 0, High: 0 }
    records.forEach((student) => {
      counts[student.riskCategory] += 1
    })

    const pieData = ['Low', 'Medium', 'High'].map((category) => ({
      name: RISK_LEVELS[category]?.label || `${category} Risk`,
      category,
      value: counts[category],
      color: RISK_COLORS[category],
    }))

    const barData = ['Low', 'Medium', 'High'].map((category) => {
      const group = records.filter((student) => student.riskCategory === category)
      return {
        name: `${category} risk`,
        Attendance: average(group, (student) => student.attendance),
        Marks: average(group, (student) => student.marks),
        students: group.length,
        attendanceAvailable: group.some((student) => student.attendance !== null),
        marksAvailable: group.some((student) => student.marks !== null),
      }
    })

    const highRisk = records
      .filter((student) => student.riskCategory === 'High')
      .sort((a, b) => b.riskScore - a.riskScore)

    const interventions = records.flatMap((student) => student.interventions || [])
    const support = {
      total: interventions.length,
      Pending: interventions.filter((item) => item.status === 'Pending').length,
      'In Progress': interventions.filter((item) => item.status === 'In Progress').length,
      Completed: interventions.filter((item) => item.status === 'Completed').length,
    }

    return {
      records,
      counts,
      pieData,
      barData,
      highRisk,
      support,
      total: records.length,
    }
  }, [predictions])

  const { counts, pieData, barData, highRisk, support, total } = analytics
  const hasDataset = total > 0

  return (
    <>
      <PageHeader
        eyebrow={
          activeDataset
            ? `Active dataset · ${activeDataset.filename}`
            : 'No active dataset'
        }
        title="ML Prediction Analytics"
        subtitle={
          activeDataset
            ? `Charts and risk summaries use the ${total} records and ML predictions from the active dataset.`
            : 'Upload a dataset to generate ML predictions and analytics.'
        }
      />

      {!hasDataset ? (
        <section className="card empty-state" style={{ marginBottom: 24 }}>
          <ShieldCheck size={30} />
          <strong>
            {datasetLoading && !activeDataset
              ? 'Restoring the active dataset…'
              : 'No uploaded predictions yet'}
          </strong>
          <span>
            {datasetLoading && !activeDataset
              ? 'Checking the Flask backend for a saved dataset.'
              : 'Upload a dataset from the Dataset Upload page to view its risk analytics.'}
          </span>
          {!datasetLoading && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/upload')}
            >
              Upload dataset <ArrowRight size={16} />
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="stat-grid" aria-label="ML risk summary">
            <StatCard
              label="Uploaded Students"
              value={total}
              hint="Students analyzed by the ML model"
              icon={ShieldCheck}
              tone="blue"
            />
            <StatCard
              label="Low Risk"
              value={counts.Low}
              hint="Lower predicted dropout probability"
              icon={ShieldCheck}
              tone="green"
            />
            <StatCard
              label="Medium Risk"
              value={counts.Medium}
              hint="Students who need monitoring"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="High Risk"
              value={counts.High}
              hint="Students who may need urgent support"
              icon={AlertTriangle}
              tone="red"
            />
          </section>

          <section className="dashboard-charts">
            <article className="card chart-card">
              <div className="card-head">
                <div>
                  <h2>Risk distribution</h2>
                  <p>Uploaded students grouped by predicted dropout risk.</p>
                </div>
                <span className="card-chip">{total} analyzed</span>
              </div>

              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={272}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={105}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} students`, name]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 12px 28px rgba(15,39,68,.12)',
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <strong>{counts.High}</strong>
                  <span>high risk</span>
                </div>
              </div>

              <div className="chart-legend">
                {pieData.map((item) => (
                  <div key={item.category} className="legend-item">
                    <span className="legend-dot" style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="card chart-card">
              <div className="card-head">
                <div>
                  <h2>Attendance vs marks</h2>
                  <p>Average values from uploaded records, grouped by risk level.</p>
                </div>
                <div className="chart-key">
                  <span><i className="key-blue" />Attendance</span>
                  <span><i className="key-sky" />Marks</span>
                </div>
              </div>

              <div className="bar-chart-wrap">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={barData}
                    barGap={8}
                    margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8eef7" />
                    <XAxis
                      dataKey="name"
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
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4f8fd' }} />
                    <Bar dataKey="Attendance" fill="#2f6fed" radius={[6, 6, 0, 0]} maxBarSize={52} />
                    <Bar dataKey="Marks" fill="#9ec5ff" radius={[6, 6, 0, 0]} maxBarSize={52} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bar-summary">
                {barData.map((item) => (
                  <div key={item.name} className="bar-summary-item">
                    <span>{item.name}</span>
                    <strong>
                      {item.students} students
                      {!item.attendanceAvailable && !item.marksAvailable ? ' · no attendance/marks columns' : ''}
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="dashboard-lower">
            <article className="card attention-card">
              <div className="card-head">
                <div>
                  <h2>High-risk students requiring attention</h2>
                  <p>Ranked by predicted dropout probability from the uploaded dataset.</p>
                </div>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => navigate('/upload')}
                >
                  View uploaded data <ArrowRight size={15} />
                </button>
              </div>

              <div className="attention-list">
                {highRisk.length === 0 && (
                  <div className="empty-state compact-empty">
                    <ShieldCheck size={26} />
                    <strong>No high-risk students in this dataset</strong>
                    <span>None of the uploaded records crossed the high-risk threshold.</span>
                  </div>
                )}

                {highRisk.slice(0, 6).map((student) => (
                  <div key={student.id} className="attention-row">
                    <Avatar name={student.name} seed={student.id} />

                    <span className="attention-person">
                      <strong>{student.name}</strong>
                      <span>{student.id}</span>
                    </span>

                    <span className="attention-metric">
                      <strong>{student.attendance === null ? '—' : `${student.attendance}%`}</strong>
                      attendance
                    </span>

                    <span className="attention-metric">
                      <strong>{student.marks === null ? '—' : `${student.marks}%`}</strong>
                      marks
                    </span>

                    <span className="attention-score">{student.riskScore}</span>
                    <RiskBadge category={student.riskCategory} small />
                    <ChevronRight size={17} className="attention-arrow" />
                  </div>
                ))}
              </div>
            </article>

            <aside className="support-card card">
              <div className="support-head">
                <span className="support-icon">
                  <HeartHandshake size={19} />
                </span>
                <div>
                  <h2>Support pipeline</h2>
                  <p>Interventions assigned to students in the active dataset.</p>
                </div>
              </div>

              {support.total === 0 ? (
                <div className="empty-state compact-empty">
                  <HeartHandshake size={26} />
                  <strong>No interventions assigned yet</strong>
                  <span>
                    Assign support actions from the intervention desk to track
                    pending, in-progress, and completed follow-up.
                  </span>
                </div>
              ) : (
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#d97706' }} />
                    <span>Pending</span>
                    <strong>{support.Pending}</strong>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#7c3aed' }} />
                    <span>In progress</span>
                    <strong>{support['In Progress']}</strong>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#0f9f6e' }} />
                    <span>Completed</span>
                    <strong>{support.Completed}</strong>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-ghost btn-full"
                onClick={() => navigate('/interventions')}
              >
                Open intervention desk <ArrowRight size={15} />
              </button>
            </aside>
          </section>
        </>
      )}
    </>
  )
}
