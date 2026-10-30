export function sortedHistory(history = []) {
  return [...history].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

export function getProgress(student) {
  const history = sortedHistory(student.history || [])
  const baseline = history[0] || {
    date: student.createdAt || '',
    attendance: student.attendance,
    marks: student.marks,
  }
  const current = {
    date: history[history.length - 1]?.date || student.updatedAt || '',
    attendance: Number(student.attendance) || 0,
    marks: Number(student.marks) || 0,
  }
  const attendanceDelta = current.attendance - Number(baseline.attendance || 0)
  const marksDelta = current.marks - Number(baseline.marks || 0)
  const hasHistory = history.length > 1

  let trend = 'stable'
  if (hasHistory) {
    if (attendanceDelta > 0 && marksDelta > 0) trend = 'improved'
    else if (attendanceDelta < 0 && marksDelta < 0) trend = 'declined'
    else if (attendanceDelta !== 0 || marksDelta !== 0) trend = 'mixed'
  }

  return {
    history,
    baseline: {
      date: baseline.date,
      attendance: Number(baseline.attendance) || 0,
      marks: Number(baseline.marks) || 0,
    },
    current,
    attendanceDelta,
    marksDelta,
    hasHistory,
    trend,
  }
}

export const TREND_LABELS = {
  improved: 'Improved',
  declined: 'Declined',
  mixed: 'Mixed progress',
  stable: 'No change yet',
}
