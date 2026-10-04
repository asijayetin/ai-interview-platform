import { useState } from "react";
import GoogleSignInButton from "./GoogleSignInButton";

const API_URL = import.meta.env.VITE_API_URL;

function Signup({ onLoginClick, onLoginSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleCredential = async (credential) => {
    setError("");
    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    setGoogleLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Google sign-in failed. Please try again.");
        return;
      }

      localStorage.removeItem("studyPlanLanguage");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLoginSuccess?.();
    } catch (requestError) {
      console.error("Google signup error:", requestError);
      setError("Could not connect to the server. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Signup failed. Please try again.");
        return;
      }

      setSignupSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      console.error("Signup error:", requestError);
      setError(`Connection error: ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-showcase">
          <div className="auth-brand-lockup"><span className="auth-brand-mark">A</span><span>AI Interview Arena</span></div>
          <div className="auth-showcase-copy">
            <p className="auth-kicker">YOUR CAREER, YOUR NEXT MOVE</p>
            <h2>Build skills that show up in the interview.</h2>
            <p>Create an account to practice interviews and get structured feedback for your target role.</p>
            <div className="auth-benefit-list"><span><i>✓</i> Start with a mock interview</span><span><i>✓</i> Review your resume against a role</span><span><i>✓</i> See your practice history</span></div>
          </div>
          <p className="auth-showcase-footer">Small, focused practice adds up.</p>
        </aside>
      <section className="auth-card">
        <h1>Create Account</h1>
        <p>Create your account to start practicing interviews.</p>

        <form onSubmit={handleSignup}>
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="signup-confirm-password">Confirm Password</label>
          <input
            id="signup-confirm-password"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-divider"><span>or continue with</span></div>
        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={googleLoading || loading} />

        {error && <p className="error-message">{error}</p>}

        <p className="auth-switch">Already have an account? <button type="button" onClick={onLoginClick}>Sign in</button></p>
      </section>
      </div>

      {signupSuccess && (
        <div className="signup-success-backdrop">
          <section
            className="signup-success-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-success-title"
            aria-describedby="signup-success-description"
          >
            <div className="signup-success-icon" aria-hidden="true">✓</div>
            <p className="auth-kicker">ACCOUNT READY</p>
            <h2 id="signup-success-title">Account created</h2>
            <p id="signup-success-description">Your account is ready. Continue to login to start practicing.</p>
            <div className="signup-success-actions">
              <button type="button" onClick={onLoginClick}>Continue to login</button>
              <button type="button" className="signup-success-secondary" onClick={() => setSignupSuccess(false)}>Stay here</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Signup;
