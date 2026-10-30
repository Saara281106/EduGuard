import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { computeRisk } from '../lib/riskEngine.js'
import { todayISO } from '../lib/format.js'
import { loadStudents, saveStudents, clearStoredStudents } from '../lib/storage.js'
import { createSampleStudents } from '../data/sampleStudents.js'

const AppContext = createContext(null)

function withRisk(student) {
  const risk = computeRisk(student)
  return { ...student, ...risk }
}

function nextStudentId(students) {
  const highest = students.reduce((max, student) => {
    const numeric = Number(String(student.id).replace('STU-', ''))
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max
  }, 1000)
  return `STU-${highest + 1}`
}

export function AppProvider({ children }) {
  const [students, setStudents] = useState(loadStudents)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    saveStudents(students)
  }, [students])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3400)
    return () => clearTimeout(timer)
  }, [toast])

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  const enrichedStudents = useMemo(
    () => students.map((student) => withRisk(student)),
    [students],
  )

  const addStudent = useCallback(
    (payload) => {
      const id = nextStudentId(students)
      const record = withRisk({
        ...payload,
        id,
        createdAt: todayISO(),
        history: [
          {
            date: todayISO(),
            attendance: Number(payload.attendance),
            marks: Number(payload.marks),
            note: 'Initial record created in EduGuard.',
          },
        ],
        interventions: [],
      })

      setStudents((previous) => [record, ...previous])
      notify(`${record.name} was added successfully.`)
      return id
    },
    [notify, students],
  )

  const updateStudent = useCallback(
    (id, patch) => {
      setStudents((previous) =>
        previous.map((student) => {
          if (student.id !== id) return student

          const merged = { ...student, ...patch, id: student.id }
          const academicChanged =
            Number(merged.attendance) !== Number(student.attendance) ||
            Number(merged.marks) !== Number(student.marks)

          let history = [...(merged.history || [])]
          if (academicChanged) {
            const entry = {
              date: todayISO(),
              attendance: Number(merged.attendance),
              marks: Number(merged.marks),
              note: 'Attendance and marks updated from the student record.',
            }
            const last = history[history.length - 1]
            if (last && last.date === entry.date) {
              history[history.length - 1] = entry
            } else {
              history.push(entry)
            }
          }

          merged.history = history
          merged.updatedAt = todayISO()
          return withRisk(merged)
        }),
      )
      notify('Student record updated and risk score recalculated.')
    },
    [notify],
  )

  const addProgressUpdate = useCallback(
    (studentId, payload) => {
      setStudents((previous) =>
        previous.map((student) => {
          if (student.id !== studentId) return student

          const entry = {
            date: payload.date || todayISO(),
            attendance: Number(payload.attendance),
            marks: Number(payload.marks),
            note: payload.note?.trim() || 'Progress check-in recorded.',
          }
          const history = [...(student.history || [])]
          const sameDateIndex = history.findIndex((item) => item.date === entry.date)
          if (sameDateIndex >= 0) {
            history[sameDateIndex] = entry
          } else {
            history.push(entry)
          }
          history.sort((a, b) => String(a.date).localeCompare(String(b.date)))

          return withRisk({
            ...student,
            attendance: entry.attendance,
            marks: entry.marks,
            history,
            updatedAt: todayISO(),
          })
        }),
      )
      notify('Progress update saved. Risk score recalculated.')
    },
    [notify],
  )

  const assignIntervention = useCallback(
    (studentId, payload) => {
      const student = students.find((item) => item.id === studentId)
      if (!student) return

      const intervention = {
        id: `INT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: payload.type,
        notes: payload.notes?.trim() || 'Intervention assigned by the administrator.',
        status: payload.status || 'Pending',
        assignedDate: payload.assignedDate || todayISO(),
        completedDate:
          payload.status === 'Completed' ? payload.completedDate || todayISO() : null,
        updatedBy: 'Administrator',
      }

      setStudents((previous) =>
        previous.map((item) =>
          item.id === studentId
            ? { ...item, interventions: [intervention, ...(item.interventions || [])] }
            : item,
        ),
      )
      notify(`${payload.type} assigned to ${student.name}.`)
      return intervention.id
    },
    [notify, students],
  )

  const updateIntervention = useCallback(
    (studentId, interventionId, patch) => {
      setStudents((previous) =>
        previous.map((student) => {
          if (student.id !== studentId) return student

          return {
            ...student,
            interventions: (student.interventions || []).map((item) => {
              if (item.id !== interventionId) return item
              const status = patch.status || item.status
              return {
                ...item,
                ...patch,
                status,
                completedDate:
                  status === 'Completed'
                    ? item.completedDate || todayISO()
                    : null,
              }
            }),
          }
        }),
      )
      notify('Intervention updated.')
    },
    [notify],
  )

  const deleteIntervention = useCallback(
    (studentId, interventionId) => {
      setStudents((previous) =>
        previous.map((student) =>
          student.id === studentId
            ? {
                ...student,
                interventions: (student.interventions || []).filter(
                  (item) => item.id !== interventionId,
                ),
              }
            : student,
        ),
      )
      notify('Intervention removed.')
    },
    [notify],
  )

  const resetData = useCallback(() => {
    clearStoredStudents()
    const sample = createSampleStudents()
    setStudents(sample)
    notify('Demo data restored. All local changes were reset.')
  }, [notify])

  const value = useMemo(
    () => ({
      students: enrichedStudents,
      addStudent,
      updateStudent,
      addProgressUpdate,
      assignIntervention,
      updateIntervention,
      deleteIntervention,
      resetData,
      toast,
      notify,
    }),
    [
      enrichedStudents,
      addStudent,
      updateStudent,
      addProgressUpdate,
      assignIntervention,
      updateIntervention,
      deleteIntervention,
      resetData,
      toast,
      notify,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider')
  }
  return context
}
