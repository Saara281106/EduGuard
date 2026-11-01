import { todayISO } from './format.js'
import { INTERVENTION_GUIDE } from './riskEngine.js'

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(String(value).replace('%', '').trim())
  return Number.isFinite(number) ? number : null
}

function firstValue(record, keys) {
  for (const key of keys) {
    const value = record?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

function formatNumber(value) {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return Number.isInteger(number) ? String(number) : number.toFixed(2)
}

function formatPercent(value) {
  const number = toNumber(value)
  return number === null ? '—' : `${formatNumber(number)}%`
}

function normalizeFeeStatus(value) {
  const text = String(value || '').trim().toLowerCase()
  if (text === 'paid') return 'Paid'
  if (text.includes('part')) return 'Partial'
  if (text.includes('unpaid') || text.includes('pending')) return 'Pending'
  return value ? String(value) : 'Not provided'
}

function buildIndicators(record) {
  const indicators = [
    ['Attendance', record.attendance_percentage, 'percent'],
    ['Internal marks', record.internal_marks_percentage, 'percent'],
    ['Semester marks', record.semester_marks_percentage, 'percent'],
    ['Assignment completion', record.assignment_completion_percentage, 'percent'],
    ['Previous CGPA', record.previous_cgpa, 'number'],
    ['Backlogs', record.backlogs, 'number'],
    ['Fee status', record.fee_status, 'text'],
    ['Scholarship', record.scholarship, 'text'],
    ['Financial issue', record.financial_issue, 'text'],
    ['LMS logins / month', record.lms_logins_per_month, 'number'],
    ['Library visits / month', record.library_visits_per_month, 'number'],
    ['Class participation', record.class_participation, 'text'],
    ['Mentor meetings / semester', record.mentor_meetings_per_semester, 'number'],
  ]

  return indicators
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value, type]) => ({
      label,
      value:
        type === 'percent'
          ? formatPercent(value)
          : type === 'number'
            ? formatNumber(value)
            : String(value),
    }))
}

function buildRecommendations({ attendance, marks, feeStatus, backlogs, financialIssue, classParticipation }) {
  const types = []

  if (attendance !== null && attendance < 60) types.push('Parent Call')
  if (marks !== null && marks < 40) types.push('Remedial Classes')
  if (feeStatus === 'Pending' || feeStatus === 'Partial') {
    types.push('Scholarship Assistance')
  }
  if (backlogs >= 2) types.push('Mentor Meeting')
  if (financialIssue === 'Yes' || classParticipation === 'Low') {
    types.push('Counselling')
  }

  return [...new Set(types)].map((type) => ({
    type,
    ...INTERVENTION_GUIDE[type],
  }))
}

/**
 * Convert an uploaded dataset (records + ML predictions) into the student
 * shape used by the existing EduGuard pages. Only fields present in the
 * dataset are populated; missing fields stay empty and are rendered as such.
 */
export function buildStudentsFromDataset(records = [], predictions = [], dataset = {}) {
  const predictionById = new Map(
    predictions.map((item) => [String(item.student_id), item]),
  )

  const uploadedDate = dataset.uploadedAt
    ? String(dataset.uploadedAt).slice(0, 10)
    : todayISO()

  return records.map((record, index) => {
    const id = String(
      firstValue(record, ['student_id', 'studentId', 'id', 'roll_no', 'roll_number']) ??
        index + 1,
    )
    const prediction = predictionById.get(id) || predictions[index] || {}

    const attendance = toNumber(
      firstValue(record, ['attendance_percentage', 'attendance', 'attendance_percent']),
    )
    const internalMarks = toNumber(
      firstValue(record, ['internal_marks_percentage', 'internal_marks']),
    )
    const semesterMarks = toNumber(
      firstValue(record, ['semester_marks_percentage', 'semester_marks']),
    )
    const marks =
      semesterMarks ?? internalMarks ?? toNumber(firstValue(record, ['marks', 'marks_percentage']))
    const backlogs = toNumber(record.backlogs) ?? 0
    const feeStatus = normalizeFeeStatus(record.fee_status)

    const probability = toNumber(prediction.dropout_probability)
    const dropoutProbability =
      probability === null ? null : Math.min(100, Math.max(0, probability))
    const riskScore =
      dropoutProbability === null ? 0 : Math.round(dropoutProbability)
    const riskCategory =
      dropoutProbability === null
        ? 'Medium'
        : riskScore <= 30
          ? 'Low'
          : riskScore <= 60
            ? 'Medium'
            : 'High'

    const explicitName = firstValue(record, ['student_name', 'name', 'full_name'])
    const name = explicitName ? String(explicitName) : `Student ${id}`
    const confidence = prediction.confidence || {}

    const recommendations = buildRecommendations({
      attendance,
      marks,
      feeStatus,
      backlogs,
      financialIssue: record.financial_issue,
      classParticipation: record.class_participation,
    })

    return {
      ...record,
      id,
      name,
      nameIsFallback: !explicitName,
      dataSource: 'dataset',
      datasetId: dataset.id || '',
      institutionType: record.institution_type || 'Not specified',
      institutionName: record.institution_name || 'Uploaded dataset',
      className: record.class_name || '',
      section: record.section || '',
      classTeacher: record.class_teacher || '',
      department: record.department || '',
      semester: record.semester ?? null,
      hostelStatus: record.hostel_status || '',
      attendance,
      marks,
      internalMarks,
      semesterMarks,
      assignmentCompletion: toNumber(record.assignment_completion_percentage),
      previousCgpa: toNumber(record.previous_cgpa),
      backlogs,
      feeStatus,
      scholarship: record.scholarship ?? null,
      financialIssue: record.financial_issue ?? null,
      lmsLogins: toNumber(record.lms_logins_per_month),
      libraryVisits: toNumber(record.library_visits_per_month),
      classParticipation: record.class_participation ?? null,
      mentorMeetings: toNumber(record.mentor_meetings_per_semester),
      teacherRemarks: record.teacher_remarks || '',
      mentorNotes: record.mentor_notes || '',
      createdAt: uploadedDate,
      updatedAt: uploadedDate,
      history: [
        {
          date: uploadedDate,
          attendance: attendance ?? 0,
          marks: marks ?? 0,
          note: 'Snapshot from the uploaded dataset.',
        },
      ],
      interventions: [],
      riskScore,
      riskCategory,
      riskFactors: [],
      recommendations,
      indicators: buildIndicators(record),
      dropout_probability: dropoutProbability,
      predicted_outcome: prediction.predicted_outcome ?? null,
      confidence,
      mlPrediction: {
        predictedOutcome: prediction.predicted_outcome ?? null,
        dropoutProbability,
        confidence,
      },
    }
  })
}

export function formatProbability(value) {
  const number = toNumber(value)
  return number === null ? '—' : `${number.toFixed(2)}%`
}

export function predictionConfidence(student) {
  const outcome = student?.predicted_outcome
  const confidence = student?.confidence
  if (!outcome || !confidence || typeof confidence !== 'object') return null
  return toNumber(confidence[outcome])
}
