import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Signup({ onLoginClick, onLoginSuccess }) {
  const [mode, setMode] = useState("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [phoneUserId, setPhoneUserId] = useState("");

  const [phoneStep, setPhoneStep] = useState("phone");
  const [timer, setTimer] = useState(0);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const otpRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const resetMessages = () => {
    setMessage("");
    setError("");
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetMessages();

    if (newMode === "email") {
      setPhoneStep("phone");
      setOtp(["", "", "", "", "", ""]);
      setPhoneUserId("");
      setTimer(0);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      console.log("API_URL:", API_URL);
      console.log(
        "Signup URL:",
        `${API_URL}/api/auth/signup`
      );

      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      console.log("Response received:", response.status);

      const data = await response.json();

      console.log("Response data:", data);

      if (!response.ok) {
        setError(
          data.message || "Signup failed. Please try again."
        );
        return;
      }

      setMessage(
        "Signup successful! You can now login."
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.log("Signup error:", error);

      setError(
        `Connection error: ${error.message}`
      );
    }
  };

  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();

    resetMessages();

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    const fullPhone = `+91${cleanPhone}`;

    try {
      const response = await fetch(
        `${API_URL}/api/auth/phone-signup`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            phone: fullPhone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to send OTP. Please try again."
        );
        return;
      }

      setPhoneUserId(data.userId || "");
      setPhoneStep("otp");
      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setMessage(
        "OTP sent successfully to your phone."
      );

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);

    } catch (error) {
      console.log("Phone signup error:", error);

      setError(
        `Connection error: ${error.message}`
      );
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const updatedOtp = [...otp];
    updatedOtp[index] = digit;
    setOtp(updatedOtp);
    setError("");
    setMessage("");

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) {
      return;
    }

    const updatedOtp = ["", "", "", "", "", ""];

    pasted.split("").forEach((digit, index) => {
      updatedOtp[index] = digit;
    });

    setOtp(updatedOtp);
    setError("");
    setMessage("");

    const nextIndex = Math.min(pasted.length, 5);

    setTimeout(() => {
      otpRefs.current[nextIndex]?.focus();
    }, 50);
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();

    resetMessages();

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!phoneUserId) {
      setError("Signup session expired. Please request a new OTP.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = `+91${cleanPhone}`;

    try {
      const response = await fetch(
        `${API_URL}/api/auth/phone-signup-verify`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: phoneUserId,
            phone: fullPhone,
            otp: enteredOtp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Invalid OTP. Please try again."
        );
        return;
      }

      localStorage.setItem("token", data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setMessage(
        "Phone verified successfully! Welcome to AI Interview Arena."
      );

      setPhoneStep("success");

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      }, 900);

    } catch (error) {
      console.log(
        "Phone verification error:",
        error
      );

      setError(
        `Connection error: ${error.message}`
      );
    }
  };

  const handleResendPhoneOtp = async () => {
    if (timer > 0) {
      return;
    }

    await handleSendPhoneOtp({
      preventDefault: () => {},
    });
  };

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Create Account</h1>

        <p>
          Create your account to start practicing interviews.
        </p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "22px",
          }}
        >
          <button
            type="button"
            onClick={() => switchMode("email")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: "600",
              background:
                mode === "email"
                  ? "#111827"
                  : "#f3f4f6",
              color:
                mode === "email"
                  ? "white"
                  : "#374151",
            }}
          >
            Email
          </button>

          <button
            type="button"
            onClick={() => switchMode("phone")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: "600",
              background:
                mode === "phone"
                  ? "#111827"
                  : "#f3f4f6",
              color:
                mode === "phone"
                  ? "white"
                  : "#374151",
            }}
          >
            📱 Phone
          </button>
        </div>

        {mode === "email" && (
          <form onSubmit={handleSignup}>

            <label>Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              required
            />

            <button type="submit">
              Create Account
            </button>

          </form>
        )}

        {mode === "phone" &&
          phoneStep === "phone" && (
            <form onSubmit={handleSendPhoneOtp}>

              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />

              <label>Phone Number</label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "#f9fafb",
                    fontWeight: "600",
                  }}
                >
                  🇮🇳 +91
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  required
                  style={{
                    flex: 1,
                  }}
                />
              </div>

              <button type="submit">
                Send OTP
              </button>

            </form>
          )}

        {mode === "phone" &&
          phoneStep === "otp" && (
            <form onSubmit={handleVerifyPhone}>

              <div
                style={{
                  textAlign: "center",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    fontSize: "42px",
                    marginBottom: "8px",
                  }}
                >
                  📱
                </div>

                <h3
                  style={{
                    margin: "0 0 6px",
                  }}
                >
                  Verify your phone
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#6b7280",
                  }}
                >
                  We sent a 6-digit OTP to
                </p>

                <strong>
                  +91 {phone}
                </strong>
              </div>

              <label>Verification Code</label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  margin: "14px 0 20px",
                }}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] =
                        element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(
                        index,
                        e.target.value
                      )
                    }
                    onKeyDown={(e) =>
                      handleOtpKeyDown(
                        index,
                        e
                      )
                    }
                    onPaste={handleOtpPaste}
                    style={{
                      width: "42px",
                      height: "48px",
                      textAlign: "center",
                      fontSize: "20px",
                      fontWeight: "700",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                    }}
                    required
                  />
                ))}
              </div>

              <button type="submit">
                Verify Phone
              </button>

              <div
                style={{
                  textAlign: "center",
                  marginTop: "14px",
                }}
              >
                {timer > 0 ? (
                  <span
                    style={{
                      color: "#6b7280",
                    }}
                  >
                    Resend OTP in {formatTimer()}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendPhoneOtp}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhoneStep("phone");
                  setOtp([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                  ]);
                  resetMessages();
                }}
                style={{
                  marginTop: "10px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ← Change phone number
              </button>

            </form>
          )}

        {mode === "phone" &&
          phoneStep === "success" && (
            <div
              style={{
                textAlign: "center",
                padding: "25px 10px",
              }}
            >
              <div
                style={{
                  fontSize: "60px",
                  marginBottom: "10px",
                }}
              >
                ✓
              </div>

              <h2
                style={{
                  marginBottom: "8px",
                }}
              >
                Phone Verified!
              </h2>

              <p>
                Your account has been created successfully.
              </p>
            </div>
          )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

        <p className="auth-switch">
          Already have an account?

          <span onClick={onLoginClick}>
            Login
          </span>
        </p>

      </div>

    </div>
  );
}

export default Signup;
