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

      <div className="auth-card">

        <h1>Welcome Back</h1>

        <p>
          Login to continue your interview practice.
        </p>

        <form onSubmit={handleLogin}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter password"
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

        <p className="auth-switch">
          Don't have an account?

          <span onClick={onSignupClick}>
            Sign Up
          </span>
        </p>

      </div>

    </div>
  );
}

export default Login;