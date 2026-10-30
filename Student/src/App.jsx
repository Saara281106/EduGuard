import { useCallback, useEffect, useState } from 'react'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import RiskPrediction from './pages/RiskPrediction.jsx'
import Interventions from './pages/Interventions.jsx'
import ProgressTracking from './pages/ProgressTracking.jsx'

const VALID_PAGES = ['dashboard', 'students', 'risk', 'interventions', 'progress']

const PAGE_META = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'A live view of student risk and support.',
  },
  students: {
    title: 'Students',
    subtitle: 'Search, filter and manage every student record.',
  },
  profile: {
    title: 'Student profile',
    subtitle: 'Risk factors, interventions and academic progress.',
  },
  risk: {
    title: 'Risk prediction',
    subtitle: 'Illustrative rule-based scoring with clear reasons.',
  },
  interventions: {
    title: 'Interventions',
    subtitle: 'Assign, update and close support actions.',
  },
  progress: {
    title: 'Progress tracking',
    subtitle: 'Compare indicators before and after support.',
  },
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [page, id] = raw.split('/').filter(Boolean)

  if (page === 'student' && id) {
    return { page: 'profile', id: decodeURIComponent(id) }
  }

  return {
    page: VALID_PAGES.includes(page) ? page : 'dashboard',
    id: '',
  }
}

export default function App() {
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.page, route.id])

  useEffect(() => {
    document.title =
      route.page === 'dashboard'
        ? 'EduGuard · Dropout Early-Warning System'
        : `EduGuard · ${PAGE_META[route.page].title}`
  }, [route.page])

  const navigate = useCallback((path) => {
    const clean = path.startsWith('/') ? path : `/${path}`
    const nextHash = `#${clean}`
    if (window.location.hash === nextHash) {
      window.scrollTo(0, 0)
      return
    }
    window.location.hash = clean
  }, [])

  const meta = PAGE_META[route.page] || PAGE_META.dashboard

  return (
    <Layout meta={meta} route={route} navigate={navigate}>
      {route.page === 'dashboard' && <Dashboard navigate={navigate} />}
      {route.page === 'students' && <Students navigate={navigate} />}
      {route.page === 'profile' && (
        <StudentProfile studentId={route.id} navigate={navigate} />
      )}
      {route.page === 'risk' && <RiskPrediction navigate={navigate} />}
      {route.page === 'interventions' && <Interventions navigate={navigate} />}
      {route.page === 'progress' && <ProgressTracking navigate={navigate} />}
    </Layout>
  )
}
