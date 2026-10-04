import { useCallback, useEffect, useState } from "react";
import "./Organizer.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");

function Organizer() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [learners, setLearners] = useState([]);
  const [languageDrafts, setLanguageDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [summaryResponse, requestsResponse, learnersResponse] = await Promise.all([
        fetch(`${API_URL}/api/organizer/overview`, { headers }),
        fetch(`${API_URL}/api/payments/admin/requests`, { headers }),
        fetch(`${API_URL}/api/organizer/learners`, { headers }),
      ]);
      const [summary, paymentData, learnerData] = await Promise.all([
        summaryResponse.json(), requestsResponse.json(), learnersResponse.json(),
      ]);
      const failed = [summaryResponse, requestsResponse, learnersResponse].find((response) => !response.ok);
      if (failed) throw new Error([summary, paymentData, learnerData].find((data) => data.message)?.message || "Could not load organizer data.");
      setOverview(summary); setRequests(paymentData.requests || []); setLearners(learnerData.learners || []);
      setLanguageDrafts(Object.fromEntries((learnerData.learners || []).map((learner) => [learner.id, learner.studyPlanLanguage || ""])));
    } catch (loadError) { setError(loadError.message || "Could not reach the server."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id, decision) => {
    setBusy(id); setNotice(""); setError("");
    try {
      const response = await fetch(`${API_URL}/api/payments/admin/requests/${id}/review`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Payment review failed.");
      setNotice(data.message); await load();
    } catch (actionError) { setError(actionError.message); }
    finally { setBusy(""); }
  };

  const setAccess = async (id, action) => {
    setBusy(id); setNotice(""); setError("");
    try {
      const response = await fetch(`${API_URL}/api/organizer/learners/${id}/access`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update learner access.");
      setNotice(data.message); await load();
    } catch (actionError) { setError(actionError.message); }
    finally { setBusy(""); }
  };

  const updateLearnerLanguage = async (id) => {
    const language = languageDrafts[id];
    if (!language) return;
    const taskId = `${id}:language`;
    setBusy(taskId); setNotice(""); setError("");
    try {
      const response = await fetch(`${API_URL}/api/organizer/learners/${id}/language`, {
        method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update learner language.");
      setNotice(data.message); await load();
    } catch (actionError) { setError(actionError.message); }
    finally { setBusy(""); }
  };

  const filteredLearners = learners.filter((learner) => `${learner.name} ${learner.email}`.toLowerCase().includes(search.toLowerCase()));
  const tabs = [["overview", "Overview"], ["payments", `Payment approvals${requests.length ? ` (${requests.length})` : ""}`], ["learners", "Learners"], ["roadmap", "Platform roadmap"]];

  return <main className="organizer-page">
    <header className="organizer-heading"><div><p className="organizer-eyebrow">PLATFORM MANAGEMENT</p><h1>Organizer console</h1><p>Review payments, manage learner access, and monitor platform activity.</p></div><button className="organizer-refresh" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
    {(notice || error) && <div className={`organizer-alert ${error ? "is-error" : "is-success"}`} role="status">{error || notice}</div>}
    <nav className="organizer-tabs" aria-label="Organizer sections">{tabs.map(([id, label]) => <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {loading && !overview ? <div className="organizer-empty">Loading organizer data…</div> : <>
      {tab === "overview" && <>
        <section className="organizer-stats">
          {[["Learners", overview?.learners ?? "—", "Registered accounts"], ["Pending payments", overview?.pendingPayments ?? "—", "Need manual verification"], ["Approved payments", overview?.approvedPayments ?? "—", "Payment history"], ["Interview attempts", overview?.interviews ?? "—", "Practice activity"]].map(([label, value, note]) => <article className="organizer-stat" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
        </section>
        <section className="organizer-card organizer-quick"><div><p className="organizer-eyebrow">MANUAL UPI FLOW</p><h2>Verify the UTR, then approve access</h2><p>Approval adds 30 days to the learner’s Study Plan access. If access is already active, the next 30 days are added after its current expiry.</p></div><button onClick={() => setTab("payments")}>Review {requests.length} pending →</button></section>
        <section className="organizer-card organizer-safety"><h2>Organizer permissions</h2><p>This console is restricted to the email configured as <code>MANUAL_PAYMENT_ADMIN_EMAIL</code> on the backend. Learners cannot grant themselves access from the browser.</p></section>
      </>}
      {tab === "payments" && <section className="organizer-card"><div className="organizer-card-heading"><div><p className="organizer-eyebrow">PAYMENT QUEUE</p><h2>Requests waiting for review</h2><p>Match the submitted UTR against your UPI app before approving.</p></div><span className="organizer-count">{requests.length} pending</span></div>
        {requests.length === 0 ? <div className="organizer-empty">No payment requests need review right now.</div> : <div className="organizer-table-wrap"><table className="organizer-table"><thead><tr><th>Learner</th><th>UPI reference (UTR)</th><th>Amount</th><th>Submitted</th><th>Decision</th></tr></thead><tbody>{requests.map((item) => <tr key={item._id}><td><strong>{item.name || "Learner"}</strong><small>{item.email}</small></td><td><code>{item.utr}</code></td><td>₹{item.amount}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td className="organizer-actions"><button className="organizer-approve" disabled={busy === item._id} onClick={() => review(item._id, "approve")}>{busy === item._id ? "Saving…" : "Approve"}</button><button className="organizer-reject" disabled={busy === item._id} onClick={() => review(item._id, "reject")}>Reject</button></td></tr>)}</tbody></table></div>}
      </section>}
      {tab === "learners" && <section className="organizer-card"><div className="organizer-card-heading"><div><p className="organizer-eyebrow">ACCOUNT MANAGEMENT</p><h2>Learners</h2><p>Manage each learner’s plan access and one-time language choice. Revoking access also resets the language choice.</p></div><input className="organizer-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" aria-label="Search learners" /></div>
        {filteredLearners.length === 0 ? <div className="organizer-empty">No matching learner accounts.</div> : <div className="organizer-table-wrap"><table className="organizer-table"><thead><tr><th>Learner</th><th>Joined</th><th>Interviews</th><th>Study Plan access</th><th>Language</th><th>Action</th></tr></thead><tbody>{filteredLearners.map((learner) => <tr key={learner.id}><td><strong>{learner.name || "Learner"}</strong><small>{learner.email} · {learner.emailVerified ? "Email verified" : "Email unverified"}</small></td><td>{new Date(learner.joinedAt).toLocaleDateString()}</td><td>{learner.interviews}</td><td><span className={`organizer-status ${learner.planActive ? "is-active" : ""}`}>{learner.planActive ? `Active to ${new Date(learner.accessUntil).toLocaleDateString()}` : "Inactive"}</span></td><td className="organizer-language-cell"><select value={languageDrafts[learner.id] ?? learner.studyPlanLanguage ?? ""} onChange={(event) => setLanguageDrafts((current) => ({ ...current, [learner.id]: event.target.value }))} aria-label={`Language for ${learner.email}`}><option value="">Not selected</option><option value="java">Java</option><option value="cpp">C++</option><option value="python">Python</option><option value="javascript">JavaScript</option><option value="csharp">C#</option></select><button className="organizer-language-save" disabled={!languageDrafts[learner.id] || languageDrafts[learner.id] === learner.studyPlanLanguage || busy === `${learner.id}:language`} onClick={() => updateLearnerLanguage(learner.id)}>{busy === `${learner.id}:language` ? "Saving…" : "Save"}</button></td><td>{learner.planActive ? <button className="organizer-reject" disabled={busy === learner.id} onClick={() => setAccess(learner.id, "revoke")}>{busy === learner.id ? "Saving…" : "Revoke + reset"}</button> : <button className="organizer-approve" disabled={busy === learner.id} onClick={() => setAccess(learner.id, "grant")}>{busy === learner.id ? "Saving…" : "Grant 30 days"}</button>}</td></tr>)}</tbody></table></div>}
      </section>}
      {tab === "roadmap" && <section className="organizer-card organizer-roadmap"><div className="organizer-card-heading"><div><p className="organizer-eyebrow">LEARNING TOOLS</p><h2>Next platform modules</h2><p>Admin controls and learner delivery will expand as these modules are added.</p></div></div><div className="organizer-roadmap-grid"><article><span>01</span><h3>DSA practice sheet</h3><p>Topic sections, difficulty levels, per-problem hints, solutions, and completion tracking.</p><b>Planned</b></article><article><span>02</span><h3>Compiler test progress</h3><p>Run three cases for each problem and mark it complete only when all pass.</p><b>Planned</b></article><article><span>03</span><h3>Completion certificate</h3><p>Download a named certificate and send it to the learner’s verified email.</p><b>Planned</b></article><article><span>04</span><h3>Personalized coaching</h3><p>Use resume and interview feedback to surface weak topics and recommend practice.</p><b>Available across existing tools</b></article></div></section>}
    </>}</main>;
}

export default Organizer;
