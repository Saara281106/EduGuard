import {
  Activity,
  Brain,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { path: '/students', label: 'Students', icon: Users, page: 'students' },
  { path: '/risk', label: 'Risk Prediction', icon: Activity, page: 'risk' },
  { path: '/interventions', label: 'Interventions', icon: HeartHandshake, page: 'interventions' },
  { path: '/progress', label: 'Progress Tracking', icon: TrendingUp, page: 'progress' },
]

export default function Sidebar({ activePage, mobileOpen, onClose }) {
  const { students, resetData } = useApp()
  const highRisk = students.filter((student) => student.riskCategory === 'High').length

  const handleReset = () => {
    const confirmed = window.confirm(
      'Restore the original 60 demo students? This removes all locally saved edits, interventions and progress updates.',
    )
    if (confirmed) {
      resetData()
      onClose()
    }
  }

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <ShieldCheck size={24} strokeWidth={2.2} />
          </div>
          <div>
            <strong>EduGuard</strong>
            <span>Dropout early-warning</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-context">
          <GraduationCap size={16} />
          <span>Academic year 2026–27</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activePage === item.page
            return (
              <a
                key={item.page}
                href={`#${item.path}`}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-icon">
                  <Icon size={19} strokeWidth={2} />
                </span>
                <span>{item.label}</span>
                {item.page === 'risk' && highRisk > 0 && (
                  <span className="nav-badge">{highRisk}</span>
                )}
              </a>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="model-card">
            <div className="model-card-head">
              <Brain size={17} />
              <strong>Rule-based model</strong>
            </div>
            <p>Illustrative scoring for early support — not a validated ML prediction.</p>
          </div>

          <button type="button" className="sidebar-reset" onClick={handleReset}>
            <RotateCcw size={15} />
            Reset demo data
          </button>

          <div className="sidebar-save-state">
            <span className="save-dot" />
            Saved locally in this browser
          </div>
        </div>
      </aside>
    </>
  )
}
