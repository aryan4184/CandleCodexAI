import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/header";
import "../css/Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login"); // redirect if no token
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch("https://wn6m9r6j-3000.inc1.devtunnels.ms/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            navigate("/login"); // token expired or invalid
          }
          throw new Error("Failed to fetch user data");
        }

        const data = await res.json();
        setUser(data); // save user data
      } catch (err) {
        console.error(err);
        setError("Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <Header />
      <main className="profile-main">
        <h1 className="profile-title">My Account</h1>
        {user && (
          <div className="profile-container">
            <section className="profile-card">
              <h2>Profile Details</h2>
              <div className="profile-row">
                <span>Token Balance</span>
                <span>{user.token_balance}</span>
              </div>
              <div className="profile-row">
                <span>Username</span>
                <span>{user.username}</span>
              </div>
              <div className="profile-row">
                <span>Email</span>
                <span>{user.email}</span>
              </div>
              <div className="profile-row">
                <span>Mobile</span>
                <span>{user.mobile}</span>
              </div>
              <div className="profile-row">
                <span>Active</span>
                <span>{user.is_active ? "Yes" : "No"}</span>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

export default Profile;
