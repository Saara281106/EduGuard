import { createSampleStudents } from '../data/sampleStudents.js'
import { todayISO } from './format.js'

const STORAGE_KEY = 'eduguard.students.v2'

function normalizeStudent(student) {
  const attendance = Number(student.attendance) || 0
  const marks = Number(student.marks) || 0
  const history =
    Array.isArray(student.history) && student.history.length > 0
      ? student.history
      : [
          {
            date: todayISO(),
            attendance,
            marks,
            note: 'Current record',
          },
        ]

  return {
    ...student,
    attendance,
    marks,
    backlogs: Number(student.backlogs) || 0,
    semester: student.semester ? Number(student.semester) : null,
    history,
    interventions: Array.isArray(student.interventions) ? student.interventions : [],
  }
}

export function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeStudent)
      }
    }
  } catch (error) {
    console.warn('Could not read saved EduGuard data. Loading sample records.', error)
  }
  return createSampleStudents()
}

export function saveStudents(students) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
  } catch (error) {
    console.warn('Could not save EduGuard data to LocalStorage.', error)
  }
}

export function clearStoredStudents() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Could not clear EduGuard data.', error)
  }
}
