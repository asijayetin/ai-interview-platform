import { useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

function ResumeReview() {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setReview(null);
    setError("");

    if (selected && selected.size > 5 * 1024 * 1024) {
      setFile(null);
      event.target.value = "";
      setError("The file is larger than 5 MB. Please choose a smaller resume.");
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setReview(null);

    if (!file) return setError("Choose a PDF or DOCX resume first.");
    if (!targetRole.trim()) return setError("Enter the role you are targeting.");

    const token = localStorage.getItem("token");
    if (!token) return setError("Your session expired. Please sign in again.");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("targetRole", targetRole.trim());

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/resume-review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not review this resume. Please try again.");
      setReview(data.review);
    } catch (requestError) {
      setError(requestError.message || "Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="resume-review-page">
      <section className="resume-review-panel">
        <p className="small-heading">CAREER TOOL</p>
        <h1>Resume Reviewer</h1>
        <p className="resume-review-intro">Get role-specific feedback on your resume, including strengths, skill gaps, and clear ways to improve it.</p>

        <form className="resume-review-form" onSubmit={handleSubmit}>
          <label htmlFor="resume-role">Target role</label>
          <input
            id="resume-role"
            type="text"
            maxLength={100}
            placeholder="e.g. Full Stack Developer"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
          />

          <label htmlFor="resume-file">Resume file</label>
          <input id="resume-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
          <p className="resume-file-hint">PDF or DOCX, up to 5 MB. Scanned image-only PDFs are not supported yet.</p>

          {file && <p className="resume-selected-file">Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>}
          {error && <p className="resume-review-error" role="alert">{error}</p>}

          <button className="primary-btn resume-submit-button" type="submit" disabled={loading}>
            {loading ? "Reviewing resume…" : "Review my resume →"}
          </button>
        </form>

        <p className="resume-privacy-note">Privacy: your resume is processed for this review and is not saved in the app. Its text is sent to the Azure AI Foundry service configured by this project.</p>
      </section>

      {review && (
        <section className="resume-results" aria-live="polite">
          <div className="resume-score-card">
            <div className="resume-score-ring"><strong>{review.matchScore}</strong><span>/ 100</span></div>
            <div><p className="small-heading">ROLE MATCH</p><h2>{targetRole.trim()}</h2><p>{review.summary}</p></div>
          </div>

          <div className="resume-result-grid">
            <article className="resume-result-card">
              <h3>What’s working</h3>
              {review.strengths?.length ? <ul>{review.strengths.map((item, index) => <li key={`${item.title}-${index}`}><strong>{item.title}</strong><span>{item.detail}</span></li>)}</ul> : <p>No strengths were returned.</p>}
            </article>
            <article className="resume-result-card">
              <h3>Skills to build or show</h3>
              {review.missingSkills?.length ? <ul>{review.missingSkills.map((item, index) => <li key={`${item.skill}-${index}`}><strong>{item.skill} <small>{item.priority}</small></strong><span>{item.reason}</span></li>)}</ul> : <p>No skill gaps were identified.</p>}
            </article>
          </div>

          <article className="resume-result-card resume-wide-card">
            <h3>Specific improvements</h3>
            {review.improvements?.length ? <ul>{review.improvements.map((item, index) => <li key={`${item.section}-${index}`}><strong>{item.section}: {item.issue}</strong><span>{item.suggestion}</span></li>)}</ul> : <p>No improvement suggestions were returned.</p>}
          </article>

          {!!review.rewrites?.length && <article className="resume-result-card resume-wide-card">
            <h3>Example bullet rewrites</h3>
            <div className="resume-rewrites">{review.rewrites.map((item, index) => <div key={index}><p><strong>Your current wording</strong><span>{item.before}</span></p><p><strong>Try this, if accurate</strong><span>{item.after}</span></p></div>)}</div>
          </article>}

          {!!review.keywords?.length && <article className="resume-result-card resume-wide-card">
            <h3>Relevant keywords to consider</h3><div className="resume-keywords">{review.keywords.map((word) => <span key={word}>{word}</span>)}</div>
          </article>}
          <p className="resume-privacy-note">Use suggestions that accurately reflect your experience. The review is guidance, not a hiring decision.</p>
        </section>
      )}
    </main>
  );
}

export default ResumeReview;
