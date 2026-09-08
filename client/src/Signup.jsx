import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Signup({ onLoginClick }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // Check API URL
    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    // Check password
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
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

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Signup failed. Please try again."
        );
        return;
      }

      setMessage(
        "Signup successful! You can now login."
      );

      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.log("Signup error:", error);

      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Create Account</h1>

        <p>
          Create your account to start practicing interviews.
        </p>

        <form onSubmit={handleSignup}>

          <label>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            required
          />

          <button type="submit">
            Create Account
          </button>

        </form>

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