export default function StatCard({ label, value, hint, icon: Icon, tone = 'blue' }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-icon">
          <Icon size={20} strokeWidth={2.1} />
        </span>
        <span className="stat-spark" aria-hidden="true" />
      </div>
      <p className="stat-label">{label}</p>
      <div className="stat-value-row">
        <h3>{value}</h3>
      </div>
      {hint && <p className="stat-hint">{hint}</p>}
    </article>
  )
}
