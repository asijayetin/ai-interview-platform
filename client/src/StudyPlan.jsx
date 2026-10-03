import { useEffect, useState } from "react";
import "./StudyPlan.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");
const QR_IMAGE_URL = import.meta.env.VITE_UPI_QR_IMAGE_URL || "/study-plan-upi-qr.png";

function StudyPlan({ onNavigate }) {
  const [utr, setUtr] = useState("");
  const [request, setRequest] = useState(null);
  const [access, setAccess] = useState({ isActive: false, accessUntil: null, isPaymentAdmin: false });
  const [adminRequests, setAdminRequests] = useState([]);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showActivePlan, setShowActivePlan] = useState(false);

  const accountKey = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").email || "guest"; }
    catch { return "guest"; }
  })();
  let savedDiagnosis = null;
  try { savedDiagnosis = JSON.parse(localStorage.getItem(`arenaTutor:${accountKey}:diagnosis`) || "null"); }
  catch { savedDiagnosis = null; }
  const weakAreas = (savedDiagnosis?.focusAreas || []).slice(0, 4);
  const weeklyPlan = [
    { day: "Day 1", title: weakAreas[0]?.title || "Prepare your introduction", detail: weakAreas[0]?.practice || "Practise a clear 60-second introduction for your target role.", action: weakAreas[0]?.source === "Resume" ? "resume-review" : "interview-report", label: weakAreas[0]?.source === "Resume" ? "Review resume" : "View report" },
    { day: "Day 2", title: weakAreas[1]?.title || "Arrays and strings", detail: weakAreas[1]?.practice || "Solve one array problem and explain the approach out loud.", action: "practice", label: "Open coding practice" },
    { day: "Day 3", title: weakAreas[2]?.title || "Technical fundamentals", detail: weakAreas[2]?.practice || "Review one core concept for your target role and explain it in your own words.", action: "tutor", label: "Ask AI Tutor" },
    { day: "Day 4", title: "Behavioural answer practice", detail: "Use Situation, Task, Action, Result to structure one real experience.", action: "interview", label: "Start interview" },
    { day: "Day 5", title: weakAreas[3]?.title || "Problem-solving practice", detail: weakAreas[3]?.practice || "Practise one problem and state its time and space complexity.", action: "practice", label: "Open coding practice" },
    { day: "Day 6", title: "Technical mock round", detail: "Answer a short technical round, then review the feedback before moving on.", action: "interview-report", label: "Review interview report" },
    { day: "Day 7", title: "Review and reset", detail: "Revisit the hardest task this week and choose a focus for next week.", action: "tutor", label: "Plan next steps" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_URL}/api/payments/manual-request/latest`, { headers }),
      fetch(`${API_URL}/api/payments/subscription`, { headers }),
    ])
      .then(async ([requestResponse, accessResponse]) => {
        const [requestData, accessData] = await Promise.all([requestResponse.json(), accessResponse.json()]);
        if (requestResponse.ok) setRequest(requestData.request || null);
        if (accessResponse.ok) setAccess(accessData);
        if (accessResponse.ok && accessData.isPaymentAdmin) {
          const adminResponse = await fetch(`${API_URL}/api/payments/admin/requests`, { headers });
          const adminData = await adminResponse.json();
          if (adminResponse.ok) setAdminRequests(adminData.requests || []);
        }
      })
      .catch(() => {});
  }, []);

  const reviewRequest = async (requestId, decision) => {
    setError("");
    setMessage("");
    setReviewingId(requestId);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/payments/admin/requests/${requestId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not review this request.");
      setMessage(data.message);
      setAdminRequests((current) => current.filter((item) => item._id !== requestId));
      if (decision === "approve") {
        const latest = await fetch(`${API_URL}/api/payments/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const latestData = await latest.json();
        if (latest.ok) setAccess(latestData);
      }
    } catch (reviewError) {
      setError(reviewError.message || "Could not review this request.");
    } finally {
      setReviewingId("");
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again before submitting a payment request.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/payments/manual-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ utr }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not submit your payment request.");
      setMessage(data.message);
      setUtr("");
      const latest = await fetch(`${API_URL}/api/payments/manual-request/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const latestData = await latest.json();
      if (latest.ok) setRequest(latestData.request || null);
    } catch (submitError) {
      setError(submitError.message || "Could not submit your payment request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="study-plan-page">
      <header className="study-plan-hero">
        <div>
          <p className="study-plan-eyebrow">PERSONAL INTERVIEW PREPARATION</p>
          <h1>A study plan that knows what to work on next.</h1>
          <p>Turn resume feedback and interview practice into a focused weekly routine.</p>
        </div>
        <div className="study-plan-hero-mark" aria-hidden="true">✦</div>
      </header>

      <div className="study-plan-layout">
        <section className="study-plan-includes">
          <div className="study-plan-section-heading">
            <p className="study-plan-eyebrow">WHAT YOU GET</p>
            <h2>Make each practice session count</h2>
            <p>Your weekly practice roadmap, with quick links to the tools you need each day.</p>
          </div>
          <div className="study-plan-feature-list">
            <article><span>01</span><div><h3>Weekly priorities</h3><p>Choose a target role and get a clear set of topics to focus on each week.</p></div></article>
            <article><span>02</span><div><h3>Short daily sessions</h3><p>Break preparation into manageable 20–30 minute practice blocks.</p></div></article>
            <article><span>03</span><div><h3>Feedback-led direction</h3><p>Use your interview feedback to decide what to revise and practise next.</p></div></article>
            <article><span>04</span><div><h3>Progress at a glance</h3><p>Keep track of completed tasks and the skills you are building.</p></div></article>
          </div>
          <div className="study-plan-note"><span>i</span><p>Your plan is a practice guide, not a hiring prediction. Refresh your Interview Report to tailor priorities to recent feedback.</p></div>
        </section>

        <aside className="study-plan-purchase">
          <div className="study-plan-plan-label"><span>✦</span> STUDY PLAN PLUS</div>
          <div className="study-plan-price"><strong>₹259</strong><span>/ month</span></div>
          <p className="study-plan-billing-note">Manual UPI payment · no auto-renewal</p>
          {access.isActive && (
            <div className="study-plan-active-banner">
              <span>✓</span>
              <div><strong>Study Plan access is active</strong><small>Valid through {new Date(access.accessUntil).toLocaleDateString()}</small></div>
              <button type="button" onClick={() => { setShowActivePlan(true); window.setTimeout(() => document.getElementById("active-study-plan")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }}>Open plan →</button>
            </div>
          )}

          {!access.isActive && <>
          <div className={`study-plan-qr${QR_IMAGE_URL ? " has-qr" : ""}`}>
            {QR_IMAGE_URL ? (
              <img src={QR_IMAGE_URL} alt="UPI payment QR code" />
            ) : (
              <div className="study-plan-qr-placeholder"><span>▦</span><strong>UPI QR will appear here</strong><small>Send your QR image and we can add it.</small></div>
            )}
          </div>

          <ol className="study-plan-payment-steps">
            <li>Scan the QR and pay ₹259 using your UPI app.</li>
            <li>Enter the UTR / transaction ID shown in the payment details.</li>
            <li>Access stays pending until the payment is checked manually.</li>
          </ol>

          {request && (
            <div className={`study-plan-request-status is-${request.status}`}>
              <strong>Latest request: {request.status}</strong>
              <span>₹{request.amount} · UTR {request.utr}</span>
            </div>
          )}

          <form className="study-plan-payment-form" onSubmit={submitPayment}>
            <label htmlFor="study-plan-utr">UPI UTR / transaction ID</label>
            <input
              id="study-plan-utr"
              value={utr}
              onChange={(event) => setUtr(event.target.value)}
              placeholder="Enter the payment reference"
              minLength={8}
              maxLength={32}
              disabled={!QR_IMAGE_URL || submitting}
              required
            />
            <button type="submit" disabled={!QR_IMAGE_URL || submitting || !utr.trim()}>
              {submitting ? "Submitting…" : "Submit payment request"}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
            {!QR_IMAGE_URL && <small className="study-plan-qr-hint">Payment submission will open after the QR is added.</small>}
          </form>
          {message && <p className="study-plan-feedback is-success" role="status">{message}</p>}
          {error && <p className="study-plan-feedback is-error" role="alert">{error}</p>}
          <p className="study-plan-payment-footnote">Never share your UPI PIN or OTP. Keep your payment receipt until your request is reviewed.</p>
          </>}
        </aside>
      </div>

      {access.isActive && showActivePlan && <section className="active-study-plan" id="active-study-plan">
        <div className="active-study-plan-heading"><div><p className="study-plan-eyebrow">YOUR 7-DAY ROADMAP</p><h2>{weakAreas.length ? "Focused on your recent improvement areas" : "Build a steady interview-practice routine"}</h2><p>{weakAreas.length ? "These priorities come from your saved Interview Report. Refresh that report to update them." : "Generate an Interview Report to tailor the first practice days to your strengths and gaps."}</p></div><button type="button" onClick={() => onNavigate?.("interview-report")}>View interview report →</button></div>
        <div className="active-study-plan-days">{weeklyPlan.map((task) => <article key={task.day}><span>{task.day}</span><div><h3>{task.title}</h3><p>{task.detail}</p><button type="button" onClick={() => onNavigate?.(task.action)}>{task.label} →</button></div></article>)}</div>
      </section>}

      {access.isPaymentAdmin && (
        <section className="study-plan-admin-panel">
          <div className="study-plan-section-heading">
            <p className="study-plan-eyebrow">ADMIN · MANUAL UPI REVIEW</p>
            <h2>Payment requests</h2>
            <p>Match each UTR against your UPI account before approving access.</p>
          </div>
          {adminRequests.length === 0 ? (
            <div className="study-plan-admin-empty">No pending payment requests.</div>
          ) : (
            <div className="study-plan-admin-list">
              {adminRequests.map((item) => (
                <article className="study-plan-admin-request" key={item._id}>
                  <div className="study-plan-admin-person">
                    <strong>{item.name}</strong><span>{item.email}</span>
                  </div>
                  <div className="study-plan-admin-payment">
                    <strong>₹{item.amount}</strong><span>UTR: <code>{item.utr}</code></span>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </div>
                  <div className="study-plan-admin-actions">
                    <button type="button" className="is-reject" disabled={Boolean(reviewingId)} onClick={() => reviewRequest(item._id, "reject")}>{reviewingId === item._id ? "Working…" : "Reject"}</button>
                    <button type="button" className="is-approve" disabled={Boolean(reviewingId)} onClick={() => reviewRequest(item._id, "approve")}>{reviewingId === item._id ? "Working…" : "Verify & grant 30 days"}</button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {message && <p className="study-plan-feedback is-success" role="status">{message}</p>}
          {error && <p className="study-plan-feedback is-error" role="alert">{error}</p>}
        </section>
      )}
    </main>
  );
}

export default StudyPlan;
