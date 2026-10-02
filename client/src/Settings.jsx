import { useState } from "react";
import "./Settings.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");

function Settings({ onBackToProfile }) {
  const [activeSection, setActiveSection] = useState("privacy");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  const token = localStorage.getItem("token");
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const resetOtpState = () => {
    setOtp("");
    setOtpMessage("");
    setOtpError("");
    setOtpLoading(false);
  };

  const openEmailVerification = async () => {
    resetOtpState();

    if (!token) {
      setOtpError("Please log in again.");
      setEmailModalOpen(true);
      return;
    }

    if (!user.email) {
      setOtpError("No email address is available.");
      setEmailModalOpen(true);
      return;
    }

    setEmailModalOpen(true);
    setOtpLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      let response;

      try {
        response = await fetch(`${API_URL}/api/auth/send-email-otp`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ email: user.email }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();
      if (!response.ok) {
        setOtpError(data.error || data.message || "Unable to send email OTP.");
        return;
      }

      setOtpMessage(`OTP sent to ${user.email}. Check your inbox.`);
    } catch (error) {
      setOtpError(
        error?.name === "AbortError"
          ? "Email server is taking too long. Please try again."
          : error?.message || "Server error. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    setOtpError("");
    setOtpMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setOtpLoading(true);
      const response = await fetch(`${API_URL}/api/auth/verify-email-otp`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email: user.email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        setOtpError(data.message || "Invalid email OTP.");
        return;
      }

      const verifiedUser = data.user
        ? { ...user, ...data.user, emailVerified: true }
        : { ...user, emailVerified: true };
      setUser(verifiedUser);
      localStorage.setItem("user", JSON.stringify(verifiedUser));
      setOtpMessage("Email verified successfully.");
    } catch (error) {
      console.error("Verify email OTP error:", error);
      setOtpError("Server error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    resetOtpState();
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (!token) {
      setPasswordError("Please log in again.");
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.message || "Unable to change password.");
        return;
      }

      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordError("Server error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="account-settings-page">
      <div className="account-settings-wrap">
        <div className="account-settings-topline">
          <button type="button" className="account-settings-back" onClick={onBackToProfile}>← <span>Back to profile</span></button>
          <span>Account <i>/</i> Settings</span>
        </div>

        <header className="account-settings-heading">
          <div><p>YOUR ACCOUNT</p><h1>Settings</h1><span>Manage your account details and keep your sign-in secure.</span></div>
          <div className="account-settings-user"><span>{(user.name || "U").trim().slice(0, 1).toUpperCase()}</span><div><strong>{user.name || "Your account"}</strong><small>{user.email || "Signed-in account"}</small></div></div>
        </header>

        <div className="account-settings-layout">
          <aside className="account-settings-sidebar">
            <p className="account-settings-nav-label">PREFERENCES</p>
            <button type="button" className={activeSection === "account" ? "account-settings-nav active" : "account-settings-nav"} onClick={() => setActiveSection("account")}><span className="account-settings-nav-icon">◉</span><span><strong>Account</strong><small>Personal information</small></span><b>›</b></button>
            <button type="button" className={activeSection === "privacy" ? "account-settings-nav active" : "account-settings-nav"} onClick={() => setActiveSection("privacy")}><span className="account-settings-nav-icon">⌑</span><span><strong>Security</strong><small>Email and password</small></span><b>›</b></button>
            <div className="account-settings-sidebar-note"><span>✦</span><strong>Keep your account safe</strong><p>Verify your email and use a password you do not use elsewhere.</p></div>
          </aside>

          <section className="account-settings-content">
            {activeSection === "account" ? (
              <div className="account-settings-card">
                <div className="account-settings-card-heading"><div><p>PROFILE DETAILS</p><h2>Account information</h2><span>Your sign-in identity and account status.</span></div><span className="account-settings-status"><i /> Active</span></div>
                <div className="account-settings-info-list">
                  <div className="account-settings-info-row"><span className="account-settings-info-icon">Aa</span><div><small>Full name</small><strong>{user.name || "Not available"}</strong></div><span className="account-settings-readonly">Managed in Profile</span></div>
                  <button type="button" className="account-settings-info-row account-settings-email-row" onClick={openEmailVerification}><span className="account-settings-info-icon is-purple">@</span><div><small>Email address</small><strong>{user.email || "Not available"}</strong><em>{user.emailVerified ? "Used for sign-in and account messages" : "Verify your email to secure your account"}</em></div><span className={user.emailVerified ? "account-settings-verified" : "account-settings-verify"}>{user.emailVerified ? "✓ Verified" : "Verify email →"}</span></button>
                </div>
                <div className="account-settings-footnote"><span>ⓘ</span>To change your name, visit your Profile page. Your email is used to sign in.</div>
              </div>
            ) : (
              <>
                <div className="account-settings-card">
                  <div className="account-settings-card-heading"><div><p>SECURITY</p><h2>Sign-in protection</h2><span>Simple steps to protect access to your account.</span></div><span className="account-settings-shield">⌑</span></div>
                  <button type="button" className="account-settings-info-row account-settings-email-row" onClick={openEmailVerification}><span className="account-settings-info-icon is-purple">@</span><div><small>Email verification</small><strong>{user.email || "No email available"}</strong><em>{user.emailVerified ? "Your email address is verified" : "Verify your email to confirm account ownership"}</em></div><span className={user.emailVerified ? "account-settings-verified" : "account-settings-verify"}>{user.emailVerified ? "✓ Verified" : "Verify →"}</span></button>
                </div>

                <div className="account-settings-card account-settings-password-card">
                  <div className="account-settings-card-heading"><div><p>PASSWORD</p><h2>Change password</h2><span>Choose a new password with at least 6 characters.</span></div><span className="account-settings-shield is-soft">✳</span></div>
                  <form className="account-settings-form" onSubmit={changePassword}>
                    <label>Current password<input type={showPasswords ? "text" : "password"} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Enter current password" required /></label>
                    <div className="account-settings-form-row"><label>New password<input type={showPasswords ? "text" : "password"} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 6 characters" required /></label><label>Confirm new password<input type={showPasswords ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" required /></label></div>
                    <div className="account-settings-password-hint"><span className={newPassword.length >= 6 ? "is-ready" : ""}>●</span> At least 6 characters <label><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} /> Show passwords</label></div>
                    {passwordError && <p className="account-settings-feedback is-error" role="alert">{passwordError}</p>}
                    {passwordMessage && <p className="account-settings-feedback is-success" role="status">{passwordMessage}</p>}
                    <div className="account-settings-form-actions"><button type="submit" disabled={passwordLoading}>{passwordLoading ? "Updating password…" : "Update password"}<span>→</span></button></div>
                  </form>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {emailModalOpen && <div className="account-settings-modal-backdrop" onClick={closeEmailModal}><section className="account-settings-modal" role="dialog" aria-modal="true" aria-labelledby="verify-email-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="account-settings-modal-close" aria-label="Close" onClick={closeEmailModal}>×</button><span className="account-settings-modal-icon">@</span><p>EMAIL VERIFICATION</p><h2 id="verify-email-title">Verify your email</h2><span className="account-settings-modal-description">Enter the 6-digit code sent to <strong>{user.email}</strong>.</span>
        <label className="account-settings-otp-label">Verification code<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="000000" /></label>
        {otpError && <p className="account-settings-feedback is-error" role="alert">{otpError}</p>}{otpMessage && <p className="account-settings-feedback is-success" role="status">{otpMessage}</p>}
        <button type="button" className="account-settings-verify-submit" onClick={verifyEmailOtp} disabled={otpLoading}>{otpLoading ? "Please wait…" : "Verify email"}<span>→</span></button><button type="button" className="account-settings-resend" onClick={openEmailVerification} disabled={otpLoading}>Didn’t receive a code? <strong>Resend</strong></button>
      </section></div>}
    </main>
  );
}

export default Settings;
