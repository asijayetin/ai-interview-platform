import { useEffect, useState } from "react";
import { downloadLanguageNotes, getLanguageNotes, STUDY_LANGUAGES } from "./studyNotes";
import "./StudyPlan.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");
const QR_IMAGE_URL = import.meta.env.VITE_UPI_QR_IMAGE_URL || "/study-plan-upi-qr.png";

function StudyPlan({ onNavigate }) {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [languageLocked, setLanguageLocked] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(true);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [utr, setUtr] = useState("");
  const [request, setRequest] = useState(null);
  const [access, setAccess] = useState(null);
  const [adminRequests, setAdminRequests] = useState([]);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAccess({ isActive: false, accessUntil: null, isPaymentAdmin: false });
      return;
    }
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
      .catch(() => setAccess({ isActive: false, accessUntil: null, isPaymentAdmin: false }));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLanguageLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/auth/me`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load your saved language.");
        const accountLanguage = data.user?.studyPlanLanguage || "";
        if (accountLanguage) {
          setSelectedLanguage(accountLanguage);
          setLanguageLocked(true);
          localStorage.setItem("studyPlanLanguage", accountLanguage);
          return;
        }

      })
      .catch(() => {
        // A browser-stored language can belong to a different account on this
        // device. Only the authenticated account record can lock this choice.
        setSelectedLanguage("");
        setLanguageLocked(false);
      })
      .finally(() => setLanguageLoading(false));
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

  const chooseLanguage = async (language) => {
    if (languageLocked || languageSaving) return;
    setError("");
    setLanguageSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/study-plan-language`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save your language choice.");
      const savedLanguage = data.language || language;
      setSelectedLanguage(savedLanguage);
      setLanguageLocked(true);
      localStorage.setItem("studyPlanLanguage", savedLanguage);
      setActiveTab("home");
    } catch (languageError) {
      setError(languageError.message || "Could not save your language choice.");
    } finally {
      setLanguageSaving(false);
    }
  };

  const notes = getLanguageNotes(selectedLanguage);

  if (access === null) {
    return (
      <main className="study-plan-page study-plan-loading" aria-busy="true" aria-live="polite">
        <div className="study-plan-loading-card"><span className="study-plan-loading-mark">✦</span><strong>Loading your Study Plan</strong><span>Checking your access and saved language…</span></div>
      </main>
    );
  }

  return (
    <main className="study-plan-page">
      {access.isActive ? (
        <>
          <header className="study-plan-hero study-plan-library-hero">
            <div>
              <p className="study-plan-eyebrow">YOUR STUDY PLAN</p>
              <h1>{selectedLanguage ? `${notes.name} interview prep` : "Choose your coding language"}</h1>
              <p>{selectedLanguage ? "Your notes, DSA questions, and coding workspace are tied to this language." : "Pick the language you want to practise. This choice will be saved to your account."}</p>
            </div>
            <div className="study-plan-hero-mark" aria-hidden="true">{selectedLanguage ? notes.name === "Python" ? "Py" : notes.name.slice(0, 1) : "✦"}</div>
          </header>

          <section className="study-plan-language-picker" aria-label="Choose programming language">
            <div className="study-plan-section-heading">
              <p className="study-plan-eyebrow">STEP 1 · LANGUAGE</p>
              <h2>What do you want to practise in?</h2>
              <p>{languageLoading ? "Loading your saved choice…" : languageLocked ? "Your language is fixed for this Study Plan and saved to your account." : "Choose carefully: this language will be locked to your account."}</p>
            </div>
            {languageLoading && <div className="study-plan-locked-language"><span>…</span><div><strong>Loading your account’s language choice</strong><small>Each account keeps its own Study Plan language.</small></div></div>}
            {!languageLocked && !languageLoading && <div className="study-plan-language-grid">
              {STUDY_LANGUAGES.map((language) => (
                <button type="button" key={language.id} className={selectedLanguage === language.id ? "is-selected" : ""} disabled={languageLoading || languageSaving || languageLocked} onClick={() => chooseLanguage(language.id)}>
                  <span>{language.icon}</span><strong>{language.label}{selectedLanguage === language.id && languageLocked ? " · Selected" : ""}</strong><small>{languageSaving && selectedLanguage === language.id ? "Saving choice…" : "100+ DSA questions + notes"}</small>
                </button>
              ))}
            </div>}
            {languageLocked && <div className="study-plan-locked-language"><span>✓</span><div><strong>{notes.name} is selected for your account</strong><small>This setting follows your account on any device. Other accounts can choose their own language.</small></div></div>}
            {error && <p className="study-plan-feedback is-error" role="alert">{error}</p>}
          </section>

          {selectedLanguage && <div className="study-plan-learning-layout">
            <nav className="study-plan-learning-nav" aria-label="Study Plan sections">
              <p className="study-plan-eyebrow">YOUR MATERIALS</p>
              <button type="button" className={activeTab === "home" ? "is-active" : ""} onClick={() => setActiveTab("home")}>⌂ <span>Study Plan</span></button>
              <button type="button" className={activeTab === "dsa" ? "is-active" : ""} onClick={() => setActiveTab("dsa")}>⌘ <span>DSA Sheet</span></button>
              <button type="button" className={activeTab === "notes" ? "is-active" : ""} onClick={() => setActiveTab("notes")}>▤ <span>{notes.name} Notes</span></button>
              <div className="study-plan-learning-nav-note">Selected language<br/><strong>{notes.name}</strong></div>
            </nav>

            <section className="study-plan-learning-content">
              {activeTab === "home" && <>
                <div className="study-plan-section-heading">
                  <p className="study-plan-eyebrow">STEP 2 · LEARN AND PRACTISE</p>
                  <h2>{notes.name} learning workspace</h2>
                  <p>Open the DSA sheet to solve interview problems, or download your language notes for offline revision.</p>
                </div>
                <div className="study-plan-resource-grid">
                  <article><span className="study-plan-resource-icon">⌘</span><p className="study-plan-eyebrow">PRACTICE</p><h3>DSA Sheet</h3><p>{`Browse 100+ topic-wise questions, use the ${notes.name} coding editor, and track accepted solutions.`}</p><button type="button" onClick={() => setActiveTab("dsa")}>Open DSA Sheet →</button></article>
                  <article><span className="study-plan-resource-icon">▤</span><p className="study-plan-eyebrow">OFFLINE REFERENCE</p><h3>{notes.name} Notes</h3><p>Review syntax, data structures, common patterns, and complexity reminders.</p><button type="button" onClick={() => setActiveTab("notes")}>View notes →</button></article>
                </div>
              </>}

              {activeTab === "dsa" && <>
                <div className="study-plan-section-heading">
                  <p className="study-plan-eyebrow">DSA QUESTION BANK</p>
                  <h2>{notes.name} coding practice</h2>
                  <p>{`Open the 100+ question sheet and continue your saved ${notes.name} progress.`}</p>
                </div>
                <button className="study-plan-primary-action" type="button" onClick={() => onNavigate?.("dsa-sheet")}>Open {notes.name} DSA Sheet →</button>
              </>}

              {activeTab === "notes" && <>
                <div className="study-plan-notes-heading">
                  <div className="study-plan-section-heading">
                    <p className="study-plan-eyebrow">LANGUAGE QUICK REFERENCE</p>
                    <h2>{notes.name} DSA notes</h2>
                    <p>{notes.subtitle}. Download the PDF to revise offline.</p>
                  </div>
                  <button className="study-plan-primary-action" type="button" onClick={() => downloadLanguageNotes(selectedLanguage)}>↓ Download PDF</button>
                </div>
                <div className="study-plan-notes-list">{notes.sections.map(([title, bullets, code, exercise], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><p className="study-plan-notes-code-label">{notes.name} example</p><pre className="study-plan-notes-code"><code>{code}</code></pre><p className="study-plan-notes-exercise"><strong>Try it:</strong> {exercise}</p></div></article>)}</div>
              </>}
            </section>
          </div>}
        </>
      ) : <>
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
            <p>A focused DSA practice library with a compiler, topic filters, and saved progress.</p>
          </div>
          <div className="study-plan-feature-list">
            <article><span>01</span><div><h3>Topic-wise DSA practice</h3><p>Practise curated array, string, stack, queue, graph, and dynamic programming problems.</p></div></article>
            <article><span>02</span><div><h3>Easy to hard</h3><p>Browse problems by topic and difficulty, then focus on one challenge at a time.</p></div></article>
            <article><span>03</span><div><h3>Hints and approaches</h3><p>Reveal a nudge when stuck or review a suggested algorithmic approach.</p></div></article>
            <article><span>04</span><div><h3>Built-in compiler</h3><p>Practise in Java, Python, C++, JavaScript, or C# with saved drafts.</p></div></article>
          </div>
          <div className="study-plan-note"><span>i</span><p>Open the DSA Sheet from the left navigation or use the button below whenever you are ready to practise.</p></div>
        </section>

        <aside className="study-plan-purchase">
          <div className="study-plan-plan-label"><span>✦</span> STUDY PLAN PLUS</div>
          <div className="study-plan-price"><strong>₹259</strong><span>/ month</span></div>
          <p className="study-plan-billing-note">Manual UPI payment · no auto-renewal</p>
          {access.isActive && (
            <div className="study-plan-active-banner">
              <span>✓</span>
              <div><strong>Study Plan access is active</strong><small>Valid through {new Date(access.accessUntil).toLocaleDateString()}</small></div>
              <button type="button" onClick={() => onNavigate?.("dsa-sheet")}>Open DSA Sheet →</button>
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
      </>}

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
