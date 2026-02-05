import "./Header.css";
import logo from "../../react.svg";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


import LoginModal from "../login/login";
import RegisterModal from "../register/register";
import { useAuth } from "../../../context/AuthContext";


export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate("/home"); // Optional: redirect to home after logout
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Left */}
        <div className="header-left">
          <Link to="/home">
            <img
              src={logo}
              alt="Logo"
              className="logo"
              style={{ cursor: "pointer" }}
            />
          </Link>
        </div>

        {/* Right */}
        <div className="header-right">
          <Link to="/chat" className="nav-link">
            CandleCodex AI
          </Link>

          <Link to="/pricing" className="price-link">
            View Price
          </Link>

          {/* AUTH BUTTONS */}
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  setShowLogin(true);
                  setShowRegister(false);
                }}
              >
                Login
              </button>

              <button
                onClick={() => {
                  setShowRegister(true);
                  setShowLogin(false);
                }}
              >
                Create Account
              </button>
            </>
          ) : (
            <div className="auth-actions">
              <button
                className="profile-btn"
                onClick={() => navigate("/profile")}
              >
                View Profile
              </button>

              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

          )}

          {/* MODALS */}
          {showLogin && (
            <LoginModal
              onClose={() => setShowLogin(false)}
            />
          )}

          {showRegister && (
            <RegisterModal onClose={() => setShowRegister(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
