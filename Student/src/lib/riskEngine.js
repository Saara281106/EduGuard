export const RISK_LEVELS = {
  Low: {
    label: 'Low Risk',
    range: '0–30',
    color: '#0f9f6e',
    soft: '#e8f8f1',
    track: '#c9ecdd',
  },
  Medium: {
    label: 'Medium Risk',
    range: '31–60',
    color: '#d97706',
    soft: '#fff6e6',
    track: '#fbe4b8',
  },
  High: {
    label: 'High Risk',
    range: '61–100',
    color: '#dc2626',
    soft: '#fdecec',
    track: '#f7c9c9',
  },
}

export const INTERVENTION_TYPES = [
  'Parent Call',
  'Remedial Classes',
  'Scholarship Assistance',
  'Mentor Meeting',
  'Counselling',
]

export const INTERVENTION_STATUSES = ['Pending', 'In Progress', 'Completed']

export const INTERVENTION_GUIDE = {
  'Parent Call': {
    description: 'Talk to the family about attendance barriers and agree on a follow-up plan.',
    reason: 'Low attendance',
  },
  'Remedial Classes': {
    description: 'Enrol the student in focused remedial sessions for weak subjects.',
    reason: 'Poor academic marks',
  },
  'Scholarship Assistance': {
    description: 'Connect the family with fee waivers, scholarships or instalment options.',
    reason: 'Pending fees',
  },
  'Mentor Meeting': {
    description: 'Review academic backlogs and build a step-by-step clearance plan.',
    reason: 'Multiple backlogs',
  },
  Counselling: {
    description: 'Offer a confidential session to understand personal or classroom difficulties.',
    reason: 'Wellbeing or behaviour concern',
  },
}

const NEGATIVE_NOTE =
  /absent|irregular|poor|weak|struggl|disengag|missing|low motivation|financial|difficult|not submitted|careless|withdrawn|bunk|incomplete|fail|distract|inconsistent|closer monitoring|needs support/i

const PERSONAL_NOTE =
  /personal|family|financial|emotional|motivation|health|home|stress|anxiety|wellbeing/i

function factor(key, label, detail, points, max) {
  return {
    key,
    label,
    detail,
    points,
    max,
    severity: points / max >= 0.66 ? 'high' : points / max >= 0.3 ? 'medium' : 'low',
  }
}

/**
 * Illustrative rule-based risk model (not a validated ML prediction).
 * Every rule contributes weighted points; the total is capped at 100.
 */
export function computeRisk(student) {
  const attendance = Number(student.attendance) || 0
  const marks = Number(student.marks) || 0
  const backlogs = Number(student.backlogs) || 0
  const factors = []

  if (attendance < 60) {
    const points = attendance < 40 ? 30 : attendance < 50 ? 24 : 16
    factors.push(
      factor(
        'attendance',
        'Low attendance',
        `Attendance is ${attendance}% — below the 60% threshold.`,
        points,
        30,
      ),
    )
  }

  if (marks < 40) {
    const points = marks < 25 ? 25 : 16
    factors.push(
      factor(
        'marks',
        'Poor academic marks',
        `Latest marks are ${marks}% — below the 40% pass benchmark.`,
        points,
        25,
      ),
    )
  }

  if (student.feeStatus === 'Pending') {
    factors.push(
      factor('fees', 'Pending fees', 'Tuition or institutional fees are still unpaid.', 15, 15),
    )
  } else if (student.feeStatus === 'Partial') {
    factors.push(
      factor('fees', 'Partially paid fees', 'Only part of the institutional fee has been paid.', 7, 15),
    )
  }

  if (backlogs > 0) {
    const points = backlogs >= 3 ? 15 : backlogs === 2 ? 10 : 6
    factors.push(
      factor(
        'backlogs',
        'Multiple backlogs',
        `${backlogs} subject${backlogs > 1 ? 's are' : ' is'} pending clearance.`,
        points,
        15,
      ),
    )
  }

  const teacherNote = (student.teacherRemarks || '').trim()
  if (teacherNote && NEGATIVE_NOTE.test(teacherNote)) {
    factors.push(
      factor(
        'remarks',
        'Negative teacher remarks',
        'Class teacher has flagged disengagement or irregular academic behaviour.',
        10,
        10,
      ),
    )
  }

  const mentorNote = (student.mentorNotes || '').trim()
  if (mentorNote && NEGATIVE_NOTE.test(mentorNote)) {
    factors.push(
      factor(
        'mentor',
        'Negative mentor observation',
        'Mentor notes indicate academic, financial or personal difficulty.',
        10,
        10,
      ),
    )
  }

  const combinedNotes = `${teacherNote} ${mentorNote}`
  if (PERSONAL_NOTE.test(combinedNotes)) {
    factors.push(
      factor(
        'personal',
        'Personal or financial difficulty noted',
        'A staff member has recorded a wellbeing or financial concern.',
        5,
        5,
      ),
    )
  }

  const rawScore = factors.reduce((total, item) => total + item.points, 0)
  const riskScore = Math.min(100, rawScore)
  const riskCategory = riskScore <= 30 ? 'Low' : riskScore <= 60 ? 'Medium' : 'High'

  return {
    riskScore,
    riskCategory,
    riskFactors: factors.sort((a, b) => b.points - a.points),
    recommendations: buildRecommendations(factors),
  }
}

function buildRecommendations(factors) {
  const map = {
    attendance: 'Parent Call',
    marks: 'Remedial Classes',
    fees: 'Scholarship Assistance',
    backlogs: 'Mentor Meeting',
    remarks: 'Counselling',
    mentor: 'Counselling',
    personal: 'Counselling',
  }

  const seen = new Set()
  return factors
    .map((item) => map[item.key])
    .filter((type) => {
      if (!type || seen.has(type)) return false
      seen.add(type)
      return true
    })
    .map((type) => ({ type, ...INTERVENTION_GUIDE[type] }))
}

export function riskLabel(category) {
  return RISK_LEVELS[category] || RISK_LEVELS.Low
}
