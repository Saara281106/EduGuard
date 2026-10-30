import { Eye, Pencil, SearchX } from 'lucide-react'
import Avatar from './Avatar.jsx'
import RiskBadge from './RiskBadge.jsx'

function FeeChip({ status }) {
  const className =
    status === 'Paid' ? 'fee-paid' : status === 'Partial' ? 'fee-partial' : 'fee-pending'
  return <span className={`fee-chip ${className}`}>{status}</span>
}

function Metric({ value, low }) {
  return (
    <div className="table-metric">
      <span className={low ? 'metric-low' : ''}>{value}%</span>
      <span className="mini-track">
        <span
          className={`mini-fill ${low ? 'mini-fill-low' : ''}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
    </div>
  )
}

export default function StudentTable({ students, onView, onEdit }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Institution</th>
            <th>Class / Department</th>
            <th>Attendance</th>
            <th>Marks</th>
            <th>Fee status</th>
            <th>Risk score</th>
            <th>Risk category</th>
            <th className="align-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={9}>
                <div className="table-empty">
                  <SearchX size={28} />
                  <strong>No students match these filters</strong>
                  <span>Try clearing the search or choosing a different risk category.</span>
                </div>
              </td>
            </tr>
          )}

          {students.map((student) => (
            <tr key={student.id}>
              <td>
                <div className="student-cell">
                  <Avatar name={student.name} seed={student.id} />
                  <div className="student-cell-text">
                    <button type="button" className="link-button" onClick={() => onView(student.id)}>
                      {student.name}
                    </button>
                    <span>{student.id}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`type-chip type-${student.institutionType.toLowerCase()}`}>
                  {student.institutionType}
                </span>
              </td>
              <td>
                {student.institutionType === 'School' ? (
                  <div className="stacked-cell">
                    <span>Class {student.className}</span>
                    <span>Section {student.section}</span>
                  </div>
                ) : (
                  <div className="stacked-cell">
                    <span>{student.department}</span>
                    <span>Semester {student.semester}</span>
                  </div>
                )}
              </td>
              <td>
                <Metric value={student.attendance} low={student.attendance < 60} />
              </td>
              <td>
                <Metric value={student.marks} low={student.marks < 40} />
              </td>
              <td>
                <FeeChip status={student.feeStatus} />
              </td>
              <td>
                <span className={`score-text score-${student.riskCategory.toLowerCase()}`}>
                  {student.riskScore}
                  <small>/100</small>
                </span>
              </td>
              <td>
                <RiskBadge category={student.riskCategory} small />
              </td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-btn icon-btn-soft"
                    onClick={() => onView(student.id)}
                    title={`View ${student.name}`}
                    aria-label={`View ${student.name}`}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-soft"
                    onClick={() => onEdit(student)}
                    title={`Edit ${student.name}`}
                    aria-label={`Edit ${student.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
