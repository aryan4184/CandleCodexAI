// LoginModal.jsx
import React, { useEffect, useState } from "react";
import "./Login.css";

function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");

  const [loginMode, setLoginMode] = useState("password"); 
  const [otpSent, setOtpSent] = useState(false);

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

  useEffect(() => {
  /* global google */
  if (window.google) {
    google.accounts.id.initialize({
      client_id: "YOUR_GOOGLE_CLIENT_ID", // replace with your actual client ID
      callback: handleGoogleResponse,     // function to handle the token
    });

    // Render the button inside a container div
    google.accounts.id.renderButton(
      document.getElementById("google-login-btn"),
      { theme: "outline", size: "large", width: "250" }
    );
  }
}, []);


  // ---------------- PASSWORD LOGIN ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://wn6m9r6j-3000.inc1.devtunnels.ms/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email,
          password,
          grant_type: "password",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error();

      localStorage.setItem("access_token", data.access_token);
      onClose();
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SEND OTP ----------------
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://wn6m9r6j-3000.inc1.devtunnels.ms/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      if (!response.ok) throw new Error();

      setOtpSent(true); // ✅ switch screen
    } catch {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- VERIFY OTP ----------------
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://wn6m9r6j-3000.inc1.devtunnels.ms/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error();

      localStorage.setItem("access_token", data.access_token);
      onClose();
    } catch {
      setError("Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // Google login
const handleGoogleResponse = async (response) => {
  setLoading(true);
  setError("");

  try {
    const res = await fetch("https://wn6m9r6j-3000.inc1.devtunnels.ms/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error();

    localStorage.setItem("access_token", data.access_token);
    onClose();
  } catch (err) {
    console.error("Google login failed", err);
    setError("Google login failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2 className="modal-title">Login to CandleCodex</h2>

        {error && <div className="modal-error">{error}</div>}

        {/* PASSWORD LOGIN */}
        {loginMode === "password" && (
          <>
            <p className="modal-subtitle">Access AI-powered stock insights</p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button className="btn analyze-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="divider">OR</div>

            <button className="btn otp-btn" onClick={() => setLoginMode("otp")}>
              Login with OTP
            </button>

              {/* Google button will render here */}
            <div id="google-login-btn"></div>
          </>
        )}

        {/* OTP REQUEST */}
        {loginMode === "otp" && !otpSent && (
          <>
            <p className="modal-subtitle">
              Enter your email or mobile number
            </p>

            <form onSubmit={handleSendOTP}>
              <input
                type="text"
                placeholder="Email or mobile"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />

              <button className="btn analyze-btn" disabled={loading}>
                {loading ? "Sending OTP..." : "Get OTP"}
              </button>
            </form>

            <button className="link-btn" onClick={() => setLoginMode("password")}>
              ← Back to login
            </button>
          </>
        )}

        {/* OTP VERIFY */}
        {loginMode === "otp" && otpSent && (
          <>
            <p className="modal-subtitle">
              Enter the OTP sent to {identifier}
            </p>

            <form onSubmit={handleVerifyOTP}>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <button className="btn analyze-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <button
              className="link-btn"
              onClick={() => setOtpSent(false)}
            >
              Resend OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginModal;
