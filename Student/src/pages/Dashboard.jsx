import { useMemo, useState } from 'react'
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
  GraduationCap,
  HeartHandshake,
  Info,
  School,
  ShieldCheck,
  Users,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { RISK_LEVELS } from '../lib/riskEngine.js'
import { percent } from '../lib/format.js'

function average(records, key) {
  if (records.length === 0) return 0
  return Math.round(records.reduce((sum, item) => sum + Number(item[key] || 0), 0) / records.length)
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
  const { students } = useApp()
  const [institution, setInstitution] = useState('All')

  const scoped = useMemo(
    () =>
      institution === 'All'
        ? students
        : students.filter((student) => student.institutionType === institution),
    [students, institution],
  )

  const counts = useMemo(() => {
    const result = { Low: 0, Medium: 0, High: 0 }
    scoped.forEach((student) => {
      result[student.riskCategory] += 1
    })
    return result
  }, [scoped])

  const total = scoped.length
  const schoolCount = scoped.filter((student) => student.institutionType === 'School').length
  const collegeCount = scoped.filter((student) => student.institutionType === 'College').length

  const pieData = ['Low', 'Medium', 'High'].map((category) => ({
    name: RISK_LEVELS[category].label,
    value: counts[category],
    color: RISK_LEVELS[category].color,
  }))

  const barData = ['Low', 'Medium', 'High'].map((category) => {
    const group = scoped.filter((student) => student.riskCategory === category)
    return {
      name: `${category} risk`,
      Attendance: average(group, 'attendance'),
      Marks: average(group, 'marks'),
      students: group.length,
    }
  })

  const highRisk = useMemo(
    () =>
      scoped
        .filter((student) => student.riskCategory === 'High')
        .sort((a, b) => b.riskScore - a.riskScore),
    [scoped],
  )

  const interventions = useMemo(
    () => scoped.flatMap((student) => student.interventions || []),
    [scoped],
  )

  const pipeline = useMemo(() => {
    const result = { Pending: 0, 'In Progress': 0, Completed: 0 }
    interventions.forEach((item) => {
      if (result[item.status] !== undefined) result[item.status] += 1
    })
    return result
  }, [interventions])

  return (
    <>
      <PageHeader
        eyebrow="Live overview"
        title="Early-warning dashboard"
        subtitle="Monitor attendance, academic health and dropout risk across schools and colleges."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => navigate('/students')}>
            Manage students
            <ArrowRight size={16} />
          </button>
        }
      />

      <div className="dashboard-toolbar">
        <div className="segmented" role="group" aria-label="Filter dashboard by institution type">
          {[
            { value: 'All', label: 'All students' },
            { value: 'School', label: 'Schools' },
            { value: 'College', label: 'Colleges' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={institution === option.value ? 'active' : ''}
              onClick={() => setInstitution(option.value)}
            >
              {option.value === 'School' && <School size={15} />}
              {option.value === 'College' && <GraduationCap size={16} />}
              {option.label}
            </button>
          ))}
        </div>
        <span className="toolbar-note">
          <Info size={14} />
          All figures are calculated from {total} student records
        </span>
      </div>

      <section className="stat-grid" aria-label="Risk summary">
        <StatCard
          label="Total students"
          value={total}
          hint={`${schoolCount} school · ${collegeCount} college students`}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Low risk"
          value={counts.Low}
          hint={`${percent(counts.Low, total)}% of students on track`}
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="Medium risk"
          value={counts.Medium}
          hint={`${percent(counts.Medium, total)}% need monitoring`}
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="High risk"
          value={counts.High}
          hint={`${percent(counts.High, total)}% need urgent support`}
          icon={AlertTriangle}
          tone="red"
        />
      </section>

      <section className="dashboard-charts">
        <article className="card chart-card">
          <div className="card-head">
            <div>
              <h2>Risk distribution</h2>
              <p>Students grouped by the rule-based risk category.</p>
            </div>
            <span className="card-chip">{total} tracked</span>
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
                    <Cell key={entry.name} fill={entry.color} />
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
              <div key={item.name} className="legend-item">
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
              <p>Average indicators for each risk group.</p>
            </div>
            <div className="chart-key">
              <span><i className="key-blue" />Attendance</span>
              <span><i className="key-sky" />Marks</span>
            </div>
          </div>

          <div className="bar-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} barGap={8} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
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
                <strong>{item.students} students</strong>
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
              <p>Ranked by risk score. Open a profile to see the contributing factors.</p>
            </div>
            <button type="button" className="text-link" onClick={() => navigate('/risk')}>
              View all
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="attention-list">
            {highRisk.length === 0 && (
              <div className="empty-state compact-empty">
                <ShieldCheck size={26} />
                <strong>No high-risk students in this view</strong>
                <span>Switch the institution filter or review medium-risk records.</span>
              </div>
            )}

            {highRisk.slice(0, 6).map((student) => (
              <button
                key={student.id}
                type="button"
                className="attention-row"
                onClick={() => navigate(`/student/${student.id}`)}
              >
                <Avatar name={student.name} seed={student.id} />
                <span className="attention-person">
                  <strong>{student.name}</strong>
                  <span>
                    {student.id} ·{' '}
                    {student.institutionType === 'School'
                      ? `Class ${student.className}-${student.section}`
                      : `${student.department}, Sem ${student.semester}`}
                  </span>
                </span>
                <span className="attention-metric">
                  <strong>{student.attendance}%</strong>
                  attendance
                </span>
                <span className="attention-metric">
                  <strong>{student.marks}%</strong>
                  marks
                </span>
                <span className="attention-score">{student.riskScore}</span>
                <RiskBadge category={student.riskCategory} small />
                <ChevronRight size={17} className="attention-arrow" />
              </button>
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
              <p>{interventions.length} interventions logged</p>
            </div>
          </div>

          <div className="pipeline">
            {Object.entries(pipeline).map(([status, value]) => {
              const totalInterventions = interventions.length || 1
              const width = Math.round((value / totalInterventions) * 100)
              return (
                <div key={status} className="pipeline-row">
                  <div className="pipeline-label">
                    <span>{status}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="pipeline-track">
                    <span
                      className={`pipeline-fill pipeline-${status.toLowerCase().replace(' ', '-')}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="coverage-box">
            <div>
              <span>High-risk coverage</span>
              <strong>
                {
                  highRisk.filter((student) =>
                    (student.interventions || []).some((item) => item.status !== 'Completed'),
                  ).length
                }
                <small> / {highRisk.length}</small>
              </strong>
            </div>
            <p>High-risk students with at least one active intervention.</p>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-full"
            onClick={() => navigate('/interventions')}
          >
            Open intervention desk
            <ArrowRight size={15} />
          </button>
        </aside>
      </section>
    </>
  )
}
