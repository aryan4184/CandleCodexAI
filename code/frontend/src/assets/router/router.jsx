import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";


// Import your page components
import Home from "../pages/home.jsx";
import Pricing from "../pages/pricing.jsx";
import Login from "../components/login/login.jsx";
import NotFoundPage from "../pages/NotFoundPage";
import App from "../../App.jsx";
import Chat from "../pages/chat.jsx";
import Profile from "../pages/profile.jsx";


export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<App />} /> */}

        {/* Home */}
        <Route path="/home" element={<Home />} />

        {/* Pricing */}
        <Route path="/pricing" element={<Pricing />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* CHat */}
        <Route path="/chat" element={<Chat />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}