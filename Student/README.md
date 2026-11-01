# EduGuard — School/College Dropout Early-Warning System

EduGuard is an education analytics dashboard that helps schools and colleges spot students at risk of dropping out, understand the contributing indicators, assign support interventions, and track progress after support.

The project has two parts:

1. **React front end** — dashboard, student records, risk explorer, profiles, interventions, and progress tracking.
2. **Flask ML service** — validates an uploaded CSV/XLSX dataset, runs the trained dropout model, and stores the active dataset.

The front end also works without the backend by falling back to a built-in demo cohort and a transparent, rule-based risk score.

> **Responsible-use note:** the ML predictions and rule-based scores are prototype outputs. They are not a validated dropout diagnosis and should never be the sole basis for decisions about a student. Use them to prioritise human review and support.

---

## Quick start

### 1. Front end

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

> On Windows PowerShell, if `npm` is blocked by the execution policy, use `npm.cmd` (for example `npm.cmd run dev`).

### 2. ML backend (optional but required for dataset upload)

The backend lives in `ml-analysis/`.

**Windows (PowerShell):**

```powershell
cd ml-analysis
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**macOS / Linux:**

```bash
cd ml-analysis
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API starts at `http://127.0.0.1:5000`. Keep it running while using the **Upload Dataset** page.

To point the front end at a different API URL, create a `.env` file in the project root:

```
VITE_API_URL=http://127.0.0.1:5000
```

### Regenerating the ML artifacts

The ML backend was already trained: `ml-analysis/model/eduguard_model.pkl` and `ml-analysis/data/studentDataset.csv` are included. To rebuild them from scratch:

```powershell
cd ml-analysis
python generate_data.py   # writes data/studentDataset.csv + public/studentDataset.csv
python train_model.py     # writes model/eduguard_model.pkl (hold-out accuracy is printed)
```

`train_model.py --skip-data` retrains without regenerating the CSVs. `notebooks/analysis.ipynb` walks through the exploratory analysis and trains the same model interactively.

---

## Using EduGuard

1. Start the front end and (for ML mode) the Flask backend.
2. Open **Upload Dataset** and select a CSV or XLSX file.
3. The backend validates the file, runs the trained model, and returns a dropout probability and predicted outcome for every student.
4. The active dataset is saved in SQLite and restored automatically on reload.
5. Dashboard, Students, Risk Prediction, Student Profile, Interventions, and Progress Tracking all use the uploaded records.
6. If no dataset is active, the app falls back to the built-in 60-student demo cohort for student management, interventions, and progress.

### Dataset requirements

- Formats: `.csv` or `.xlsx`, maximum 10 MB.
- `student_id` values must be present and unique.
- No empty values in the required columns.
- Percentage columns must be between 0 and 100; `previous_cgpa` must be between 0 and 10.
- Count columns cannot be negative.

Required columns:

```
student_id
attendance_percentage
internal_marks_percentage
semester_marks_percentage
backlogs
assignment_completion_percentage
previous_cgpa
fee_status
scholarship
financial_issue
lms_logins_per_month
library_visits_per_month
class_participation
mentor_meetings_per_semester
```

Allowed categorical values:

- `fee_status`: `Paid`, `Partially Paid`, `Unpaid`
- `scholarship`: `Yes`, `No`
- `financial_issue`: `Yes`, `No`
- `class_participation`: `High`, `Medium`, `Low`

Optional descriptive columns such as `student_name`, `institution_type`, `institution_name`, `class_name`, `section`, `department`, `semester`, `hostel_status`, `teacher_remarks`, and `mentor_notes` are shown when present.

A ready-to-upload sample file is included at `public/studentDataset.csv`.

---

## Features

### Dashboard
- Live totals for uploaded students and Low / Medium / High risk.
- Risk distribution donut chart and attendance-vs-marks comparison by risk group.
- High-risk watchlist ranked by predicted dropout probability.
- Support pipeline summary for interventions in the active dataset.
- Clear empty state with a direct link to dataset upload when no dataset is active.

### Student management
- Search by name or student ID.
- Filter by institution type and risk category.
- Paginated table with attendance, marks, fees, risk score, and risk category.
- Add and edit demo records with a live risk preview.
- Uploaded dataset rows are read-only inside the app, preserving the source data.

### Risk prediction
- ML mode shows the dropout probability returned by the trained model, the predicted outcome, and per-class confidence.
- Demo mode shows the full transparent scoring rubric and the exact reasons behind each score.
- Search and filter the student risk list; open a profile or assign an intervention directly.

### Student profile
- Institution and enrolment details.
- Attendance, marks, fees, backlogs, hostel status, and other available indicators.
- Risk score or ML dropout probability with a visual meter.
- Contributing factors, recommended interventions, and intervention history.
- Progress history chart with before/after check-ins.

### Intervention management
- Assign Parent Call, Remedial Classes, Scholarship Assistance, Mentor Meeting, or Counselling.
- Add notes, assign dates, and update status: Pending → In Progress → Completed.
- Filter by status, intervention type, or institution.

### Progress tracking
- Record new attendance and marks values for any student.
- Before/after comparison cards with improved, declined, or mixed indicators.
- Trend chart and full check-in history.
- Same-date check-ins replace the earlier entry instead of duplicating it.

### Dataset upload
- Drag-free file picker with CSV/XLSX validation messages.
- Active dataset summary and the full prediction results table.
- Remove the active dataset and restore demo mode from the sidebar.

---

## Risk logic

### ML mode

The trained model in `ml-analysis/model/eduguard_model.pkl` returns a dropout probability (0–100). The app maps it to:

| Score | Category |
| --- | --- |
| 0–30 | Low |
| 31–60 | Medium |
| 61–100 | High |

The upload response also includes the predicted outcome (`Dropout`, `Enrolled`, or `Graduate`) and confidence for each class.

### Demo / fallback mode

When no dataset is active, the original rule-based engine scores the demo students:

| Rule | Condition | Points |
| --- | --- | --- |
| Low attendance | < 40% / 40–49% / 50–59% | 30 / 24 / 16 |
| Poor marks | < 25% / 25–39% | 25 / 16 |
| Pending fees | Pending / Partial | 15 / 7 |
| Backlogs | 3+ / 2 / 1 | 15 / 10 / 6 |
| Negative teacher remark | Flagged language in remarks | 10 |
| Negative mentor note | Flagged language in mentor notes | 10 |
| Personal/financial difficulty | Wellbeing or finance language | 5 |

The total is capped at 100 and uses the same Low / Medium / High thresholds.

---

## Project structure

```
index.html
package.json
vite.config.js
public/
  studentDataset.csv        Sample upload file
src/
  main.jsx                  App entry
  App.jsx                   Hash router and page metadata
  index.css                 Style entry point
  components/               Reusable UI pieces
    Sidebar.jsx             Navigation + mobile drawer
    Topbar.jsx              Header, alerts, user
    Layout.jsx              App shell
    DatasetUpload.jsx       Dataset upload + prediction results
    StudentForm.jsx         Add/edit form with live risk preview
    StudentTable.jsx        Student list table
    AssignInterventionModal.jsx
    ProgressModal.jsx       Attendance/marks check-in form
    ...                     Cards, badges, modal, avatar, icons
  context/
    AppContext.jsx          CRUD, dataset restore, persistence
  data/
    sampleStudents.js       Deterministic 60-student demo cohort
  lib/
    api.js                  Flask API client
    dataset.js              Dataset → student record mapping
    riskEngine.js           Rule-based scoring and recommendations
    storage.js              LocalStorage persistence
    progress.js             Before/after calculations
    format.js               Date/number helpers
  pages/
    Dashboard.jsx
    Students.jsx
    StudentProfile.jsx
    RiskPrediction.jsx
    Interventions.jsx
    ProgressTracking.jsx
  styles/
    base.css                Theme, shell, sidebar, forms, modal
    components.css          Cards, tables, badges, charts
    pages.css               Page layouts + responsive rules
ml-analysis/
  app.py                    Flask API
  generate_data.py          Synthetic dataset generator (training data + sample file)
  train_model.py            Trains and saves the model bundle
  requirements.txt          Python dependencies
  model/eduguard_model.pkl  Trained model bundle
  data/studentDataset.csv   Training dataset
  notebooks/analysis.ipynb  Model training / analysis notebook
  eduguard.db               Active dataset storage (generated)
```

---

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health message |
| `POST` | `/predict` | Predict one student from JSON |
| `POST` | `/upload-dataset` | Validate a CSV/XLSX, run predictions, save the dataset |
| `GET` | `/active-dataset` | Restore the active dataset and predictions |
| `DELETE` | `/active-dataset` | Clear the active dataset |

---

## Tech stack

- React 18 + Vite 5
- Plain JavaScript (JSX)
- CSS custom properties, no UI framework
- Recharts for charts
- Lucide React for icons
- Flask, pandas, scikit-learn, joblib, SQLite
- Browser `localStorage` for the demo cohort and active-dataset cache

---

## Notes

- Routes are hash-based, so deep links such as `#/student/STU-1001` survive refresh and work on static hosting.
- The Flask backend is the source of truth for an active uploaded dataset; a local cache keeps it visible if the API is temporarily unavailable.
- Demo data is generated with a seeded random function, so a fresh install always shows the same 60 students.
- The build emits a Vite chunk-size advisory because Recharts is large; it does not affect functionality.
