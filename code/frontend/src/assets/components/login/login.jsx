// LoginModal.jsx
import React, { useEffect, useState } from "react";
import "./Login.css";

function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const body = new URLSearchParams({
      username: email, // IMPORTANT FIX
      password: password,
      grant_type: "password",
    });

    const response = await fetch("http://localhost:3000/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password, grant_type: "password" }),
    });

    const data = await response.json(); // data now exists
    localStorage.setItem("access_token", data.access_token); // store it here


    if (!response.ok) {
      throw new Error("Invalid email or password");
    }


    onClose();
  } catch (err) {
    setError("Invalid email or password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">Login to CandleCodex</h2>
        <p className="modal-subtitle">
          Access AI-powered stock insights
        </p>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn analyze-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* <div className="modal-footer">
          <span>Don’t have an account?</span>
          <button className="link-btn">Sign up</button>
        </div> */}
      </div>
    </div>
  );
}

export default LoginModal;
