import { useEffect, useState } from "react";
import "./StudyPlan.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");
const QR_IMAGE_URL = import.meta.env.VITE_UPI_QR_IMAGE_URL || "/study-plan-upi-qr.png";

function StudyPlan() {
  const [utr, setUtr] = useState("");
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/payments/manual-request/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setRequest(data.request || null);
      })
      .catch(() => {});
  }, []);

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
            <p>Study Plan Plus is planned as a lightweight companion to your interview prep.</p>
          </div>
          <div className="study-plan-feature-list">
            <article><span>01</span><div><h3>Weekly priorities</h3><p>Choose a target role and get a clear set of topics to focus on each week.</p></div></article>
            <article><span>02</span><div><h3>Short daily sessions</h3><p>Break preparation into manageable 20–30 minute practice blocks.</p></div></article>
            <article><span>03</span><div><h3>Feedback-led direction</h3><p>Use your interview feedback to decide what to revise and practise next.</p></div></article>
            <article><span>04</span><div><h3>Progress at a glance</h3><p>Keep track of completed tasks and the skills you are building.</p></div></article>
          </div>
          <div className="study-plan-note"><span>i</span><p>This is a planned paid feature. No payment is collected until the UPI QR is configured and the plan is ready.</p></div>
        </section>

        <aside className="study-plan-purchase">
          <div className="study-plan-plan-label"><span>✦</span> STUDY PLAN PLUS</div>
          <div className="study-plan-price"><strong>₹259</strong><span>/ month</span></div>
          <p className="study-plan-billing-note">Manual UPI payment · no auto-renewal</p>

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
        </aside>
      </div>
    </main>
  );
}

export default StudyPlan;
