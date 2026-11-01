import { useState } from "react";
import "./DatasetUpload.css";
import { useApp } from "../context/AppContext.jsx";
import { uploadDatasetFile } from "../lib/api.js";
import { formatDate } from "../lib/format.js";
import { formatProbability, predictionConfidence } from "../lib/dataset.js";

function DatasetUpload() {
  const { students, activeDataset, datasetLoading, applyDataset } = useApp();
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const predictions = activeDataset ? students : [];

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    setMessage("");

    if (!file) {
      setSelectedFile(null);
      setStatus("idle");
      return;
    }

    const validExtensions = [".csv", ".xlsx"];
    const fileName = file.name.toLowerCase();

    const isValid = validExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isValid) {
      setSelectedFile(null);
      setStatus("invalid");
      event.target.value = "";
      setMessage("Please select a valid CSV or Excel (.xlsx) file.");
      return;
    }

    setSelectedFile(file);
    setStatus("ready");
    setMessage(`${file.name} is ready to upload.`);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setMessage("Uploading your dataset...");

    try {
      const data = await uploadDatasetFile(selectedFile);

      applyDataset(data);

      setStatus("success");
      setMessage(data.message || "ML predictions generated successfully!");
    } catch (error) {
      setStatus("error");
      setMessage(
        error.message || "Could not connect to the Flask backend."
      );

      console.error("Upload error:", error);
    }
  };

  return (
    <div className="dataset-upload">
      <h2>Upload Student Dataset</h2>

      <p>
        Select a CSV or Excel file containing student records.
      </p>

      {activeDataset && (
        <p className="upload-status success">
          Active dataset: <strong>{activeDataset.filename}</strong> ·{" "}
          {activeDataset.totalStudents ?? predictions.length} students ·{" "}
          uploaded {formatDate(activeDataset.uploadedAt)}
        </p>
      )}

      {datasetLoading && !activeDataset && (
        <p className="upload-status">Restoring the active dataset...</p>
      )}

      <div className="upload-controls">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          disabled={status === "uploading"}
        />

        <button
          disabled={!selectedFile || status === "uploading"}
          onClick={handleUpload}
        >
          {status === "uploading"
            ? "Uploading..."
            : "Upload Dataset"}
        </button>
      </div>

      {status === "idle" && !activeDataset && (
        <p className="upload-status">
          Please select a dataset to continue.
        </p>
      )}

      {status === "ready" && (
        <p className="upload-status">{message}</p>
      )}

      {status === "invalid" && (
        <p className="upload-status error">{message}</p>
      )}

      {status === "uploading" && (
        <p className="upload-status">{message}</p>
      )}

      {status === "success" && (
        <p className="upload-status success">
          ✓ {message}
        </p>
      )}

      {status === "error" && (
        <p className="upload-status error">
          ✕ {message}
        </p>
      )}

      {predictions.length > 0 && (
        <section className="prediction-results">
          <div className="prediction-header">
            <h3>Student Prediction Results</h3>

            <p>
              Predictions received for{" "}
              <strong>{predictions.length}</strong> students.
            </p>
          </div>

          <div className="prediction-table-container">
            <table className="prediction-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Predicted Outcome</th>
                  <th>Dropout Probability</th>
                  <th>Confidence</th>
                </tr>
              </thead>

              <tbody>
                {predictions.map((student, index) => (
                  <tr key={student.id ?? index}>
                    <td>{student.id ?? "—"}</td>

                    <td>
                      <span
                        className={`outcome-badge ${
                          String(
                            student.predicted_outcome
                          ).toLowerCase() === "dropout"
                            ? "outcome-dropout"
                            : String(
                                student.predicted_outcome
                              ).toLowerCase() === "graduate"
                            ? "outcome-graduate"
                            : "outcome-other"
                        }`}
                      >
                        {student.predicted_outcome ?? "—"}
                      </span>
                    </td>

                    <td>
                      {formatProbability(student.dropout_probability)}
                    </td>

                    <td>
                      {formatProbability(predictionConfidence(student))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default DatasetUpload;
