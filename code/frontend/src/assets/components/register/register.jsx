// RegisterModal.jsx
import React, { useEffect, useState } from "react";
import "./Register.css"; // reuse the same modal CSS

function RegisterModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        // Send data to FastAPI register endpoint
        const response = await fetch("https://wn6m9r6j-3000.inc1.devtunnels.ms/users/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: form.email,
            password: form.password,
            // Optional: if your backend supports extra fields like name/phone
            username: form.name,
            mobile: form.phone,
        }),
        });

        if (!response.ok) {
        // Extract backend error message if available
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Registration failed");
        }

        const data = await response.json();

        // Save token to localStorage (optional)
        localStorage.setItem("access_token", data.access_token);

        // Close modal
        onClose();
    } catch (err) {
        setError(err.message || "Registration failed. Please try again.");
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

        <h2 className="modal-title">Create CandleCodex Account</h2>
        <p className="modal-subtitle">
          Start your AI-powered stock analysis journey
        </p>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn analyze-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;
