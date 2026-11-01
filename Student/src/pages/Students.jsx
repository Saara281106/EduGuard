import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StudentTable from '../components/StudentTable.jsx'
import StudentForm from '../components/StudentForm.jsx'
import Modal from '../components/Modal.jsx'
import { useApp } from '../context/AppContext.jsx'

const PAGE_SIZE = 10

function pageWindow(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = [1]
  if (current > 4) pages.push('start-gap')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let number = start; number <= end; number += 1) {
    pages.push(number)
  }

  if (current < total - 3) pages.push('end-gap')
  pages.push(total)
  return pages
}

export default function Students({ navigate }) {
  const { students, activeDataset, addStudent, updateStudent } = useApp()
  const [search, setSearch] = useState('')
  const [institution, setInstitution] = useState('All')
  const [risk, setRisk] = useState('All')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students
      .filter((student) => {
        const matchesSearch =
          !query ||
          student.name.toLowerCase().includes(query) ||
          student.id.toLowerCase().includes(query)
        const matchesInstitution =
          institution === 'All' || student.institutionType === institution
        const matchesRisk = risk === 'All' || student.riskCategory === risk
        return matchesSearch && matchesInstitution && matchesRisk
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [students, search, institution, risk])

  const institutionOptions = useMemo(
    () =>
      [...new Set(students.map((student) => student.institutionType).filter(Boolean))].sort(),
    [students],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageStudents = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, filtered.length)
  const hasFilters = search.trim() !== '' || institution !== 'All' || risk !== 'All'

  const resetFilters = () => {
    setSearch('')
    setInstitution('All')
    setRisk('All')
    setPage(1)
  }

  const openAdd = () => setModal({ student: null })
  const openEdit = (student) => setModal({ student })
  const closeModal = () => setModal(null)

  const handleSubmit = (payload) => {
    if (modal?.student) {
      updateStudent(modal.student.id, payload)
      closeModal()
    } else {
      const newId = addStudent(payload)
      closeModal()
      navigate(`/student/${newId}`)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={activeDataset ? `Active dataset · ${activeDataset.filename}` : 'Student records'}
        title="Student management"
        subtitle={
          activeDataset
            ? 'Every row below comes from the active uploaded dataset.'
            : 'Search, filter and maintain every school and college record in one place.'
        }
        actions={
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Plus size={17} />
            Add student
          </button>
        }
      />

      <section className="card table-card">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search by name or student ID…"
              aria-label="Search students by name or ID"
            />
            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-select">
            <Filter size={15} />
            <select
              value={institution}
              onChange={(event) => {
                setInstitution(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by institution type"
            >
              <option value="All">All institutions</option>
              {institutionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select">
            <SlidersHorizontal size={15} />
            <select
              value={risk}
              onChange={(event) => {
                setRisk(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by risk category"
            >
              <option value="All">All risk levels</option>
              <option value="Low">Low risk</option>
              <option value="Medium">Medium risk</option>
              <option value="High">High risk</option>
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
            Showing <strong>{start}–{end}</strong> of <strong>{filtered.length}</strong> students
          </span>
          <span className="table-meta-right">
            Risk scores recalculate automatically when a record changes.
          </span>
        </div>

        <StudentTable
          students={pageStudents}
          onView={(id) => navigate(`/student/${id}`)}
          onEdit={openEdit}
        />

        <div className="pagination">
          <span>
            Page {safePage} of {totalPages}
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="icon-btn icon-btn-soft"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            {pageWindow(safePage, totalPages).map((number) =>
              typeof number === 'number' ? (
                <button
                  key={number}
                  type="button"
                  className={`page-number ${number === safePage ? 'active' : ''}`}
                  onClick={() => setPage(number)}
                  aria-label={`Go to page ${number}`}
                  aria-current={number === safePage ? 'page' : undefined}
                >
                  {number}
                </button>
              ) : (
                <span key={number} className="page-gap" aria-hidden="true">
                  …
                </span>
              ),
            )}
            <button
              type="button"
              className="icon-btn icon-btn-soft"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {modal && (
        <Modal
          open
          onClose={closeModal}
          size="lg"
          title={modal.student ? 'Edit student record' : 'Add a new student'}
          subtitle={
            modal.student
              ? `Updating ${modal.student.name} (${modal.student.id}) recalculates the risk score automatically.`
              : 'Add a school or college student to the early-warning workspace.'
          }
        >
          <StudentForm
            initial={modal.student}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  )
}
