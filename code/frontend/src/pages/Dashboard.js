import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  User,
  LogOut,
  Search,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import TradingChart from "../components/TradingChart";

export default function Dashboard() {
  const { user, logout, API } = useAuth();
  const navigate = useNavigate();
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartSymbol, setChartSymbol] = useState("BINANCE:BTCUSDT");

  const fetchTradingPreferences = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/trading/preferences`);
      if (res.data.symbol) {
        setChartSymbol(res.data.symbol);
      }
    } catch (error) {
      console.error("Failed to load chart prefs", error);
    }
  }, [API]);

  const fetchTrendingStocks = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/stocks/trending`);
      setTrendingStocks(response.data);
    } catch (error) {
      console.error("Error fetching trending stocks:", error);
    }
  }, [API]);

  useEffect(() => {
    fetchTrendingStocks();
    fetchTradingPreferences();
  }, [fetchTrendingStocks, fetchTradingPreferences]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchSymbol) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API}/stocks/quote/${searchSymbol.toUpperCase()}`);
      setStockData(response.data);

      // Update Chart and Save Preference
      const newSymbol = searchSymbol.toUpperCase();
      setChartSymbol(newSymbol);
      axios.post(`${API}/trading/preferences`, { symbol: newSymbol });

      toast.success(`Loaded ${searchSymbol.toUpperCase()}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Stock not found");
    } finally {
      setLoading(false);
    }
  };

  const mockChartData = [
    { time: "9:30", price: 180 },
    { time: "10:00", price: 182 },
    { time: "10:30", price: 181 },
    { time: "11:00", price: 185 },
    { time: "11:30", price: 183 },
    { time: "12:00", price: 187 },
    { time: "12:30", price: 189 },
    { time: "13:00", price: 188 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-heading text-2xl font-bold tracking-tight">CANDLECODEX</div>
          <div className="flex items-center gap-4">
            <button
              data-testid="nav-chat-button"
              onClick={() => navigate("/chat")}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            >
              <MessageSquare size={20} />
              <span className="font-body text-sm">AI Chat</span>
            </button>
            <button
              data-testid="nav-profile-button"
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            >
              <User size={20} />
              <span className="font-body text-sm">Profile</span>
            </button>
            <button
              data-testid="nav-logout-button"
              onClick={() => {
                logout();
                navigate("/");
                toast.success("Logged out successfully");
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="font-body text-sm">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="font-heading text-4xl font-black tracking-tighter mb-2">
              DASHBOARD
            </h1>
            <p className="text-muted-foreground font-body">Welcome back, {user?.full_name}</p>
          </div>

          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <input
                  data-testid="stock-search-input"
                  type="text"
                  placeholder="Search stock symbol (e.g., AAPL, TSLA)"
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 focus:border-primary font-mono text-sm focus:outline-none"
                />
              </div>
              <button
                data-testid="stock-search-button"
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? "SEARCHING..." : "SEARCH"}
              </button>
            </form>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 glass-card p-6">
              <h2 className="font-heading text-2xl font-bold tracking-tight mb-4">
                {stockData ? stockData.symbol : "STOCK CHART"}
              </h2>
              {stockData && (
                <div className="mb-4 flex items-center gap-6 font-mono" data-testid="stock-data-display">
                  <div>
                    <div className="text-3xl font-bold">₹{stockData.price}</div>
                    <div
                      className={`text-sm ${parseFloat(stockData.change) >= 0 ? "stock-positive" : "stock-negative"
                        }`}
                    >
                      {stockData.change} ({stockData.change_percent})
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Volume: {parseInt(stockData.volume).toLocaleString()}</div>
                    <div>Last: {stockData.timestamp}</div>
                  </div>
                </div>
              )}


              <div className="h-[400px] w-full bg-black/50 rounded-lg border border-white/5 relative">
                <TradingChart key={chartSymbol} symbol={chartSymbol} theme="dark" />
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-heading text-xl font-bold tracking-tight mb-4">TRENDING</h2>
              <div className="space-y-4" data-testid="trending-stocks-list">
                {trendingStocks.length > 0 ? (
                  trendingStocks.map((stock, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-black/30 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={async () => {
                        setSearchSymbol(stock.symbol);
                        setLoading(true);
                        try {
                          const response = await axios.get(`${API}/stocks/quote/${stock.symbol}`);
                          setStockData(response.data);
                          toast.success(`Loaded ${stock.symbol}`);
                        } catch (error) {
                          toast.error(error.response?.data?.detail || "Stock not found");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      data-testid={`trending-stock-${idx}`}
                    >
                      <div>
                        <div className="font-mono font-bold text-sm">{stock.symbol}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          ₹{parseFloat(stock.price).toFixed(2)}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 font-mono text-sm ${parseFloat(stock.change_percent) >= 0
                          ? "stock-positive"
                          : "stock-negative"
                          }`}
                      >
                        {parseFloat(stock.change_percent) >= 0 ? (
                          <TrendingUp size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                        {stock.change_percent}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground font-body text-sm py-8">
                    Loading trending stocks...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-heading text-xl font-bold tracking-tight mb-4">QUICK ACTIONS</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                data-testid="open-ai-chat-button"
                onClick={() => navigate("/chat")}
                className="p-6 bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-left"
              >
                <MessageSquare className="mb-2 text-primary" size={24} />
                <div className="font-heading font-bold text-lg">AI ANALYSIS</div>
                <div className="text-sm text-muted-foreground font-body">
                  Chat with AI for stock insights
                </div>
              </button>
              <button
                data-testid="view-profile-button"
                onClick={() => navigate("/profile")}
                className="p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
              >
                <User className="mb-2 text-muted-foreground" size={24} />
                <div className="font-heading font-bold text-lg">YOUR PROFILE</div>
                <div className="text-sm text-muted-foreground font-body">
                  Manage account settings
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div >
    </div >
  );
}