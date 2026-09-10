import { useState } from "react";

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : import.meta.env.VITE_API_URL || "http://localhost:5000";

function Settings({ onBackToProfile }) {
  const [activeSection, setActiveSection] = useState("privacy");

  // ========================================
  // PASSWORD STATES
  // ========================================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ========================================
  // OTP STATES
  // ========================================

  const [otpMode, setOtpMode] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  // ========================================
  // USER
  // ========================================

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  // ========================================
  // HELPERS
  // ========================================

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

  // ========================================
  // CHANGE PASSWORD
  // ========================================

  const changePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (!token) {
      setPasswordError("Please login again.");
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(
          data.message || "Unable to change password."
        );
        return;
      }

      setPasswordMessage(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.log("Change password error:", error);
      setPasswordError(
        "Server error. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ========================================
  // OPEN EMAIL OTP
  // ========================================

  const openEmailOtp = async () => {
    resetOtpState();

    if (!token) {
      setOtpError("Please login again.");
      return;
    }

    if (!user.email) {
      setOtpError("No email address is available.");
      return;
    }

    setOtpMode("email");
    setOtpLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let response;

      try {
        response = await fetch(
          `${API_URL}/api/auth/send-email-otp`,
          {
            method: "POST",
            headers: authHeaders,
            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        setOtpError(
          data.message || "Unable to send email OTP."
        );
        return;
      }

      setOtpMessage(
        `OTP sent to ${user.email}. Check your inbox.`
      );
    } catch (error) {
      console.log("Email OTP error:", error);

      if (error?.name === "AbortError") {
        setOtpError(
          "Email server is taking too long to respond. Please try again."
        );
      } else {
        setOtpError(
          error?.message || "Server error. Please try again."
        );
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // ========================================
  // VERIFY EMAIL OTP
  // ========================================

  const verifyEmailOtp = async () => {
    setOtpError("");
    setOtpMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/verify-email-otp`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOtpError(
          data.message || "Invalid email OTP."
        );
        return;
      }

      setOtpMessage(
        "Email verified successfully."
      );

      setUser((previous) => ({
        ...previous,
        emailVerified: true,
      }));
    } catch (error) {
      console.log("Verify email OTP error:", error);
      setOtpError(
        "Server error. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ========================================
  // OPEN PHONE OTP
  // ========================================

  const openPhoneOtp = () => {
    resetOtpState();
    setOtpMode("phone");
  };

  // ========================================
  // SEND PHONE OTP
  // ========================================

  const sendPhoneOtp = async () => {
    setOtpError("");
    setOtpMessage("");

    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      setOtpError(
        "Enter phone number with country code, e.g. +919876543210."
      );
      return;
    }

    if (!token) {
      setOtpError("Please login again.");
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/send-phone-otp`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            phone: phone.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOtpError(
          data.message || "Unable to send phone OTP."
        );
        return;
      }

      setOtpMessage(
        `OTP sent to ${phone.trim()}.`
      );
    } catch (error) {
      console.log("Phone OTP error:", error);
      setOtpError(
        "Server error. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ========================================
  // VERIFY PHONE OTP
  // ========================================

  const verifyPhoneOtp = async () => {
    setOtpError("");
    setOtpMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/verify-phone-otp`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            phone: phone.trim(),
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOtpError(
          data.message || "Invalid phone OTP."
        );
        return;
      }

      setOtpMessage(
        "Phone number verified successfully."
      );

      setPhoneVerified(true);

      setUser((previous) => ({
        ...previous,
        phone: phone.trim(),
        phoneVerified: true,
      }));

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          phone: phone.trim(),
          phoneVerified: true,
        })
      );
    } catch (error) {
      console.log("Verify phone OTP error:", error);
      setOtpError(
        "Server error. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ========================================
  // CLOSE OTP
  // ========================================

  const closeOtp = () => {
    setOtpMode(null);
    resetOtpState();
  };

  // ========================================
  // RETURN
  // ========================================

  return (
    <div className="settings-page">
      <div className="settings-container">

        <button
          className="secondary-btn"
          onClick={onBackToProfile}
        >
          ← Back to Profile
        </button>

        <div className="settings-layout">

          {/* SIDEBAR */}

          <aside className="settings-sidebar">

            <div className="settings-title">
              <span>⚙️</span>

              <div>
                <h2>Settings</h2>
                <p>Account & privacy</p>
              </div>
            </div>

            <button
              className={
                activeSection === "account"
                  ? "settings-nav active"
                  : "settings-nav"
              }
              onClick={() =>
                setActiveSection("account")
              }
            >
              👤 Account
            </button>

            <button
              className={
                activeSection === "privacy"
                  ? "settings-nav active"
                  : "settings-nav"
              }
              onClick={() =>
                setActiveSection("privacy")
              }
            >
              🔒 Privacy & Security
            </button>

          </aside>

          {/* MAIN CONTENT */}

          <main className="settings-content">

            {/* ACCOUNT */}

            {activeSection === "account" && (
              <section className="settings-card">

                <p className="profile-eyebrow">
                  ACCOUNT
                </p>

                <h1>
                  Account Information
                </h1>

                <p className="settings-description">
                  Manage and verify your account
                  information.
                </p>

                <div className="settings-info-row">
                  <span>Name</span>

                  <strong>
                    {user.name || "Not available"}
                  </strong>
                </div>

                <button
                  type="button"
                  className="settings-click-row"
                  onClick={openEmailOtp}
                >
                  <div>
                    <strong>Email Address</strong>
                    <p>
                      {user.email || "Not available"}
                    </p>
                  </div>

                  <span
                    className={
                      user.emailVerified
                        ? "verified-badge"
                        : "pending-badge"
                    }
                  >
                    {user.emailVerified
                      ? "✓ Verified"
                      : "Verify →"}
                  </span>
                </button>

                <button
                  type="button"
                  className="settings-click-row"
                  onClick={openPhoneOtp}
                >
                  <div>
                    <strong>Phone Number</strong>
                    <p>
                      {user.phone ||
                        "Add a phone number"}
                    </p>
                  </div>

                  <span
                    className={
                      phoneVerified ||
                      user.phoneVerified
                        ? "verified-badge"
                        : "pending-badge"
                    }
                  >
                    {phoneVerified ||
                    user.phoneVerified
                      ? "✓ Verified"
                      : "Add & Verify →"}
                  </span>
                </button>

              </section>
            )}

            {/* PRIVACY */}

            {activeSection === "privacy" && (
              <>
                <section className="settings-card">

                  <p className="profile-eyebrow">
                    PRIVACY & SECURITY
                  </p>

                  <h1>
                    Security Settings
                  </h1>

                  <p className="settings-description">
                    Keep your account secure by
                    verifying your contact details
                    and regularly updating your password.
                  </p>

                  <button
                    type="button"
                    className="settings-click-row"
                    onClick={openEmailOtp}
                  >
                    <div>
                      <strong>Email</strong>

                      <p>
                        {user.email ||
                          "No email available"}
                      </p>
                    </div>

                    <span
                      className={
                        user.emailVerified
                          ? "verified-badge"
                          : "pending-badge"
                      }
                    >
                      {user.emailVerified
                        ? "✓ Verified"
                        : "Verify →"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="settings-click-row"
                    onClick={openPhoneOtp}
                  >
                    <div>
                      <strong>
                        Phone Number
                      </strong>

                      <p>
                        {user.phone ||
                          "Add your phone number"}
                      </p>
                    </div>

                    <span
                      className={
                        phoneVerified ||
                        user.phoneVerified
                          ? "verified-badge"
                          : "pending-badge"
                      }
                    >
                      {phoneVerified ||
                      user.phoneVerified
                        ? "✓ Verified"
                        : "Add & Verify →"}
                    </span>
                  </button>

                </section>

                {/* CHANGE PASSWORD */}

                <section className="settings-card">

                  <h2>
                    Change Password
                  </h2>

                  <form
                    className="password-form"
                    onSubmit={changePassword}
                  >

                    <label>
                      Current Password

                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) =>
                          setCurrentPassword(
                            e.target.value
                          )
                        }
                        placeholder="Enter current password"
                        required
                      />
                    </label>

                    <label>
                      New Password

                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(
                            e.target.value
                          )
                        }
                        placeholder="Enter new password"
                        required
                      />
                    </label>

                    <label>
                      Confirm New Password

                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        placeholder="Confirm new password"
                        required
                      />
                    </label>

                    {passwordError && (
                      <p className="settings-error">
                        {passwordError}
                      </p>
                    )}

                    {passwordMessage && (
                      <p className="settings-success">
                        {passwordMessage}
                      </p>
                    )}

                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={passwordLoading}
                    >
                      {passwordLoading
                        ? "Changing Password..."
                        : "Change Password"}
                    </button>

                  </form>

                </section>

              </>
            )}

          </main>

        </div>

      </div>

      {/* OTP MODAL */}

      {otpMode && (
        <div
          className="otp-modal-overlay"
          onClick={closeOtp}
        >
          <div
            className="otp-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="otp-close-btn"
              onClick={closeOtp}
            >
              ×
            </button>

            <div className="otp-modal-icon">
              {otpMode === "email"
                ? "✉️"
                : "📱"}
            </div>

            <p className="profile-eyebrow">
              {otpMode === "email"
                ? "EMAIL VERIFICATION"
                : "PHONE VERIFICATION"}
            </p>

            <h2>
              {otpMode === "email"
                ? "Verify your email"
                : "Verify your phone"}
            </h2>

            <p className="otp-modal-description">
              {otpMode === "email"
                ? `We'll send a 6-digit OTP to ${user.email}.`
                : "Enter your phone number and we'll send a 6-digit OTP."}
            </p>

            {/* PHONE NUMBER */}

            {otpMode === "phone" && (
              <label className="otp-label">
                Phone Number

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="+919876543210"
                />

              </label>
            )}

            {/* OTP */}

            <label className="otp-label">
              OTP

              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Enter 6-digit OTP"
              />
            </label>

            {otpError && (
              <p className="settings-error">
                {otpError}
              </p>
            )}

            {otpMessage && (
              <p className="settings-success">
                {otpMessage}
              </p>
            )}

            <div className="otp-modal-actions">

              {otpMode === "phone" && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={sendPhoneOtp}
                  disabled={otpLoading}
                >
                  {otpLoading
                    ? "Sending..."
                    : "Send OTP"}
                </button>
              )}

              <button
                type="button"
                className="primary-btn"
                onClick={
                  otpMode === "email"
                    ? verifyEmailOtp
                    : verifyPhoneOtp
                }
                disabled={otpLoading}
              >
                {otpLoading
                  ? "Please wait..."
                  : "Verify OTP"}
              </button>

            </div>

            {otpMode === "email" && (
              <button
                type="button"
                className="otp-resend-btn"
                onClick={openEmailOtp}
                disabled={otpLoading}
              >
                Resend OTP
              </button>
            )}

            {otpMode === "phone" && (
              <button
                type="button"
                className="otp-resend-btn"
                onClick={sendPhoneOtp}
                disabled={otpLoading}
              >
                Resend OTP
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;
