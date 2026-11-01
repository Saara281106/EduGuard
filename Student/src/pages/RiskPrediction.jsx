import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  HeartPulse,
  Info,
  Layers,
  MessageSquare,
  Plus,
  Search,
  UserRound,
  Wallet,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Avatar from '../components/Avatar.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import InterventionIcon from '../components/InterventionIcon.jsx'
import AssignInterventionModal from '../components/AssignInterventionModal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { RISK_LEVELS } from '../lib/riskEngine.js'
import { formatProbability, predictionConfidence } from '../lib/dataset.js'

const FACTOR_ICONS = {
  attendance: CalendarDays,
  marks: BookOpen,
  fees: Wallet,
  backlogs: Layers,
  remarks: MessageSquare,
  mentor: MessageSquare,
  personal: HeartPulse,
}

const RULES = [
  {
    title: 'Attendance below 60%',
    points: '+16 to +30',
    icon: CalendarDays,
    text: '16 points for 50–59%, 24 for 40–49% and 30 below 40%.',
  },
  {
    title: 'Marks below 40%',
    points: '+16 or +25',
    icon: BookOpen,
    text: '16 points if marks are 25–39%, 25 points if marks fall below 25%.',
  },
  {
    title: 'Pending or partial fees',
    points: '+7 or +15',
    icon: Wallet,
    text: '15 points for pending fees and 7 points when fees are only partially paid.',
  },
  {
    title: 'Academic backlogs',
    points: '+6 to +15',
    icon: Layers,
    text: '6 points for one backlog, 10 for two and 15 for three or more.',
  },
  {
    title: 'Negative staff notes',
    points: '+10',
    icon: MessageSquare,
    text: 'Teacher remarks or mentor observations flagging disengagement add 10 points.',
  },
  {
    title: 'Personal difficulty',
    points: '+5',
    icon: HeartPulse,
    text: 'A recorded financial, family or wellbeing concern adds 5 points.',
  },
]

export default function RiskPrediction({ navigate }) {
  const { students, activeDataset } = useApp()
  const isDataset = Boolean(activeDataset)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedId, setSelectedId] = useState(
    () => [...students].sort((a, b) => b.riskScore - a.riskScore)[0]?.id || '',
  )
  const [assignOpen, setAssignOpen] = useState(false)

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...students]
      .filter((student) => {
        const matchesSearch =
          !query ||
          student.name.toLowerCase().includes(query) ||
          student.id.toLowerCase().includes(query)
        const matchesCategory = category === 'All' || student.riskCategory === category
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => b.riskScore - a.riskScore)
  }, [students, search, category])

  useEffect(() => {
    if (visible.length > 0 && !visible.some((student) => student.id === selectedId)) {
      setSelectedId(visible[0].id)
    }
  }, [visible, selectedId])

  const selected = students.find((student) => student.id === selectedId) || visible[0]

  return (
    <>
      <PageHeader
        eyebrow={isDataset ? 'Active dataset · ML model' : 'Illustrative model'}
        title={isDataset ? 'Dropout risk predictions' : 'Rule-based risk prediction'}
        subtitle={
          isDataset
            ? 'Scores below are the dropout probabilities returned by the trained EduGuard model for the active uploaded dataset.'
            : "See exactly which factors drive each student's score — no black-box predictions."
        }
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/interventions')}
          >
            Intervention desk
            <ArrowRight size={16} />
          </button>
        }
      />

      <div className="model-banner">
        <span className="model-banner-icon">
          <Brain size={22} />
        </span>
        <div>
          {isDataset ? (
            <>
              <strong>Predictions from the active uploaded dataset</strong>
              <p>
                {activeDataset.filename} ·{' '}
                {activeDataset.totalStudents ?? students.length} students. The score is the
                model's dropout probability, generated when the dataset was uploaded.
              </p>
            </>
          ) : (
            <>
              <strong>Transparent by design, not a validated ML model</strong>
              <p>
                EduGuard adds weighted points from six observable rules. The total is capped at
                100 and changes live whenever a student record is updated. This is an illustrative
                prototype for prioritising support, not a scientific dropout prediction.
              </p>
            </>
          )}
        </div>
        <div className="threshold-chips">
          {['Low', 'Medium', 'High'].map((level) => (
            <span key={level} className={`threshold-chip threshold-${level.toLowerCase()}`}>
              {RISK_LEVELS[level].range} {level}
            </span>
          ))}
        </div>
      </div>

      {!isDataset && (
        <section className="rule-grid">
          {RULES.map((rule) => {
          const Icon = rule.icon
          return (
            <article key={rule.title} className="rule-card">
              <span className="rule-icon">
                <Icon size={18} />
              </span>
              <div>
                <div className="rule-title">
                  <strong>{rule.title}</strong>
                  <span>{rule.points}</span>
                </div>
                <p>{rule.text}</p>
              </div>
            </article>
          )
        })}
        </section>
      )}

      <div className="risk-layout">
        <section className="card risk-list-card">
          <div className="card-head">
            <div>
              <h2>Students by risk</h2>
              <p>Highest scores appear first.</p>
            </div>
            <span className="card-chip">{visible.length}</span>
          </div>

          <div className="search-box risk-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student or ID…"
              aria-label="Search students in risk list"
            />
          </div>

          <div className="risk-filter-chips">
            {['All', 'High', 'Medium', 'Low'].map((level) => (
              <button
                key={level}
                type="button"
                className={`filter-chip ${category === level ? 'active' : ''}`}
                onClick={() => setCategory(level)}
              >
                {level === 'All' ? 'All' : `${level} risk`}
              </button>
            ))}
          </div>

          <div className="risk-list">
            {visible.length === 0 && (
              <div className="empty-state compact-empty">
                <UserRound size={24} />
                <strong>No matching students</strong>
                <span>Adjust the search or risk filter.</span>
              </div>
            )}

            {visible.map((student) => (
              <button
                key={student.id}
                type="button"
                className={`risk-list-item ${selected?.id === student.id ? 'active' : ''}`}
                onClick={() => setSelectedId(student.id)}
              >
                <Avatar name={student.name} seed={student.id} />
                <span className="risk-list-text">
                  <strong>{student.name}</strong>
                  <span>
                    {student.id} · {student.institutionType}
                  </span>
                </span>
                <span className="risk-list-right">
                  <span className={`risk-list-score score-${student.riskCategory.toLowerCase()}`}>
                    {student.riskScore}
                  </span>
                  <span className={`risk-list-dot risk-dot-${student.riskCategory.toLowerCase()}`} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <section className="card risk-detail">
            <div className="risk-detail-head">
              <Avatar name={selected.name} seed={selected.id} size="lg" />
              <div className="risk-detail-identity">
                <h2>{selected.name}</h2>
                <p>
                  {selected.id} · {selected.institutionName}
                </p>
                <RiskBadge category={selected.riskCategory} />
              </div>
              <div className="risk-detail-score">
                <strong>{selected.riskScore}</strong>
                <span>{isDataset ? 'predicted dropout %' : 'out of 100'}</span>
              </div>
            </div>

            <div className="risk-meter">
              <div className="risk-meter-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
              <div className="risk-meter-track">
                <span className="risk-meter-zone zone-low" />
                <span className="risk-meter-zone zone-medium" />
                <span className="risk-meter-zone zone-high" />
                <span
                  className="risk-meter-marker"
                  style={{
                    left: `${selected.riskScore}%`,
                    background: RISK_LEVELS[selected.riskCategory].color,
                  }}
                />
              </div>
            </div>

            <div className="quick-facts">
              <span>
                <CalendarDays size={14} />
                Attendance <strong>{selected.attendance}%</strong>
              </span>
              <span>
                <BookOpen size={14} />
                Marks <strong>{selected.marks}%</strong>
              </span>
              <span>
                <Wallet size={14} />
                Fees <strong>{selected.feeStatus}</strong>
              </span>
              {(isDataset || selected.institutionType === 'College') && (
                <span>
                  <Layers size={14} />
                  Backlogs <strong>{selected.backlogs}</strong>
                </span>
              )}
            </div>

            {isDataset ? (
              <>
                <h3 className="detail-section-title">ML prediction</h3>
                <div className="quick-facts">
                  <span>
                    Predicted outcome{' '}
                    <strong>{selected.predicted_outcome || '—'}</strong>
                  </span>
                  <span>
                    Dropout probability{' '}
                    <strong>{formatProbability(selected.dropout_probability)}</strong>
                  </span>
                  <span>
                    Confidence{' '}
                    <strong>{formatProbability(predictionConfidence(selected))}</strong>
                  </span>
                </div>

                <h3 className="detail-section-title">Uploaded dataset indicators</h3>
                {selected.indicators?.length ? (
                  <div className="quick-facts">
                    {selected.indicators.map((item) => (
                      <span key={item.label}>
                        {item.label} <strong>{item.value}</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="muted-note">
                    No additional indicator columns are available in this dataset.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="detail-section-title">Contributing reasons</h3>
                <div className="factor-list">
                  {selected.riskFactors.length === 0 && (
                    <div className="factor-empty">
                      <Info size={22} />
                      <div>
                        <strong>No rules triggered</strong>
                        <span>
                          This student currently scores 0 based on the available indicators.
                        </span>
                      </div>
                    </div>
                  )}

                  {selected.riskFactors.map((factor) => {
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
              </>
            )}

            <h3 className="detail-section-title">Suggested interventions</h3>
            <div className="risk-recommendations">
              {selected.recommendations.length === 0 && (
                <p className="muted-note">
                  No targeted intervention is triggered. Continue routine monitoring.
                </p>
              )}
              {selected.recommendations.map((item) => (
                <div key={item.type} className="risk-recommendation">
                  <span className="recommendation-icon">
                    <InterventionIcon type={item.type} size={16} />
                  </span>
                  <div>
                    <strong>{item.type}</strong>
                    <span>{item.reason}</span>
                  </div>
                </div>
              ))}
            </div>

            {isDataset && (
              <div className="model-note">
                <Info size={16} />
                <p>
                  This prediction was generated from the uploaded dataset. Progress check-ins
                  update the student record but do not re-run the ML model; upload a new dataset to
                  refresh predictions.
                </p>
              </div>
            )}

            <div className="risk-detail-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate(`/student/${selected.id}`)}
              >
                View full profile
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setAssignOpen(true)}
              >
                <Plus size={16} />
                Assign intervention
              </button>
            </div>
          </section>
        )}
      </div>

      {assignOpen && selected && (
        <AssignInterventionModal
          open
          studentId={selected.id}
          onClose={() => setAssignOpen(false)}
        />
      )}
    </>
  )
}
