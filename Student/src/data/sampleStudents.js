import { computeRisk } from '../lib/riskEngine.js'
import {
  clamp,
  dateDaysAgo,
  dateMonthsAgo,
  todayISO,
} from '../lib/format.js'

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Kabir', 'Meera', 'Arjun', 'Sneha', 'Vihaan', 'Kavya',
  'Aditya', 'Isha', 'Rahul', 'Nisha', 'Karan', 'Pooja', 'Siddharth', 'Riya', 'Dev', 'Tanvi',
  'Aman', 'Neha', 'Yash', 'Simran', 'Varun', 'Aditi', 'Harsh', 'Ritu', 'Naman', 'Shreya',
  'Abhishek', 'Divya', 'Manav', 'Anjali', 'Nikhil', 'Swati', 'Sahil', 'Deepika', 'Vivek', 'Ayesha',
  'Om', 'Fatima', 'Pranav', 'Sana', 'Ayush', 'Nandini', 'Rudra', 'Ritika', 'Krishna', 'Meghna',
  'Tejas', 'Saraswati', 'Zoya', 'Imran', 'Lakshmi', 'Rishabh', 'Aisha', 'Ved', 'Ira', 'Dhruv',
]

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Nair', 'Reddy', 'Iyer', 'Verma', 'Gupta', 'Mehta', 'Desai',
  'Khan', 'Das', 'Chatterjee', 'Menon', 'Joshi', 'Kulkarni', 'Rao', 'Bhat', 'Kapoor', 'Malhotra',
  'Bhattacharya', 'Pillai', 'Saxena', 'Agarwal', 'Chakraborty', 'Sheikh', 'Yadav', 'Mishra', 'Fernandes', 'Krishnan',
]

const TEACHERS = [
  'Mrs. Anjali Rao', 'Mr. Sanjay Kulkarni', 'Ms. Farah Sheikh', 'Mrs. Leela Menon',
  'Mr. Rakesh Verma', 'Ms. Priyanka Das', 'Mr. Thomas Fernandes', 'Mrs. Kavita Joshi',
]

const SCHOOLS = ['Sunrise Public School', 'Greenwood International School']
const COLLEGES = ['Northfield College of Arts & Science', 'Crescent Institute of Technology']

const DEPARTMENTS = [
  'Computer Science', 'Commerce', 'Mechanical Engineering', 'Psychology',
  'Biotechnology', 'Business Administration', 'Electronics', 'English Literature',
]

const SCHOOL_NOTES_NEGATIVE = [
  'Frequent absenteeism; homework is not submitted regularly.',
  'Weak classroom participation and incomplete classwork.',
  'Needs closer monitoring; attention and focus are inconsistent.',
  'Irregular attendance and disengaged during lessons.',
  'Struggling with Mathematics; needs extra practice and support.',
  'Personal difficulties at home are affecting focus and attendance.',
]

const SCHOOL_NOTES_POSITIVE = [
  'Consistent performer with good classroom participation.',
  'Active in class activities and punctual.',
  'Shows steady improvement and attends regularly.',
  'Well-behaved, attentive and helpful to classmates.',
  'Good academic progress; homework is submitted on time.',
]

const COLLEGE_NOTES_NEGATIVE = [
  'Irregular attendance; missing laboratory sessions.',
  'Struggling with core subjects and disengaged during mentoring.',
  'Low motivation this semester; assignments are incomplete.',
  'Financial difficulty at home; fee payment is delayed.',
  'Personal stress is affecting academic focus and attendance.',
  'Weak performance in internal assessments; needs a study plan.',
]

const COLLEGE_NOTES_POSITIVE = [
  'Active participant in department activities and mentoring.',
  'Consistent academic progress with good attendance.',
  'Responsible and engaged; regularly attends mentor meetings.',
  'Improving steadily this semester; completes assignments on time.',
  'Strong classroom participation and collaborative attitude.',
]

const INTERVENTION_NOTES = {
  'Parent Call': 'Discussed the attendance pattern with the guardian and agreed on weekly check-ins.',
  'Remedial Classes': 'Enrolled the student in focused remedial sessions for weak subjects.',
  'Scholarship Assistance': 'Shared fee-assistance and scholarship options with the family.',
  'Mentor Meeting': 'Mentor review scheduled to prepare a backlog clearance plan.',
  Counselling: 'Confidential counselling session arranged with the student.',
}

function mulberry32(seed) {
  let value = seed
  return function random() {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function pick(list, index) {
  return list[index % list.length]
}

function makeHistory(attendance, marks, random) {
  const firstAttendance = clamp(Math.round(attendance + random() * 26 - 13), 24, 99)
  const firstMarks = clamp(Math.round(marks + random() * 22 - 11), 18, 98)
  const midAttendance = clamp(Math.round((firstAttendance + attendance) / 2 + random() * 8 - 4), 24, 99)
  const midMarks = clamp(Math.round((firstMarks + marks) / 2 + random() * 8 - 4), 18, 98)

  return [
    {
      date: dateMonthsAgo(3),
      attendance: firstAttendance,
      marks: firstMarks,
      note: 'Initial assessment at the start of the term.',
    },
    {
      date: dateMonthsAgo(1),
      attendance: midAttendance,
      marks: midMarks,
      note: 'Mid-term review recorded by the class teacher / mentor.',
    },
    {
      date: todayISO(),
      attendance,
      marks,
      note: 'Current snapshot used for the risk score.',
    },
  ]
}

function makeInterventions(student, risk, index, random) {
  const shouldSeed =
    risk.riskCategory === 'High' || (risk.riskCategory === 'Medium' && index % 4 === 0)
  if (!shouldSeed) return []

  const recommendations = risk.recommendations.slice(0, 2)
  if (recommendations.length === 0) return []

  const count = risk.riskCategory === 'High' ? (index % 2 === 0 ? 2 : 1) : 1
  const statuses = ['Pending', 'In Progress', 'Completed']

  return Array.from({ length: count }, (_, itemIndex) => {
    const type = recommendations[itemIndex % recommendations.length].type
    const status = statuses[(index + itemIndex) % statuses.length]
    const assignedDaysAgo = 22 + (index % 20) + itemIndex * 4

    return {
      id: `INT-${student.id.replace('STU-', '')}-${itemIndex + 1}`,
      type,
      notes: INTERVENTION_NOTES[type],
      status,
      assignedDate: dateDaysAgo(assignedDaysAgo),
      completedDate: status === 'Completed' ? dateDaysAgo(4 + (index % 9)) : null,
      updatedBy: 'Demo Coordinator',
    }
  })
}

export function createSampleStudents() {
  const random = mulberry32(20261030)
  const attendanceBands = [93, 86, 58, 47, 89, 66, 34, 72, 52, 80]
  const marksBands = [85, 63, 37, 49, 76, 31, 42, 68, 57, 39]
  const backlogBands = [0, 1, 0, 2, 0, 3, 1, 0, 2, 0]

  const students = Array.from({ length: 60 }, (_, index) => {
    const isSchool = index % 2 === 0
    const highRiskCase = index % 9 === 4

    const attendance = highRiskCase
      ? clamp(27 + (index % 6) * 3 + Math.round(random() * 6 - 3), 22, 48)
      : clamp(
          attendanceBands[index % attendanceBands.length] + Math.round(random() * 8 - 4),
          22,
          98,
        )
    const marks = highRiskCase
      ? clamp(20 + (index % 5) * 4 + Math.round(random() * 4 - 2), 20, 39)
      : clamp(
          marksBands[index % marksBands.length] + Math.round(random() * 10 - 5),
          20,
          97,
        )
    const feeStatus = highRiskCase
      ? 'Pending'
      : index % 9 === 2
        ? 'Pending'
        : index % 7 === 3
          ? 'Partial'
          : 'Paid'
    const backlogs = isSchool
      ? 0
      : highRiskCase
        ? 3
        : backlogBands[index % backlogBands.length]

    let teacherRemarks = ''
    let mentorNotes = ''

    const concernLikely =
      attendance < 60 || marks < 40 || feeStatus !== 'Paid' || backlogs >= 2

    if (isSchool) {
      const negative = highRiskCase || (concernLikely ? random() < 0.72 : random() < 0.1)
      teacherRemarks = negative
        ? highRiskCase
          ? 'Frequent absenteeism; personal difficulties at home are affecting focus.'
          : pick(SCHOOL_NOTES_NEGATIVE, index)
        : pick(SCHOOL_NOTES_POSITIVE, index)
    } else {
      const negative = highRiskCase || (concernLikely ? random() < 0.74 : random() < 0.12)
      if (negative) {
        mentorNotes = highRiskCase
          ? 'Financial difficulty at home; fee payment is delayed and attendance is irregular.'
          : feeStatus === 'Pending' && random() < 0.6
            ? 'Financial difficulty at home; fee payment is delayed.'
            : pick(COLLEGE_NOTES_NEGATIVE, index)
      } else {
        mentorNotes = pick(COLLEGE_NOTES_POSITIVE, index)
      }
    }

    const base = {
      id: `STU-${1001 + index}`,
      name: `${pick(FIRST_NAMES, index)} ${pick(LAST_NAMES, index * 7 + 3)}`,
      institutionType: isSchool ? 'School' : 'College',
      institutionName: isSchool ? pick(SCHOOLS, index) : pick(COLLEGES, index),
      attendance,
      marks,
      feeStatus,
      backlogs,
      teacherRemarks,
      mentorNotes,
      createdAt: dateMonthsAgo(6),
      history: makeHistory(attendance, marks, random),
    }

    if (isSchool) {
      base.className = String(6 + (index % 5))
      base.section = pick(['A', 'B', 'C'], index)
      base.classTeacher = pick(TEACHERS, index)
      base.department = ''
      base.semester = null
      base.hostelStatus = ''
    } else {
      base.className = ''
      base.section = ''
      base.classTeacher = ''
      base.department = pick(DEPARTMENTS, Math.floor(index / 2))
      base.semester = 1 + (index % 6)
      base.hostelStatus = index % 3 === 0 ? 'Hosteller' : 'Day Scholar'
    }

    const risk = computeRisk(base)
    base.interventions = makeInterventions(base, risk, index, random)
    return base
  })

  return students
}
