
"""
EduGuard — synthetic dataset generator.

Creates two files:

1. ml-analysis/data/studentDataset.csv
   The full training dataset (with the student_outcome target column)
   used by train_model.py.

2. public/studentDataset.csv
   A smaller, ready-to-upload sample for the front end
   (no student_outcome column, includes descriptive columns).

Both files are generated with a seeded random generator so the output is
reproducible across machines.

Usage:
    python generate_data.py
"""

import csv
from pathlib import Path

import numpy as np


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "studentDataset.csv"
PUBLIC_PATH = BASE_DIR.parent / "public" / "studentDataset.csv"

TRAIN_ROWS = 1500
SAMPLE_ROWS = 100

SEED = 42

NAMES = [
    "Aarav Sharma", "Diya Patel", "Rohan Mehta", "Ananya Iyer", "Kabir Singh",
    "Ishita Rao", "Vivaan Joshi", "Meera Nair", "Arjun Reddy", "Sara Khan",
    "Aditya Verma", "Nisha Pillai", "Karan Malhotra", "Tara Bose", "Nikhil Das",
    "Pooja Gupta", "Sameer Ali", "Riya Chopra", "Devansh Kulkarni", "Anjali Menon",
    "Yash Agarwal", "Kavya Suresh", "Manav Desai", "Preeti Yadav", "Aryan Bhatt",
    "Sneha Joshi", "Rahul Mishra", "Lakshmi Raman", "Farhan Sheikh", "Neha Saxena",
    "Aditi Kale", "Harsh Vora", "Simran Kaur", "Gaurav Sen", "Ashna Wilson",
    "Mohan Pillai", "Tanya Srivastava", "Rehan Qureshi", "Bhavna Trivedi", "Sushant Ghosh",
]

INSTITUTIONS = {
    "College": ["Govt Arts College", "City Engineering College", "Nehru Degree College"],
    "School": ["St. Marys High School", "Govt Higher Secondary School", "Sunrise Public School"],
}

INSTITUTION_TYPES = ["College", "School"]
SECTIONS = ["A", "B", "C", "D"]
DEPARTMENTS = ["Science", "Commerce", "Arts"]
HOSTEL_STATUS = ["Hostel", "Day Scholar"]

POSITIVE_REMARKS = [
    "Consistent performer, very attentive in class.",
    "Shows steady improvement this semester.",
    "Well organised with assignments and submissions.",
]
NEUTRAL_REMARKS = [
    "Average performance, room for improvement.",
    "Regular student, participates occasionally.",
    "Attendance is meeting the minimum requirement.",
]
NEGATIVE_REMARKS = [
    "Frequently absent and falling behind.",
    "Struggling with coursework, needs support.",
    "Disengaged in class, at risk of failing.",
    "Pending dues and irregular attendance.",
]
NEGATIVE_NOTE_PHRASES = [
    "financial stress at home",
    "personal difficulties affecting studies",
    "family situation is unstable",
    "demotivated and low on confidence",
]


def generate_students(n_rows: int, rng: np.random.Generator, with_target: bool):
    """Generate n_rows synthetic student records."""
    rows = []

    n_names = len(NAMES)
    offset = 0 if with_target else 600

    for i in range(n_rows):
        student_id = f"STU-{offset + i + 1:04d}"
        name = NAMES[i % n_names]
        if i >= n_names and i % n_names == (n_names - 1):
            # Avoid duplicate full names in one file by suffixing
            name = f"{name} (Jr)"

        # Latent ability drives every correlated indicator
        ability = rng.normal(0, 1.0)

        attendance = float(np.clip(rng.normal(78 + 11 * ability, 12), 15, 100))
        internal_marks = float(np.clip(rng.normal(62 + 12 * ability, 14), 5, 100))
        semester_marks = float(np.clip(rng.normal(58 + 13 * ability, 15), 5, 100))
        assignments = float(np.clip(rng.normal(70 + 14 * ability, 18), 10, 100))
        cgpa = float(np.clip(rng.normal(6.8 + 1.0 * ability, 1.1), 0, 10))

        backlog_base = 2.6 - 1.3 * ability
        backlogs = int(np.clip(rng.poisson(max(backlog_base, 0.05)), 0, 8))

        # Engagement markers
        lms_logins = int(np.clip(rng.normal(14 + 6 * ability, 6), 0, 60))
        library_visits = int(np.clip(rng.normal(6 + 3.2 * ability, 4), 0, 30))

        # Financial background
        fee_status = rng.choice(
            ["Paid", "Partially Paid", "Unpaid"],
            p=[0.72, 0.17, 0.11],
        )
        scholarship = rng.choice(["Yes", "No"], p=[0.3, 0.7])
        financial_issue = rng.choice(["Yes", "No"], p=[0.2, 0.8])

        class_participation = str(rng.choice(["High", "Medium", "Low"], p=[0.35, 0.45, 0.20]))
        if class_participation == "Low" and ability > 1.0:
            class_participation = "Medium"
        elif class_participation == "High" and ability < -1.0:
            class_participation = "Medium"

        mentor_meetings = int(np.clip(rng.poisson(max(3.0, 2.2 + ability)), 0, 12))

        institution_type = INSTITUTION_TYPES[int(rng.random() < 0.55)]  # College 55%
        institution_name = INSTITUTIONS[institution_type][
            int(rng.integers(len(INSTITUTIONS[institution_type])))
        ]

        if institution_type == "College":
            department = DEPARTMENTS[int(rng.integers(len(DEPARTMENTS)))]
            class_name = department
            semester = int(rng.integers(1, 7))
        else:
            department = ""
            class_name = f"Grade {int(rng.integers(9, 13))}"
            semester = ""

        hostel_status = HOSTEL_STATUS[int(rng.random() < 0.25)]

        # Free-text fields (rule-based demo engine reads these)
        remark_roll = rng.random()
        if remark_roll < 0.25:
            remark = NEGATIVE_REMARKS[int(rng.integers(len(NEGATIVE_REMARKS)))]
        elif remark_roll < 0.55:
            remark = NEUTRAL_REMARKS[int(rng.integers(len(NEUTRAL_REMARKS)))]
        else:
            remark = POSITIVE_REMARKS[int(rng.integers(len(POSITIVE_REMARKS)))]

        note = ""
        if rng.random() < 0.3:
            phrase = NEGATIVE_NOTE_PHRASES[int(rng.integers(len(NEGATIVE_NOTE_PHRASES)))]
            note = f"Student reports {phrase}."

        rows.append({
            "student_id": student_id,
            "student_name": name,
            "institution_type": institution_type,
            "institution_name": institution_name,
            "class_name": class_name,
            "section": SECTIONS[int(rng.integers(len(SECTIONS)))],
            "department": department,
            "semester": semester,
            "attendance_percentage": round(attendance, 2),
            "internal_marks_percentage": round(internal_marks, 2),
            "semester_marks_percentage": round(semester_marks, 2),
            "backlogs": backlogs,
            "assignment_completion_percentage": round(assignments, 2),
            "previous_cgpa": round(cgpa, 2),
            "fee_status": str(fee_status),
            "scholarship": str(scholarship),
            "financial_issue": str(financial_issue),
            "lms_logins_per_month": lms_logins,
            "library_visits_per_month": library_visits,
            "class_participation": str(class_participation),
            "mentor_meetings_per_semester": mentor_meetings,
            "hostel_status": hostel_status,
            "teacher_remarks": remark,
            "mentor_notes": note,
            # hidden latent score kept locally for labelling
            "_ability": ability,
            "_row": len(rows),
        })

    if not with_target:
        return rows

    # ---- Assign a consistent target outcome -------------------------------
    # Rank students by a dropout risk score, then label:
    #   top chunk  -> Dropout
    #   best performers of the rest -> Graduate
    #   remainder  -> Enrolled
    dropout_scores = np.array([
        (
            2.0
            - 0.055 * row["attendance_percentage"]
            - 0.035 * row["semester_marks_percentage"]
            + 0.45 * row["backlogs"]
            - 0.02 * row["lms_logins_per_month"]
            - 0.03 * row["library_visits_per_month"]
            - 0.02 * row["assignment_completion_percentage"]
            + (0.9 if row["fee_status"] == "Unpaid" else 0.0)
            + (0.4 if row["fee_status"] == "Partially Paid" else 0.0)
            + (0.6 if row["financial_issue"] == "Yes" else 0.0)
            + (0.5 if row["class_participation"] == "Low" else 0.0)
            - (0.4 if row["class_participation"] == "High" else 0.0)
            - 0.15 * row["mentor_meetings_per_semester"]
            - 0.35 * row["_ability"]
            + rng.normal(0, 0.35)
        )
        for row in rows
    ])

    order = np.argsort(dropout_scores)
    n = len(rows)
    n_dropout = int(n * 0.28)
    dropout_indexes = set(order[n - n_dropout:].tolist())

    performance_scores = np.array([
        (
            0.05 * row["attendance_percentage"]
            + 0.05 * row["semester_marks_percentage"]
            + 0.30 * row["previous_cgpa"]
            - 0.5 * row["backlogs"]
            + (0.4 if row["class_participation"] == "High" else 0.0)
            + rng.normal(0, 0.25)
        )
        for row in rows
    ])

    remaining = [i for i in order[: n - n_dropout]]
    remaining_performance = performance_scores[order[: n - n_dropout]]
    graduate_cutoff = np.quantile(remaining_performance, 0.62)
    graduate_indexes = {
        i for i in remaining if performance_scores[i] >= graduate_cutoff
    }

    for index, row in enumerate(rows):
        row.pop("_ability")
        if index in dropout_indexes:
            row["student_outcome"] = "Dropout"
        elif index in graduate_indexes:
            row["student_outcome"] = "Graduate"
        else:
            row["student_outcome"] = "Enrolled"

    return rows


def write_csv(path: Path, rows, outcome_last: bool):
    path.parent.mkdir(parents=True, exist_ok=True)

    columns = list(rows[0].keys())
    if "student_outcome" in columns:
        columns = [c for c in columns if c != "student_outcome"]
        columns.append("student_outcome")

    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def main():
    rng = np.random.default_rng(SEED)

    training_rows = generate_students(TRAIN_ROWS, rng, with_target=True)
    write_csv(DATA_PATH, training_rows, outcome_last=True)
    print(f"Training dataset written to {DATA_PATH} ({TRAIN_ROWS} rows)")

    sample_rows = generate_students(SAMPLE_ROWS, rng, with_target=False)
    write_csv(PUBLIC_PATH, sample_rows, outcome_last=False)
    print(f"Sample upload file written to {PUBLIC_PATH} ({SAMPLE_ROWS} rows)")

    outcomes = {}
    for row in training_rows:
        outcomes[row["student_outcome"]] = outcomes.get(row["student_outcome"], 0) + 1
    print("Outcome distribution:", outcomes)


if __name__ == "__main__":
    main()
