import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { TrendingUp, BarChart3, Brain, Zap, Shield, LineChart } from "lucide-react";

import PixelSnow from "../assets/components/background/PixelSnow";
import TradingChart from "../components/TradingChart";

export default function LandingPage() {
  const navigate = useNavigate();

  const trendingStocks = [
    { symbol: "RELIANCE", price: "₹2,345.50", change: "+1.24%", positive: true },
    { symbol: "TCS", price: "₹3,450.75", change: "-0.45%", positive: false },
    { symbol: "HDFCBANK", price: "₹1,450.20", change: "+0.89%", positive: true },
    { symbol: "INFY", price: "₹1,560.30", change: "+1.12%", positive: true },
    { symbol: "TATAMOTORS", price: "₹980.40", change: "+2.56%", positive: true },
    { symbol: "ITC", price: "₹450.10", change: "-0.15%", positive: false },
    { symbol: "SBIN", price: "₹760.80", change: "+0.95%", positive: true },
  ];

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze market patterns in real-time",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-Time Data",
      description: "Live stock quotes, charts, and market indicators updated every second",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Technical Indicators",
      description: "RSI, MACD, Moving Averages, and 50+ professional trading indicators",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Insights",
      description: "Ask questions and get immediate analysis on any stock or market trend",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Risk Assessment",
      description: "Comprehensive portfolio risk analysis and diversification recommendations",
    },
    {
      icon: <LineChart className="w-8 h-8" />,
      title: "Portfolio Tracking",
      description: "Monitor your investments with detailed performance metrics and insights",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="absolute inset-0 z-0">
        <PixelSnow
          color="#ffffff"
          flakeSize={0.01}
          minFlakeSize={1.25}
          pixelResolution={200}
          speed={1.25}
          density={0.3}
          direction={125}
          brightness={1}
          depthFade={8}
          farPlane={20}
          gamma={0.4545}
          variant="square"
        />
      </div>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-heading text-2xl font-bold tracking-tight">CANDLECODEX</div>
          <button
            data-testid="nav-login-button"
            onClick={() => navigate("/login")}
            className="btn-primary"
          >
            SIGN IN
          </button>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* <div className="absolute inset-0 hero-glow"></div> Removed in favor of global pixel snow */}
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-6xl lg:text-7xl font-black mb-6 leading-none">
                TRADE SMARTER
                <br />
                <span className="text-gradient">WITH AI</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 font-body max-w-xl">
                Professional-grade stock analysis powered by GPT-5.2. Real-time data, technical indicators, and AI-driven insights at your fingertips.
              </p>
              <button
                data-testid="hero-get-started-button"
                onClick={() => navigate("/login")}
                className="btn-primary border-glow"
              >
                GET STARTED FREE
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-card p-1 border-glow h-[300px] md:h-[400px] overflow-hidden relative bg-black/40">
                <TradingChart symbol="NSE:NIFTY" theme="dark" hideSideToolbar={true} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-4 bg-background/50 border-y border-white/10">
        <Marquee gradient={false} speed={50}>
          {[...trendingStocks, ...trendingStocks].map((stock, idx) => (
            <div key={idx} className="mx-6 flex items-center gap-4 font-mono text-sm">
              <span className="text-white font-bold">{stock.symbol}</span>
              <span className="text-muted-foreground">{stock.price}</span>
              <span className={stock.positive ? "stock-positive" : "stock-negative"}>
                {stock.change}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-5xl font-black mb-4">
              POWERFUL FEATURES
            </h2>
            <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
              Everything you need to make informed trading decisions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-8 hover:border-primary/50 transition-colors duration-300"
                data-testid={`feature-card-${idx}`}
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="font-heading text-xl font-bold mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground font-body text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card p-12 border-glow"
          >
            <h2 className="font-heading text-5xl font-black mb-6">
              START TRADING SMARTER TODAY
            </h2>
            <p className="text-muted-foreground font-body text-lg mb-8">
              Join thousands of traders using AI to make better investment decisions
            </p>
            <button
              data-testid="cta-get-started-button"
              onClick={() => navigate("/login")}
              className="btn-primary border-glow"
            >
              CREATE FREE ACCOUNT
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground font-body text-sm">
          <p>&copy; 2026 CandleCodex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}