import { Bell, CalendarDays, Menu } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Topbar({ meta, onMenu, navigate }) {
  const { students } = useApp()
  const highRisk = students.filter((student) => student.riskCategory === 'High').length
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn mobile-menu"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-date">
          <CalendarDays size={15} />
          {today}
        </span>
        <button
          type="button"
          className="icon-btn topbar-bell"
          title={`${highRisk} high-risk students need attention`}
          aria-label={`${highRisk} high-risk students need attention. Open risk prediction.`}
          onClick={() => navigate('/risk')}
        >
          <Bell size={18} />
          {highRisk > 0 && <span className="bell-dot">{highRisk}</span>}
        </button>
        <div className="topbar-user">
          <span className="user-avatar">AD</span>
          <div>
            <strong>Admin</strong>
            <span>Coordinator</span>
          </div>
        </div>
      </div>
    </header>
  )
}
