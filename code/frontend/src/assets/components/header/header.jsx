import "./Header.css";
import logo from "../../react.svg";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


import LoginModal from "../login/login";
import RegisterModal from "../register/register";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  // Check token on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
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
              onLoginSuccess={() => setIsAuthenticated(true)}
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
