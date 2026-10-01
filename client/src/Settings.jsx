import { useState } from "react";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : import.meta.env.VITE_API_URL || "http://localhost:5000";

function Settings({ onBackToProfile }) {
  const [activeSection, setActiveSection] = useState("privacy");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

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
    <div className="settings-page">
      <div className="settings-container">
        <button className="secondary-btn" onClick={onBackToProfile}>
          ← Back to Profile
        </button>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            <div className="settings-title">
              <span>⚙️</span>
              <div>
                <h2>Settings</h2>
                <p>Account &amp; privacy</p>
              </div>
            </div>

            <button
              className={activeSection === "account" ? "settings-nav active" : "settings-nav"}
              onClick={() => setActiveSection("account")}
            >
              👤 Account
            </button>
            <button
              className={activeSection === "privacy" ? "settings-nav active" : "settings-nav"}
              onClick={() => setActiveSection("privacy")}
            >
              🔒 Privacy &amp; Security
            </button>
          </aside>

          <main className="settings-content">
            {activeSection === "account" && (
              <section className="settings-card">
                <p className="profile-eyebrow">ACCOUNT</p>
                <h1>Account Information</h1>
                <p className="settings-description">
                  Manage and verify your account information.
                </p>
                <div className="settings-info-row">
                  <span>Name</span>
                  <strong>{user.name || "Not available"}</strong>
                </div>
                <button
                  type="button"
                  className="settings-click-row"
                  onClick={openEmailVerification}
                >
                  <div>
                    <strong>Email Address</strong>
                    <p>{user.email || "Not available"}</p>
                  </div>
                  <span className={user.emailVerified ? "verified-badge" : "pending-badge"}>
                    {user.emailVerified ? "✓ Verified" : "Verify →"}
                  </span>
                </button>
              </section>
            )}

            {activeSection === "privacy" && (
              <>
                <section className="settings-card">
                  <p className="profile-eyebrow">PRIVACY &amp; SECURITY</p>
                  <h1>Security Settings</h1>
                  <p className="settings-description">
                    Verify your email and regularly update your password to keep your account secure.
                  </p>
                  <button
                    type="button"
                    className="settings-click-row"
                    onClick={openEmailVerification}
                  >
                    <div>
                      <strong>Email</strong>
                      <p>{user.email || "No email available"}</p>
                    </div>
                    <span className={user.emailVerified ? "verified-badge" : "pending-badge"}>
                      {user.emailVerified ? "✓ Verified" : "Verify →"}
                    </span>
                  </button>
                </section>

                <section className="settings-card">
                  <h2>Change Password</h2>
                  <form className="password-form" onSubmit={changePassword}>
                    <label>
                      Current Password
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </label>
                    <label>
                      New Password
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                    </label>
                    <label>
                      Confirm New Password
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                    </label>

                    {passwordError && <p className="settings-error">{passwordError}</p>}
                    {passwordMessage && <p className="settings-success">{passwordMessage}</p>}

                    <button className="primary-btn" type="submit" disabled={passwordLoading}>
                      {passwordLoading ? "Changing Password..." : "Change Password"}
                    </button>
                  </form>
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {emailModalOpen && (
        <div className="otp-modal-overlay" onClick={closeEmailModal}>
          <div className="otp-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="otp-close-btn" onClick={closeEmailModal}>
              ×
            </button>
            <div className="otp-modal-icon">✉️</div>
            <p className="profile-eyebrow">EMAIL VERIFICATION</p>
            <h2>Verify your email</h2>
            <p className="otp-modal-description">
              Enter the 6-digit code sent to {user.email}.
            </p>

            <label className="otp-label">
              OTP
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
              />
            </label>

            {otpError && <p className="settings-error">{otpError}</p>}
            {otpMessage && <p className="settings-success">{otpMessage}</p>}

            <div className="otp-modal-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={verifyEmailOtp}
                disabled={otpLoading}
              >
                {otpLoading ? "Please wait..." : "Verify OTP"}
              </button>
            </div>

            <button
              type="button"
              className="otp-resend-btn"
              onClick={openEmailVerification}
              disabled={otpLoading}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
