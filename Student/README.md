# EduGuard — School/College Dropout Early-Warning System

EduGuard is a front-end hackathon MVP that helps schools and colleges spot students at risk of dropping out, understand **why** they are at risk, assign support interventions, and track whether those interventions are working.

Everything runs in the browser. There is no backend, database, external API, or machine-learning service.

> **Important:** the risk score is an **illustrative, transparent rule-based model** designed for a demo. It is **not** a validated ML model and must not be used for real academic decisions without review by qualified staff.

---

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

> On Windows PowerShell, if `npm` is blocked by the execution policy, use `npm.cmd` instead (for example `npm.cmd run dev`).

---

## Features

### Dashboard
- Live counts of all students plus Low / Medium / High risk totals.
- Risk distribution pie chart, attendance-vs-marks bar chart, and a high-risk watchlist.
- Institution switch between Schools and Colleges; all numbers are derived from the current records.

### Student management
- Search by student name or ID.
- Filter by institution type, risk category, and class/department.
- Paginated table with risk badges and quick profile access.
- Add new students and edit existing records through one form.
- School fields: class, section, class teacher.
- College fields: department, semester, backlogs, hostel status, mentor notes.
- Live risk preview while editing, so the effect of each indicator is visible.

### Risk prediction
- Shows the complete scoring rubric, weights, and thresholds.
- Risk explorer lets staff pick any student and see the contributing factors.
- Each factor lists the evidence (attendance %, marks, fees, backlogs, remarks) and points awarded.
- Every screen clearly labels the model as illustrative and rule-based.

### Student profile
- Personal and institution details, attendance, marks, fee status, backlogs, and hostel status.
- Risk score and category with a visual meter.
- Key risk factors with reasons and severity.
- Recommended interventions based on the detected factors.
- Intervention history and a progress history chart.

### Intervention management
- Assign interventions: Parent Call, Remedial Classes, Scholarship Assistance, Mentor Meeting, or Counselling.
- Add notes, owner, and due date.
- Update status inline: Pending → In Progress → Completed.
- Filter by status, type, or institution.

### Progress tracking
- Record a new attendance/marks update for any student.
- Before/after comparison cards with improved/declined indicators.
- Cohort-level statistics and a comparison chart.
- Full update history per student, with same-date entries replacing the previous one.

### Data & persistence
- 60 fictional sample students (30 schools, 30 colleges) with varied indicators.
- Seeded historical snapshots and interventions so the demo is populated on first load.
- All changes persist in `localStorage` under `eduguard.students.v2`.
- "Reset demo data" restores the original sample set.

---

## Risk model at a glance

| Rule | Condition | Points |
| --- | --- | --- |
| Low attendance | < 40% / 40–49% / 50–59% | 30 / 24 / 16 |
| Poor marks | < 25% / 25–39% | 25 / 16 |
| Pending fees | Pending / Partial | 15 / 7 |
| Backlogs | 3+ / 2 / 1 | 15 / 10 / 6 |
| Negative teacher remark | Flagged language in remarks | 10 |
| Negative mentor note | Flagged language in mentor notes | 10 |
| Personal/financial difficulty | Wellbeing or finance language | 5 |

The total is capped at 100.

| Score | Category |
| --- | --- |
| 0–30 | Low |
| 31–60 | Medium |
| 61–100 | High |

The engine also maps detected factors to suggested interventions and exposes a per-factor explanation so staff can audit the result.

---

## Project structure

```
index.html
package.json
vite.config.js
src/
  main.jsx                 App entry
  App.jsx                  Hash router and page metadata
  index.css                Style entry point
  components/              Reusable UI pieces
    Sidebar.jsx            Navigation + mobile drawer
    Topbar.jsx             Header, search, institution context
    Layout.jsx             App shell
    StatCard.jsx           Dashboard KPI cards
    RiskBadge.jsx          Low/Medium/High badge
    Avatar.jsx             Initials avatar
    Modal.jsx              Accessible modal shell
    StudentForm.jsx        Add/edit form with live risk preview
    StudentTable.jsx       Student list table
    AssignInterventionModal.jsx
    ProgressModal.jsx      Attendance/marks update form
    InterventionIcon.jsx   Icon per intervention type
    PageHeader.jsx         Page title block
  context/
    AppContext.jsx         CRUD, persistence, derived scores
  data/
    sampleStudents.js      Deterministic sample records + history
  lib/
    riskEngine.js          Rule-based scoring and recommendations
    storage.js             LocalStorage read/write
    progress.js            Before/after calculations
    format.js              Date/number/label helpers
  pages/
    Dashboard.jsx
    Students.jsx
    StudentProfile.jsx
    RiskPrediction.jsx
    Interventions.jsx
    ProgressTracking.jsx
  styles/
    base.css               Theme, shell, sidebar, forms, modal
    components.css         Cards, tables, badges, charts
    pages.css              Page layouts + responsive rules
```

---

## Tech stack

- React 18 + Vite 5
- Plain JavaScript (JSX)
- CSS with custom properties (no UI framework)
- Recharts for charts
- Lucide React for icons
- Browser `localStorage` for persistence

---

## Notes for reviewers

- The app is a single-page app using hash routes, so deep links such as `#/student/STU-1001` work after a refresh and on static hosting.
- Sample data is generated with a seeded random function, so every fresh install shows the same demo cohort.
- Clearing site data or using the in-app reset restores the demo dataset.
- The only build warning is Vite's chunk-size advisory caused by the Recharts dependency; it does not affect functionality.
