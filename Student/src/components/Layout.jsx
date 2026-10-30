import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Layout({ children, meta, route, navigate }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toast } = useApp()
  const activePage = route.page === 'profile' ? 'students' : route.page

  useEffect(() => {
    setMobileOpen(false)
  }, [route.page, route.id])

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="main-area">
        <Topbar meta={meta} onMenu={() => setMobileOpen(true)} navigate={navigate} />
        <main className="content">
          <div className="page-view" key={`${route.page}-${route.id || ''}`}>
            {children}
          </div>
        </main>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.type === 'warning' ? (
            <AlertTriangle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
