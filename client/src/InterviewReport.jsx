import { useRef, useState } from "react";
import "./InterviewReport.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");

function diagnosisKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return "arenaTutor:" + (user.email || user._id || "guest") + ":diagnosis";
  } catch {
    return "arenaTutor:guest:diagnosis";
  }
}

function loadSavedReport() {
  try {
    return JSON.parse(localStorage.getItem(diagnosisKey()) || "null");
  } catch {
    return null;
  }
}

function InterviewReport({ onNavigate }) {
  const [report, setReport] = useState(loadSavedReport);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const generateReport = async () => {
    if (!API_URL) return setError("The app server is not configured.");
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      if (resume) formData.append("resume", resume);
      const response = await fetch(API_URL + "/api/ai/interview-report", {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not build your interview report.");
      setReport(data.diagnosis);
      localStorage.setItem(diagnosisKey(), JSON.stringify(data.diagnosis));
      setResume(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (requestError) {
      setError(requestError.message || "Could not build your interview report.");
    } finally {
      setLoading(false);
    }
  };

  const evidence = report?.evidenceSummary || {};

  return (
    <main className="interview-report-page">
      <header className="interview-report-hero">
        <div><p className="interview-report-eyebrow">YOUR INTERVIEW PERFORMANCE</p><h1>Interview Report</h1><p>A clear view of what’s strong, what needs work, and what to practise next.</p></div>
        <div className="interview-report-actions">
          <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setResume(event.target.files?.[0] || null)} aria-label="Optional resume for the interview report" />
          <button className="interview-report-resume" type="button" onClick={() => inputRef.current?.click()}>{resume ? "Resume selected ✓" : "Add resume (optional)"}</button>
          <button className="interview-report-generate" type="button" onClick={generateReport} disabled={loading}>{loading ? "Building your report…" : report ? "Refresh report →" : "Build my report →"}</button>
        </div>
      </header>
      <p className="interview-report-privacy">Based on your saved interview answers and scores. Resume text is processed for this report and not saved.</p>
      {error && <p className="interview-report-error" role="alert">{error}</p>}

      {!report ? <section className="interview-report-empty"><span>✦</span><h2>Your interview progress, in one place</h2><p>Generate a report from your saved HR, technical and coding interview attempts. You can optionally include your resume.</p><button type="button" onClick={generateReport} disabled={loading}>{loading ? "Building your report…" : "Generate interview report →"}</button></section> : <>
        <section className="interview-report-overview">
          <div className="interview-report-summary"><p className="interview-report-section-kicker">PERSONALIZED SUMMARY</p><h2>{report.summary || "Your practice report is ready."}</h2><p>Evidence reviewed: <strong>{evidence.interviewsReviewed || 0} interview sessions</strong>{evidence.resumeReviewed ? " and your resume" : ""}.</p></div>
          <div className="interview-report-counts"><div><strong>{evidence.hr || 0}</strong><span>HR</span></div><div><strong>{evidence.technical || 0}</strong><span>Technical</span></div><div><strong>{evidence.coding || 0}</strong><span>Coding</span></div></div>
        </section>

        {!!report.skillScores?.length && <section className="interview-report-panel">
          <div className="interview-report-panel-heading"><div><p className="interview-report-section-kicker">SKILL BREAKDOWN</p><h2>Interview skill snapshot</h2></div><span>Based on demonstrated evidence</span></div>
          <div className="interview-report-skills">{report.skillScores.map((skill, index) => <article className="interview-report-skill" key={skill.skill + index}>
            <div className="interview-report-skill-top"><strong>{skill.skill}</strong><span>{skill.score === null ? "Not enough evidence" : skill.score + "%"}</span></div>
            <div className="interview-report-track"><i style={{ width: (skill.score === null ? 0 : skill.score) + "%" }} /></div>
            <p>{skill.evidence || (skill.score === null ? "Try an interview in this area to get a meaningful score." : "Based on your saved interview answers.")}</p>
          </article>)}</div>
          <p className="interview-report-score-note">Scores are coaching estimates based on your saved interview attempts, not hiring predictions. Resume-only skills are never given interview performance scores.</p>
        </section>}

        <div className="interview-report-columns">
          <section className="interview-report-panel interview-report-strength-panel"><div className="interview-report-panel-heading"><div><p className="interview-report-section-kicker">KEEP BUILDING ON THESE</p><h2>Strong areas</h2></div><span>{report.strengths?.length || 0}</span></div>
            {report.strengths?.length ? <ul className="interview-report-strengths">{report.strengths.map((item, index) => <li key={item.title + index}><i>✓</i><div><strong>{item.title}</strong><p>{item.evidence}</p></div></li>)}</ul> : <p className="interview-report-no-items">Complete a few interviews to establish consistent strengths.</p>}
          </section>
          <section className="interview-report-panel interview-report-focus-panel"><div className="interview-report-panel-heading"><div><p className="interview-report-section-kicker">YOUR PRACTICE PRIORITIES</p><h2>Needs improvement</h2></div><span>{report.focusAreas?.length || 0}</span></div>
            {report.focusAreas?.length ? <div className="interview-report-focus-list">{report.focusAreas.map((item, index) => <article key={item.title + index}><div className="interview-report-focus-top"><strong>{item.title}</strong><span>{item.source || "Practice"} · {item.priority || "Focus"}</span></div><p>{item.evidence}</p><small><b>Learn:</b> {item.lesson}</small><small><b>Practise:</b> {item.practice}</small></article>)}</div> : <p className="interview-report-no-items">No clear gaps yet. More interview attempts will make this report more useful.</p>}
          </section>
        </div>

        <section className="interview-report-next"><span>RECOMMENDED NEXT STEP</span><p>{report.nextStep || "Complete another interview and refresh this report."}</p><button type="button" onClick={() => onNavigate("tutor")}>Learn with AI Tutor →</button></section>
      </>}
    </main>
  );
}

export default InterviewReport;
