import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';

export default function StockChart({ symbol }) {
    const { API } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showFallback, setShowFallback] = useState(false);

    // We use a ref to track if the script is added
    const scriptAddedRef = useRef(false);

    useEffect(() => {
        console.log("StockChart rendering for symbol:", symbol);
        const fetchData = async () => {
            if (!symbol) return;

            setLoading(true);
            setError(null);
            setShowFallback(false);

            try {
                // Use default API if auth context not ready
                const baseUrl = API;
                const response = await axios.get(`${baseUrl}/stocks/history?symbol=${encodeURIComponent(symbol)}&period=1mo&interval=1d`);

                // Check for empty data
                if (response.data && ((Array.isArray(response.data.data) && response.data.data.length > 0) || (Array.isArray(response.data) && response.data.length > 0))) {
                    const chartData = Array.isArray(response.data.data) ? response.data.data : response.data;
                    setData(chartData);
                } else {
                    // Empty data -> Fallback
                    console.warn("StockChart: No data received, switching to fallback.");
                    setShowFallback(true);
                }
            } catch (err) {
                console.error("StockChart Error:", err);
                // Switch to fallback on error
                setShowFallback(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol, API]);

    // Effect to load TradingView script and init widget when fallback is active
    useEffect(() => {
        if (showFallback && symbol) {
            let tvSymbol = symbol;
            // Robust symbol normalization
            if (tvSymbol.includes("NSE:")) {
                tvSymbol = `NSE:${tvSymbol.replace("NSE:", "").replace(/\.NS$/, "")}`;
            } else if (tvSymbol.includes("BSE:")) {
                tvSymbol = `BSE:${tvSymbol.replace("BSE:", "").replace(/\.BO$/, "")}`;
            } else if (tvSymbol.includes(".NS")) {
                tvSymbol = `NSE:${tvSymbol.replace(/\.NS$/, "")}`;
            } else if (tvSymbol.includes(".BO")) {
                tvSymbol = `BSE:${tvSymbol.replace(/\.BO$/, "")}`;
            } else if (!tvSymbol.includes(":")) {
                tvSymbol = `NSE:${tvSymbol}`;
            }

            const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;

            const initWidget = () => {
                try {
                    if (window.TradingView && document.getElementById(containerId)) {
                        // Clear previous content if any (though React handles structure)
                        document.getElementById(containerId).innerHTML = "";

                        new window.TradingView.widget({
                            "width": "100%",
                            "height": 400,
                            "symbol": tvSymbol,
                            "interval": "D",
                            "timezone": "Asia/Kolkata",
                            "theme": "dark",
                            "style": "1",
                            "locale": "en",
                            "toolbar_bg": "#f1f3f6",
                            "enable_publishing": false,
                            "hide_side_toolbar": true,
                            "allow_symbol_change": true,
                            "details": false,
                            "hotlist": false,
                            "calendar": false,
                            "container_id": containerId
                        });
                    }
                } catch (e) {
                    console.error("TwadingView Widget Init Error:", e);
                }
            };

            if (!window.TradingView) {
                if (!document.getElementById('tradingview-widget-script')) {
                    const script = document.createElement('script');
                    script.id = 'tradingview-widget-script';
                    script.src = 'https://s3.tradingview.com/tv.js';
                    script.async = true;
                    // script.crossOrigin = "anonymous"; // Removed as it can cause "Script error" with opaque responses
                    script.onload = () => {
                        console.log("TradingView script loaded successfully");
                        initWidget();
                    };
                    script.onerror = (e) => {
                        console.error("Failed to load TradingView script", e);
                        setError("Failed to load chart library");
                    };
                    document.head.appendChild(script);
                } else {
                    // Script exists but maybe not loaded yet?
                    const existingScript = document.getElementById('tradingview-widget-script');
                    existingScript.addEventListener('load', initWidget);
                    // If already loaded:
                    if (window.TradingView) initWidget();
                }
            } else {
                initWidget();
            }
        }
    }, [showFallback, symbol]);


    if (loading) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center bg-black/20 rounded-lg border border-white/10">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    }

    if (showFallback) {
        const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return (
            <div className="w-full h-[400px] rounded-lg overflow-hidden border border-white/10 bg-black/20">
                <div id={containerId} className="w-full h-full" />
            </div>
        );
    }

    // Existing Recharts data processing for rendering
    if (error || !data.length) {
        return null;
    }

    // Standard Recharts Render (Hidden in fallback mode, but kept for native behavior)
    const minPrice = Math.min(...data.map(d => d.low));
    const maxPrice = Math.max(...data.map(d => d.high));
    const padding = (maxPrice - minPrice) * 0.1;

    return (
        <div className="w-full h-[400px] bg-black/40 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4 px-2">
                <div>
                    <h3 className="text-lg font-bold text-white">{symbol.replace("NSE:", "").replace("BSE:", "")}</h3>
                    <p className="text-xs text-muted-foreground">1 Month Performance • Daily Interval</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-mono text-primary">₹{data[data.length - 1]?.price}</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                        }}
                    />
                    <YAxis
                        domain={[minPrice - padding, maxPrice + padding]}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val}`}
                        width={50}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                        formatter={(value) => [`₹${value}`, "Price"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
