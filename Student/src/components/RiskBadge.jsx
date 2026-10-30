import { RISK_LEVELS } from '../lib/riskEngine.js'

export default function RiskBadge({ category = 'Low', score = null, small = false }) {
  const level = RISK_LEVELS[category] || RISK_LEVELS.Low

  return (
    <span
      className={`risk-badge risk-${category.toLowerCase()} ${small ? 'risk-badge-sm' : ''}`}
      title={`${level.label} · score range ${level.range}`}
    >
      <span className="risk-dot" />
      {level.label}
      {score !== null && <strong>{score}</strong>}
    </span>
  )
}
