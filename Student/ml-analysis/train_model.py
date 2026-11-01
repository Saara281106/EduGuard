
"""
EduGuard — model training script.

Trains a classifier on ml-analysis/data/studentDataset.csv and saves a
model bundle consumed by app.py:

    {
        "model":           fitted estimator (predict + predict_proba),
        "feature_columns": encoded feature column order,
        "scaler":          fitted scaler or None,
        "uses_scaling":    bool,
        "classes":         class label order,
        "trained_at":      ISO timestamp,
        "rows":            training row count,
        "accuracy":        hold-out accuracy,
    }

Usage:
    python train_model.py [--skip-data]

Without --skip-data the script (re)generates the synthetic training dataset
with generate_data.py first, so a fresh checkout trains end to end.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "studentDataset.csv"
MODEL_PATH = BASE_DIR / "model" / "eduguard_model.pkl"

TARGET_COLUMN = "student_outcome"
TEST_SIZE = 0.2
SEED = 42


def build_features(dataframe):
    """One-hot encode only the model-relevant columns."""
    feature_input_columns = [
        "attendance_percentage",
        "internal_marks_percentage",
        "semester_marks_percentage",
        "backlogs",
        "assignment_completion_percentage",
        "previous_cgpa",
        "fee_status",
        "scholarship",
        "financial_issue",
        "lms_logins_per_month",
        "library_visits_per_month",
        "class_participation",
        "mentor_meetings_per_semester",
    ]

    input_df = dataframe[feature_input_columns].copy()
    encoded = pd.get_dummies(input_df)
    feature_columns = list(encoded.columns)
    target = dataframe[TARGET_COLUMN]
    return encoded, feature_columns, target


def main(skip_data: bool):
    if not skip_data or not DATA_PATH.exists():
        import generate_data

        generate_data.main()

    print(f"Reading training data from {DATA_PATH}")
    dataframe = pd.read_csv(DATA_PATH)

    if TARGET_COLUMN not in dataframe.columns:
        raise SystemExit(f"Training data must contain a {TARGET_COLUMN!r} column")

    if dataframe[TARGET_COLUMN].isnull().any():
        raise SystemExit("Target column contains empty values")

    # Clean text columns so get_dummies sees stable category levels
    for column in dataframe.columns:
        if dataframe[column].dtype == object:
            dataframe[column] = dataframe[column].astype(str).str.strip()

    features, feature_columns, target = build_features(dataframe)

    if features.isnull().any().any():
        raise SystemExit("Feature encoding produced null values")

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=TEST_SIZE,
        random_state=SEED,
        stratify=target,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        random_state=SEED,
        n_jobs=-1,
    )

    print(f"Training RandomForest on {len(x_train)} rows...")
    model.fit(x_train, y_train)

    accuracy = accuracy_score(y_test, model.predict(x_test))
    print(f"Hold-out accuracy: {accuracy:.3f}")

    bundle = {
        "model": model,
        "feature_columns": feature_columns,
        "scaler": None,
        "uses_scaling": False,
        "classes": list(model.classes_),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": len(features),
        "accuracy": round(float(accuracy), 4),
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, MODEL_PATH)
    print(f"Model bundle saved to {MODEL_PATH}")
    print(json.dumps({key: bundle[key] for key in ("uses_scaling", "rows", "accuracy", "classes")}, indent=2))


if __name__ == "__main__":
    main(skip_data="--skip-data" in sys.argv)
