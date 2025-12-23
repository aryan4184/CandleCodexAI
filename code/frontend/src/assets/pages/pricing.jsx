import React from "react";
import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import "../css/Pricing.css";

function Pricing() {
  return (
    <>
      <Header />

      <main className="pricing-main">
        <h1 className="pricing-title">Simple & Transparent Pricing</h1>
        <p className="pricing-subtitle">
          Choose a plan that fits your investing journey with CandleCodex AI
        </p>

        <div className="pricing-cards">
          {/* Free Plan */}
          <div className="pricing-card">
            <h2>Free</h2>
            <p className="price">₹0</p>
            <ul>
              <li>Limited AI stock queries</li>
              <li>Basic fundamental analysis</li>
              <li>Community support</li>
            </ul>
            <button className="btn learn-btn">Get Started</button>
          </div>

          {/* Pro Plan */}
          <div className="pricing-card featured">
            <span className="badge">Most Popular</span>
            <h2>Pro</h2>
            <p className="price">₹499 / month</p>
            <ul>
              <li>Unlimited AI queries</li>
              <li>Advanced fundamental insights</li>
              <li>Faster AI responses</li>
              <li>Email support</li>
            </ul>
            <button className="btn analyze-btn">Upgrade Now</button>
          </div>

          {/* Premium Plan */}
          <div className="pricing-card">
            <h2>Premium+</h2>
            <p className="price">₹999 / month</p>
            <ul>
              <li>Everything in Pro</li>
              <li>Priority AI access</li>
              <li>Dedicated support</li>
              <li>Early feature access</li>
            </ul>
            <button className="btn learn-btn">Go Premium</button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Pricing;
