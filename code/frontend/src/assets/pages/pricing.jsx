import React from "react";
import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import "../css/Pricing.css";
import axios from "axios";

function Pricing() {
  const userToken = localStorage.getItem("access_token");

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };


  const handlePayment = async (planId) => {
    if (!userToken) {
      alert("Please login first");
      return;
    }

    try {
      /* Create order on BACKEND (FastAPI) */
      const orderRes = await axios.post(
        `http://localhost:3000/create-order`,
        { plan_id: planId },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      // backend returns these keys
      const { order_id, amount, currency } = orderRes.data;

      /* Open Razorpay Checkout */
      const options = {
        key: "rzp_test_Rv2vXfYnZnPLTu", // Vite-safe
        amount,
        currency,
        name: "CandleCodex AI",
        description: `Plan: ${planId}`,
        order_id,

        handler: async function (response) {
          try {
            /* 3️⃣ Verify payment on BACKEND */
            const verifyRes = await axios.post(
              `http://localhost:3000/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${userToken}`,
                },
              }
            );

            alert(
              `Payment successful!\nTokens credited: ${verifyRes.data.tokens_credited}\nCurrent balance: ${verifyRes.data.current_balance}`
            );
          } catch (err) {
            console.error(err);
            alert("Payment verification failed");
          }
        },

        prefill: {
          // email: "user@example.com",
        },

        theme: {
          color: "#3399cc",
        },
      };


      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Check your internet connection.");
        return;
      }


      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Failed to create payment order");
    }
  };

  return (
    <>
      <Header />

      <main className="pricing-main">
        <h1 className="pricing-title">Simple & Transparent Pricing</h1>
        <p className="pricing-subtitle">
          Choose a plan that fits your investing journey with CandleCodex AI
        </p>

        <div className="pricing-cards">
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
            <button
              className="btn analyze-btn"
              onClick={() => handlePayment("PRO")}
            >
              Upgrade Now
            </button>
          </div>

          <div className="pricing-card">
            <h2>Premium+</h2>
            <p className="price">₹999 / month</p>
            <ul>
              <li>Everything in Pro</li>
              <li>Priority AI access</li>
              <li>Dedicated support</li>
              <li>Early feature access</li>
            </ul>
            <button
              className="btn learn-btn"
              onClick={() => handlePayment("PREMIUM")}
            >
              Go Premium
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Pricing;
