import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import "../css/Home.css"


function home() {
const navigate = useNavigate();

  return (
    <>
      <Header />
      {/* <Header onLoginClick={() => setShowLogin(true)} />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />} */}



      <main className="home-main">
        <div className="home-content">
          <h1 className="home-title">
            AI-Powered Stock Analysis Tool in India
          </h1>
          <p className="home-description">
            Discover CandleCodex AI, your smart companion for human-like stock insights. 
            Get detailed stock analysis and fundamental research for your favorite stocks—powered by AI, explained in simple, understandable language.
          </p>

          <div className="home-buttons">
            <button 
              className="btn analyze-btn" 
              onClick={() => navigate("/chat")}
            >
              Analyze Stock
            </button>
            <button 
              className="btn learn-btn" 
                onClick={() => {
                    const section = document.getElementById("home-aboutgap");
                    if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                    }
                }}   
            >
              Learn More
            </button>
          </div>

        {/* <div className="video sample">
        <video 
            src="/path-to-your-video.mp4" 
            controls 
            width="100%" 
            height="auto"
        >
            Your video is being loaded.
        </video>
        </div> */}

        <div className="video sample">
        <iframe width="100%" 
        height="450px" 
        src="https://www.youtube.com/embed/a5uQMwRMHcs?si=r8kM9XqhNav11mIW" 
        title="YouTube video player" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerPolicy="strict-origin-when-cross-origin" 
        allowFullScreen>
        </iframe>
        </div>


        {/* Spacer */}
        <div className="home-aboutgap" id="home-aboutgap" style={{ height: "60px" }}></div>

        {/* About CandleCodex AI Section */}
        <section className="home-about" id="home-about">
        <h2>About CandleCodex AI</h2>
        <p>
            CandleCodex AI – Humanized AI Stock Analysis Tool is designed to help investors perform 
            detailed fundamental analysis of stocks with ease. Powered by advanced AI, it provides 
            clear insights into a company’s financial performance, market trends, and key ratios—so you 
            can make informed decisions without getting lost in complex financial reports.
        </p>
        <p>
            With CandleCodex AI, you can conduct fundamental analysis, ratio analysis, balance sheet reviews, 
            quarterly performance evaluations, and more. The tool is perfect for investors, traders, analysts, 
            and stock market enthusiasts. Its intuitive interface makes it accessible for both beginners and 
            experienced investors. Note that CandleCodex AI focuses only on fundamental analysis and does not 
            provide future stock predictions.
        </p>
        <p>
            CandleCodex AI is the first AI-powered stock analysis tool in India that simplifies fundamental analysis. 
            Simply select your stock and the predefined prompt you want, and get instant insights—saving you the time 
            and effort of manually reviewing financial statements. The tool is also available on mobile apps for 
            on-the-go analysis.
        </p>
        </section>
        </div>
      </main>

      
      <Footer />
    </>
  );
}



export default home;