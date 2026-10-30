import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Info,
  Loader,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import Avatar from '../components/Avatar.jsx'
import InterventionIcon from '../components/InterventionIcon.jsx'
import AssignInterventionModal from '../components/AssignInterventionModal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { INTERVENTION_STATUSES, INTERVENTION_TYPES } from '../lib/riskEngine.js'
import { formatDate, percent } from '../lib/format.js'

export default function Interventions() {
  const { students, updateIntervention, deleteIntervention } = useApp()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [type, setType] = useState('All')
  const [assignOpen, setAssignOpen] = useState(false)

  const records = useMemo(
    () =>
      students
        .flatMap((student) =>
          (student.interventions || []).map((item) => ({ ...item, student })),
        )
        .sort((a, b) => String(b.assignedDate).localeCompare(String(a.assignedDate))),
    [students],
  )

  const counts = useMemo(() => {
    const result = { total: records.length, Pending: 0, 'In Progress': 0, Completed: 0 }
    records.forEach((item) => {
      if (result[item.status] !== undefined) result[item.status] += 1
    })
    return result
  }, [records])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return records.filter((item) => {
      const matchesSearch =
        !query ||
        item.student.name.toLowerCase().includes(query) ||
        item.student.id.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        (item.notes || '').toLowerCase().includes(query)
      const matchesStatus = status === 'All' || item.status === status
      const matchesType = type === 'All' || item.type === type
      return matchesSearch && matchesStatus && matchesType
    })
  }, [records, search, status, type])

  const hasFilters = search.trim() !== '' || status !== 'All' || type !== 'All'
  const resetFilters = () => {
    setSearch('')
    setStatus('All')
    setType('All')
  }

  const handleDelete = (item) => {
    const confirmed = window.confirm(
      `Remove the "${item.type}" intervention for ${item.student.name}? This cannot be undone.`,
    )
    if (confirmed) {
      deleteIntervention(item.student.id, item.id)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Support actions"
        title="Intervention management"
        subtitle="Assign, annotate and track every support action from pending to completed."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setAssignOpen(true)}>
            <Plus size={17} />
            Assign intervention
          </button>
        }
      />

      <section className="stat-grid compact-stats">
        <StatCard
          label="Total interventions"
          value={counts.total}
          hint="Across every student record"
          icon={HeartHandshake}
          tone="blue"
        />
        <StatCard
          label="Pending"
          value={counts.Pending}
          hint={`${percent(counts.Pending, counts.total)}% awaiting action`}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="In progress"
          value={counts['In Progress']}
          hint={`${percent(counts['In Progress'], counts.total)}% actively followed up`}
          icon={Loader}
          tone="violet"
        />
        <StatCard
          label="Completed"
          value={counts.Completed}
          hint={`${percent(counts.Completed, counts.total)}% of the pipeline closed`}
          icon={CheckCircle2}
          tone="green"
        />
      </section>

      <div className="page-note">
        <Info size={16} />
        Every status change and note is saved to the student's record and appears on their profile.
      </div>

      <section className="card table-card">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, intervention or notes…"
              aria-label="Search interventions"
            />
            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-select">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              {INTERVENTION_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select">
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              aria-label="Filter by intervention type"
            >
              <option value="All">All intervention types</option>
              {INTERVENTION_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        <div className="table-meta">
          <span>
            Showing <strong>{filtered.length}</strong> of <strong>{records.length}</strong>{' '}
            interventions
          </span>
          <span className="table-meta-right">Statuses can be changed directly in the table.</span>
        </div>

        <div className="table-scroll">
          <table className="data-table intervention-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Intervention</th>
                <th>Notes</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Status</th>
                <th className="align-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty">
                      <HeartHandshake size={28} />
                      <strong>No interventions match these filters</strong>
                      <span>Clear the filters or assign a new intervention to get started.</span>
                    </div>
                  </td>
                </tr>
              )}

              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="student-cell">
                      <Avatar name={item.student.name} seed={item.student.id} />
                      <div className="student-cell-text">
                        <strong>{item.student.name}</strong>
                        <span>{item.student.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="intervention-type">
                      <span className="recommendation-icon">
                        <InterventionIcon type={item.type} size={15} />
                      </span>
                      <span>{item.type}</span>
                    </div>
                  </td>
                  <td>
                    <p className="notes-cell" title={item.notes}>
                      {item.notes}
                    </p>
                  </td>
                  <td className="nowrap">{formatDate(item.assignedDate)}</td>
                  <td className="nowrap">{formatDate(item.completedDate)}</td>
                  <td>
                    <select
                      className={`status-select status-${item.status.toLowerCase().replace(' ', '-')}`}
                      value={item.status}
                      onChange={(event) =>
                        updateIntervention(item.student.id, item.id, {
                          status: event.target.value,
                        })
                      }
                      aria-label={`Status for ${item.type} assigned to ${item.student.name}`}
                    >
                      {INTERVENTION_STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        onClick={() => handleDelete(item)}
                        title="Remove intervention"
                        aria-label={`Remove ${item.type} for ${item.student.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {assignOpen && (
        <AssignInterventionModal open onClose={() => setAssignOpen(false)} />
      )}
    </>
  )
}
