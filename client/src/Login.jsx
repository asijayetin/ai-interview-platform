import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Login({ onSignupClick, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Login failed. Please try again."
        );
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save user information
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      console.log("Login successful:", data.user);

      // Go to Dashboard
      onLoginSuccess();

    } catch (error) {
      console.log("Login error:", error);

      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-showcase">
          <div className="auth-brand-lockup"><span className="auth-brand-mark">A</span><span>AI Interview Arena</span></div>
          <div className="auth-showcase-copy">
            <p className="auth-kicker">PREPARE WITH PURPOSE</p>
            <h2>Walk into your next interview with confidence.</h2>
            <p>Practice by role, get useful feedback, and keep building your skills one session at a time.</p>
            <div className="auth-benefit-list"><span><i>✓</i> Role-focused mock interviews</span><span><i>✓</i> Clear, actionable feedback</span><span><i>✓</i> Progress saved to your account</span></div>
          </div>
          <p className="auth-showcase-footer">A calmer way to prepare for what’s next.</p>
        </aside>

      <section className="auth-card">

        <h1>Welcome Back</h1>

        <p>
          Login to continue your interview practice.
        </p>

        <form onSubmit={handleLogin}>

          <label htmlFor="login-email">Email address</label>

          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            Login
          </button>

        </form>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <p className="auth-switch">Don’t have an account? <button type="button" onClick={onSignupClick}>Create an account</button></p>

      </section>
      </div>

    </div>
  );
}

export default Login;
