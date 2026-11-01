
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib


app = Flask(__name__)
CORS(app)

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024



BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "eduguard_model.pkl"

model_bundle = joblib.load(MODEL_PATH)

model = model_bundle["model"]
feature_columns = model_bundle["feature_columns"]
scaler = model_bundle["scaler"]
uses_scaling = model_bundle["uses_scaling"]




DB_PATH = BASE_DIR / "eduguard.db"


def get_db_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS active_dataset (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                dataset_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                uploaded_at TEXT NOT NULL,
                total_students INTEGER NOT NULL,
                records_json TEXT NOT NULL,
                predictions_json TEXT NOT NULL
            )
            """
        )
        connection.commit()


def save_active_dataset(filename, dataframe, predictions):
    dataset_id = datetime.now(timezone.utc).strftime("dataset-%Y%m%d%H%M%S%f")
    uploaded_at = datetime.now(timezone.utc).isoformat()
    records = json.loads(dataframe.to_json(orient="records"))
    total_students = len(predictions)

    with get_db_connection() as connection:
        connection.execute("DELETE FROM active_dataset")
        connection.execute(
            """
            INSERT INTO active_dataset (
                id, dataset_id, filename, uploaded_at,
                total_students, records_json, predictions_json
            ) VALUES (1, ?, ?, ?, ?, ?, ?)
            """,
            (
                dataset_id,
                filename,
                uploaded_at,
                total_students,
                json.dumps(records),
                json.dumps(predictions),
            ),
        )
        connection.commit()

    return {
        "id": dataset_id,
        "filename": filename,
        "uploadedAt": uploaded_at,
        "totalStudents": total_students,
    }


def load_active_dataset():
    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT dataset_id, filename, uploaded_at, total_students,
                   records_json, predictions_json
            FROM active_dataset
            WHERE id = 1
            """
        ).fetchone()

    if row is None:
        return None

    return {
        "dataset": {
            "id": row["dataset_id"],
            "filename": row["filename"],
            "uploadedAt": row["uploaded_at"],
            "totalStudents": row["total_students"],
        },
        "records": json.loads(row["records_json"]),
        "predictions": json.loads(row["predictions_json"]),
    }


def delete_active_dataset():
    with get_db_connection() as connection:
        connection.execute("DELETE FROM active_dataset")
        connection.commit()


init_db()




required_columns = [
    "student_id",
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
    "mentor_meetings_per_semester"
]

numeric_columns = [
    "attendance_percentage",
    "internal_marks_percentage",
    "semester_marks_percentage",
    "backlogs",
    "assignment_completion_percentage",
    "previous_cgpa",
    "lms_logins_per_month",
    "library_visits_per_month",
    "mentor_meetings_per_semester"
]

percentage_columns = [
    "attendance_percentage",
    "internal_marks_percentage",
    "semester_marks_percentage",
    "assignment_completion_percentage"
]

allowed_values = {
    "fee_status": ["Paid", "Partially Paid", "Unpaid"],
    "scholarship": ["Yes", "No"],
    "financial_issue": ["Yes", "No"],
    "class_participation": ["High", "Medium", "Low"]
}




@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "EduGuard ML API is running!"
    })



@app.route("/predict", methods=["POST"])
def predict():

    try:
        student_data = request.get_json()

        if not isinstance(student_data, dict):
            return jsonify({
                "error": "Invalid student data"
            }), 400

        input_df = pd.DataFrame([student_data])

        input_df = input_df.drop(
            columns=["student_id", "student_outcome"],
            errors="ignore"
        )

        input_encoded = pd.get_dummies(input_df)

        input_encoded = input_encoded.reindex(
            columns=feature_columns,
            fill_value=0
        )

        if uses_scaling:
            input_processed = scaler.transform(input_encoded)
        else:
            input_processed = input_encoded

        prediction = model.predict(input_processed)[0]
        probabilities = model.predict_proba(input_processed)[0]

        confidence = {
            str(label): round(float(prob) * 100, 2)
            for label, prob in zip(model.classes_, probabilities)
        }

        return jsonify({
            "predicted_outcome": str(prediction),
            "dropout_probability": confidence.get("Dropout", 0.0),
            "confidence": confidence
        })

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 400



@app.route("/upload-dataset", methods=["POST"])
def upload_dataset():

    try:

        # Check uploaded file
        if "file" not in request.files:
            return jsonify({
                "error": "No file was uploaded"
            }), 400

        uploaded_file = request.files["file"]

        if uploaded_file.filename == "":
            return jsonify({
                "error": "Please select a file"
            }), 400

        filename = uploaded_file.filename.lower()

        # Read CSV or Excel
        if filename.endswith(".csv"):
            df = pd.read_csv(uploaded_file)

        elif filename.endswith(".xlsx"):
            df = pd.read_excel(
                uploaded_file,
                engine="openpyxl"
            )

        else:
            return jsonify({
                "error": "Only CSV and XLSX files are supported"
            }), 400

        # Check empty dataset
        if df.empty:
            return jsonify({
                "error": "Uploaded dataset is empty"
            }), 400

       

        missing_columns = [
            col for col in required_columns
            if col not in df.columns
        ]

        if missing_columns:
            return jsonify({
                "error": "Missing required columns",
                "missing_columns": missing_columns
            }), 400

        # Check missing values
        if df[required_columns].isnull().any().any():
            return jsonify({
                "error": "Dataset contains empty values"
            }), 400

        # Check blank student IDs
        if df["student_id"].astype(str).str.strip().eq("").any():
            return jsonify({
                "error": "Student IDs cannot be blank"
            }), 400

        # Check duplicate IDs
        if df["student_id"].duplicated().any():
            return jsonify({
                "error": "Duplicate student IDs found"
            }), 400

        # Convert numeric columns
        for col in numeric_columns:
            df[col] = pd.to_numeric(
                df[col],
                errors="coerce"
            )

        # Check invalid numeric values
        if df[numeric_columns].isnull().any().any():
            return jsonify({
                "error": "Invalid numeric values found"
            }), 400

        # Check percentage ranges
        for col in percentage_columns:
            if not df[col].between(0, 100).all():
                return jsonify({
                    "error": f"{col} must be between 0 and 100"
                }), 400

        # Check CGPA
        if not df["previous_cgpa"].between(0, 10).all():
            return jsonify({
                "error": "Previous CGPA must be between 0 and 10"
            }), 400

        # Check non-negative values
        count_columns = [
            "backlogs",
            "lms_logins_per_month",
            "library_visits_per_month",
            "mentor_meetings_per_semester"
        ]

        for col in count_columns:
            if (df[col] < 0).any():
                return jsonify({
                    "error": f"{col} cannot be negative"
                }), 400

        # Check categorical values
        for col, allowed in allowed_values.items():

            if not df[col].isin(allowed).all():
                return jsonify({
                    "error": f"Invalid values in {col}",
                    "allowed_values": allowed
                }), 400

        

        # Preserve student IDs
        student_ids = df["student_id"].astype(str).tolist()

        # Remove ID and actual outcome from model inputs
        input_df = df.drop(
            columns=["student_id", "student_outcome"],
            errors="ignore"
        )

        # Encode categorical data
        input_encoded = pd.get_dummies(input_df)

        # Match training features exactly
        input_encoded = input_encoded.reindex(
            columns=feature_columns,
            fill_value=0
        )


        if uses_scaling:
            input_processed = scaler.transform(input_encoded)
        else:
            input_processed = input_encoded

        # IMPORTANT: Generate both predictions and probabilities
        predictions = model.predict(input_processed)

        probabilities = model.predict_proba(input_processed)

        
  

        results = []

        for student_id, prediction, probability in zip(
            student_ids,
            predictions,
            probabilities
        ):

            confidence = {
                str(label): round(float(prob) * 100, 2)
                for label, prob in zip(
                    model.classes_,
                    probability
                )
            }

            dropout_probability = confidence.get(
                "Dropout",
                0.0
            )

            results.append({
                "student_id": student_id,
                "predicted_outcome": str(prediction),
                "dropout_probability": dropout_probability,
                "confidence": confidence
            })

        

        records = json.loads(df.to_json(orient="records"))
        dataset = save_active_dataset(uploaded_file.filename, df, results)

        return jsonify({
            "message": "ML predictions generated successfully!",
            "total_students": len(results),
            "dataset": dataset,
            "records": records,
            "predictions": results
        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 400




@app.route("/active-dataset", methods=["GET"])
def get_active_dataset():
    try:
        active = load_active_dataset()

        if active is None:
            return jsonify({
                "active": False,
                "message": "No active dataset has been uploaded yet."
            })

        return jsonify({
            "active": True,
            **active
        })

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


@app.route("/active-dataset", methods=["DELETE"])
def clear_active_dataset():
    try:
        delete_active_dataset()
        return jsonify({
            "message": "Active dataset cleared."
        })

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500




if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )
