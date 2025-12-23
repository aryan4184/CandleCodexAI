import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css"
import logo from "../../react.svg";


export default function Footer() {
  return (
        <footer className="footer">
        <div className="footer-container">
            <div className="footer-left">
            <Link to="/home"><img src={logo} alt="Logo" className="logo" /></Link>
            <p>CandelCodex AI helps you analyze markets and visualize trends in real-time.</p>
            </div>

            <div className="footer-links">
            <div>
                <h4>Product</h4>
                <ul>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/integrations">Integrations</Link></li>
                </ul>
            </div>
            <div>
                <h4>Company</h4>
                <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                </ul>
            </div>
            </div>

            <div className="footer-social">
            <h4>Follow Us</h4>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
        </div>

        <div className="footer-bottom">
            &copy; {new Date().getFullYear()} CandelCodex AI. All rights reserved.
        </div>
        </footer>

  );
}
