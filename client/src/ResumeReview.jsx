import { useRef, useState } from "react";
import "./ResumeReview.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ROLE_SUGGESTIONS = ["Software Engineer", "Frontend Developer", "Java Developer", "Data Analyst"];

const validateFile = (selected) => {
  if (!selected) return "";
  if (selected.size > MAX_FILE_SIZE) return "This file is larger than 5 MB. Choose a smaller resume.";
  if (!/\.(pdf|docx)$/i.test(selected.name)) return "Choose a PDF or DOCX resume.";
  return "";
};

function ResumeReview() {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Early career");
  const [jobDescription, setJobDescription] = useState("");
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(-1);
  const fileInputRef = useRef(null);
  const reportRef = useRef(null);

  const selectResumeFile = (selected) => {
    const fileError = validateFile(selected);
    setReview(null);
    setError(fileError);
    setFile(fileError ? null : selected);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    formData.append("experienceLevel", experienceLevel);
    formData.append("jobDescription", jobDescription.trim());

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
      requestAnimationFrame(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (requestError) {
      setError(requestError.message || "Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyRewrite = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRewrite(index);
      window.setTimeout(() => setCopiedRewrite(-1), 1500);
    } catch {
      setError("Clipboard access is unavailable in this browser. You can select and copy the rewrite manually.");
    }
  };

  const score = Math.max(0, Math.min(100, Number(review?.matchScore) || 0));
  const scoreLabel = score >= 80 ? "Strong alignment" : score >= 60 ? "Good foundation" : score >= 40 ? "Room to improve" : "Early match";

  return (
    <main className="resume-review-page">
      <header className="resume-review-hero">
        <div className="resume-review-hero-copy">
          <p className="resume-eyebrow"><span>✦</span> CAREER TOOLKIT</p>
          <h1>Make your resume<br /><em>work harder for you.</em></h1>
          <p>Get focused feedback for the role you want: what already stands out, what is missing, and how to make your experience clearer.</p>
          <div className="resume-review-benefits"><span><i>✓</i> Evidence-based feedback</span><span><i>✓</i> Role-specific keywords</span><span><i>✓</i> Practical bullet rewrites</span></div>
        </div>
        <div className="resume-review-hero-art" aria-hidden="true">
          <div className="resume-art-orbit resume-art-orbit-one" /><div className="resume-art-orbit resume-art-orbit-two" />
          <div className="resume-art-document"><span className="resume-art-check">✓</span><i /><i /><i /><i /><b>ROLE MATCH</b><strong>+ clarity</strong></div>
          <span className="resume-art-chip resume-art-chip-one">Skills</span><span className="resume-art-chip resume-art-chip-two">Impact</span>
        </div>
      </header>

      <section className="resume-review-workflow">
        <form className="resume-review-panel" onSubmit={handleSubmit}>
          <div className="resume-form-header"><span className="resume-form-step">01</span><div><h2>Set your target</h2><p>Give the reviewer a little context for useful feedback.</p></div></div>

          <div className="resume-form-fields">
            <label className="resume-field resume-role-field" htmlFor="resume-role">Target role <span>Required</span>
              <input id="resume-role" type="text" maxLength={100} placeholder="e.g. Junior Java Developer" value={targetRole} onChange={(event) => { setTargetRole(event.target.value); setReview(null); }} />
            </label>
            <label className="resume-field" htmlFor="resume-level">Experience level
              <select id="resume-level" value={experienceLevel} onChange={(event) => { setExperienceLevel(event.target.value); setReview(null); }}><option>Early career</option><option>Mid-level</option><option>Senior</option><option>Career change</option></select>
            </label>
          </div>
          <div className="resume-role-suggestions"><span>Popular roles</span>{ROLE_SUGGESTIONS.map((role) => <button type="button" key={role} onClick={() => { setTargetRole(role); setReview(null); }}>{role}</button>)}</div>

          <label className="resume-field resume-job-description" htmlFor="resume-job-description">Job description <small>Optional · improves role matching</small>
            <textarea id="resume-job-description" value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setReview(null); }} placeholder="Paste the job description to compare your resume against its requirements…" maxLength={5000} rows="4" />
            <span className="resume-character-count">{jobDescription.length}/5000</span>
          </label>

          <div className="resume-upload-heading"><div><strong>Upload your resume</strong><span>PDF or DOCX · up to 5 MB</span></div><span className="resume-private-chip">▣ Processed privately</span></div>
          <label className={`resume-dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`} htmlFor="resume-file"
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); selectResumeFile(event.dataTransfer.files?.[0] || null); }}>
            <input ref={fileInputRef} id="resume-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => selectResumeFile(event.target.files?.[0] || null)} />
            <span className="resume-upload-icon">{file ? "✓" : "↑"}</span>
            <span className="resume-upload-copy"><strong>{file ? file.name : "Drop your resume here, or browse"}</strong><small>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · ready to review` : "Text-based PDF and DOCX files are supported"}</small></span>
            {!file && <span className="resume-browse-button">Browse files</span>}
            {file && <button type="button" className="resume-remove-file" aria-label="Remove selected resume" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setFile(null); setReview(null); }}>×</button>}
          </label>
          <p className="resume-file-note">Scanned image-only PDFs are not supported yet. Export them as a text PDF or DOCX first.</p>
          {error && <p className="resume-review-error" role="alert">{error}</p>}
          <button className="resume-submit-button" type="submit" disabled={loading}>
            <span>{loading ? "Reviewing your resume…" : "Get my resume review"}</span><b>{loading ? "◌" : "→"}</b>
          </button>
          {loading && <div className="resume-loading-note"><span /> Checking role fit, evidence, skills, and wording…</div>}
          <p className="resume-privacy-note"><span>▣</span> Your resume is processed for this review and is not stored by the app. Its extracted text is sent to the project’s configured AI service.</p>
        </form>

        <aside className="resume-review-side-note">
          <p className="resume-side-kicker">YOUR REVIEW INCLUDES</p>
          <div className="resume-review-step"><span className="resume-step-icon">◎</span><div><strong>Role match</strong><small>A directional score for the target role</small></div></div>
          <div className="resume-review-step"><span className="resume-step-icon">✦</span><div><strong>Strengths & skill gaps</strong><small>What is evidenced and what to show more clearly</small></div></div>
          <div className="resume-review-step"><span className="resume-step-icon">↗</span><div><strong>Actionable rewrites</strong><small>Examples you can adapt truthfully</small></div></div>
          <div className="resume-side-divider" />
          <p className="resume-side-footnote">The match score is coaching guidance, not an ATS guarantee or hiring decision. Keep only suggestions that reflect your real experience.</p>
        </aside>
      </section>

      {review && <section className="resume-results" aria-live="polite" ref={reportRef}>
        <div className="resume-report-heading"><div><p className="resume-eyebrow"><span>✦</span> YOUR RESUME REPORT</p><h2>Here’s how it lines up.</h2><p>Feedback for <strong>{targetRole.trim()}</strong>{experienceLevel ? ` · ${experienceLevel}` : ""}</p></div><span className="resume-report-ready"><i /> Review complete</span></div>

        <div className="resume-score-card">
          <div className="resume-score-ring" style={{ "--resume-score": `${score}%` }}><div><strong>{score}</strong><span>/ 100</span></div></div>
          <div className="resume-score-copy"><p className="resume-score-label">ROLE MATCH · {scoreLabel.toUpperCase()}</p><h3>{scoreLabel}</h3><p>{review.summary}</p></div>
          <div className="resume-report-counts"><div><strong>{review.strengths?.length || 0}</strong><span>Strengths</span></div><div><strong>{review.missingSkills?.length || 0}</strong><span>Skill gaps</span></div><div><strong>{review.improvements?.length || 0}</strong><span>Actions</span></div></div>
        </div>

        <div className="resume-result-grid">
          <article className="resume-result-card">
            <div className="resume-result-heading"><span className="resume-result-icon is-green">✓</span><div><h3>What’s working</h3><small>Strengths backed by your resume</small></div><span className="resume-result-count">{review.strengths?.length || 0}</span></div>
            {review.strengths?.length ? <ul>{review.strengths.map((item, index) => <li key={`${item.title}-${index}`}><strong>{item.title}</strong><span>{item.detail}</span></li>)}</ul> : <p>No strengths were returned.</p>}
          </article>
          <article className="resume-result-card">
            <div className="resume-result-heading"><span className="resume-result-icon is-amber">⌕</span><div><h3>Skills to build or show</h3><small>Make relevant evidence easier to find</small></div><span className="resume-result-count">{review.missingSkills?.length || 0}</span></div>
            {review.missingSkills?.length ? <ul>{review.missingSkills.map((item, index) => <li key={`${item.skill}-${index}`}><strong>{item.skill} <small className={`resume-priority is-${String(item.priority || "medium").toLowerCase()}`}>{item.priority}</small></strong><span>{item.reason}</span></li>)}</ul> : <p>No skill gaps were identified.</p>}
          </article>
        </div>

        <article className="resume-result-card resume-wide-card">
          <div className="resume-result-heading"><span className="resume-result-icon is-purple">↗</span><div><h3>Make these improvements</h3><small>Specific edits to strengthen your application</small></div><span className="resume-result-count">{review.improvements?.length || 0}</span></div>
          {review.improvements?.length ? <ul>{review.improvements.map((item, index) => <li key={`${item.section}-${index}`}><strong>{item.section}: {item.issue}</strong><span>{item.suggestion}</span></li>)}</ul> : <p>No improvement suggestions were returned.</p>}
        </article>

        {!!review.rewrites?.length && <article className="resume-result-card resume-wide-card">
          <div className="resume-result-heading"><span className="resume-result-icon is-blue">✎</span><div><h3>Example bullet rewrites</h3><small>Use only if the wording accurately reflects your work</small></div></div>
          <div className="resume-rewrites">{review.rewrites.map((item, index) => <div className="resume-rewrite-pair" key={index}><div className="resume-rewrite-before"><strong>Current wording</strong><p>{item.before}</p></div><div className="resume-rewrite-after"><strong>Stronger example</strong><p>{item.after}</p><button type="button" onClick={() => copyRewrite(item.after, index)}>{copiedRewrite === index ? "Copied ✓" : "Copy example"}</button></div></div>)}</div>
        </article>}

        {!!review.keywords?.length && <article className="resume-result-card resume-wide-card">
          <div className="resume-result-heading"><span className="resume-result-icon is-blue">#</span><div><h3>Relevant keywords</h3><small>Consider adding them when they match your actual experience</small></div></div>
          <div className="resume-keywords">{review.keywords.map((word) => <span key={word}>{word}</span>)}</div>
        </article>}
        <p className="resume-report-disclaimer">Use suggestions that truthfully represent your experience. This report is guidance, not a hiring decision or guarantee.</p>
      </section>}
    </main>
  );
}

export default ResumeReview;
