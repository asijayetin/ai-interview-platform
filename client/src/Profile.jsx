import { useState } from "react";
import "./Profile.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");

const readUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
};

const getInitials = (name = "User") => name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

function Profile({ onBackToDashboard, onManageSettings, onLogout }) {
  const [user, setUser] = useState(readUser);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const saveName = async (event) => {
    event.preventDefault();
    const name = draftName.trim();
    if (name.length < 2 || name.length > 60) {
      setError("Name should be between 2 and 60 characters.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) { setError("Your session expired. Please sign in again."); return; }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not update your profile.");
      const updatedUser = { ...user, ...(data.user || {}), name };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setDraftName(name);
      setEditingName(false);
      setMessage("Your name has been updated.");
    } catch (saveError) {
      setError(saveError.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const cancelNameEdit = () => { setDraftName(user.name || ""); setEditingName(false); setError(""); };

  return (
    <main className="profile-page-pro">
      <div className="profile-page-topbar">
        <button type="button" className="profile-back-button" onClick={onBackToDashboard}><span aria-hidden="true">←</span> Dashboard</button>
        <span className="profile-breadcrumb">Account <i>/</i> Profile</span>
      </div>

      <header className="profile-page-heading">
        <div><p className="profile-pro-eyebrow">YOUR ACCOUNT</p><h1>Profile</h1><p>Manage your personal details and account security.</p></div>
        <button type="button" className="profile-settings-shortcut" onClick={onManageSettings}><span>⚙</span> Account settings <b>→</b></button>
      </header>

      <section className="profile-overview-card">
        <div className="profile-overview-banner"><span className="profile-banner-orb profile-banner-orb-one" /><span className="profile-banner-orb profile-banner-orb-two" /><span className="profile-account-badge"><i /> Active account</span></div>
        <div className="profile-overview-content">
          <div className="profile-avatar-pro" aria-label={`Avatar for ${user.name || "user"}`}>{getInitials(user.name)}</div>
          <div className="profile-overview-copy"><p className="profile-pro-eyebrow">AI INTERVIEW ARENA MEMBER</p><h2>{user.name || "Your profile"}</h2><p>{user.email || "No email address available"}</p></div>
          <span className={`profile-email-status${user.emailVerified ? " is-verified" : " is-pending"}`}><i />{user.emailVerified ? "Email verified" : "Email not verified"}</span>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="profile-details-card">
          <div className="profile-card-heading"><span className="profile-card-icon">◉</span><div><h3>Personal information</h3><p>Keep the details associated with your account up to date.</p></div></div>

          <div className="profile-detail-row">
            <div className="profile-detail-icon">Aa</div><div className="profile-detail-copy"><span>Full name</span>{editingName ? <form className="profile-name-edit" onSubmit={saveName}><input autoFocus value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={60} aria-label="Full name" /><div><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button><button type="button" onClick={cancelNameEdit} disabled={saving}>Cancel</button></div></form> : <strong>{user.name || "Not available"}</strong>}</div>
            {!editingName && <button type="button" className="profile-edit-button" onClick={() => { setDraftName(user.name || ""); setEditingName(true); setMessage(""); setError(""); }}>Edit</button>}
          </div>

          <div className="profile-detail-row">
            <div className="profile-detail-icon is-purple">@</div><div className="profile-detail-copy"><span>Email address</span><strong>{user.email || "Not available"}</strong><small>Your email is used to sign in and receive account messages.</small></div><span className={`profile-inline-status${user.emailVerified ? " is-verified" : " is-pending"}`}>{user.emailVerified ? "Verified" : "Pending"}</span>
          </div>

          {error && <p className="profile-feedback is-error" role="alert">{error}</p>}
          {message && <p className="profile-feedback is-success" role="status">{message}</p>}
        </section>

        <aside className="profile-security-card">
          <div className="profile-card-heading"><span className="profile-card-icon is-green">⌑</span><div><h3>Account security</h3><p>Manage sign-in and verification.</p></div></div>
          <div className="profile-security-item"><span className="profile-security-dot is-green" /><div><strong>Email verification</strong><small>{user.emailVerified ? "Your email is verified." : "Verify your email in account settings."}</small></div></div>
          <div className="profile-security-item"><span className="profile-security-dot is-purple" /><div><strong>Password</strong><small>Update it any time from security settings.</small></div></div>
          <button type="button" className="profile-security-link" onClick={onManageSettings}>Open security settings <span>→</span></button>
        </aside>
      </div>

      <footer className="profile-page-footer"><span>Signed in as <strong>{user.email || "your account"}</strong></span><button type="button" onClick={onLogout}>Sign out <span>↗</span></button></footer>
    </main>
  );
}

export default Profile;
