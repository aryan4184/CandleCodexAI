import React, { useEffect, useRef, memo } from "react";

function TradingChart({ symbol, theme = "dark", hideSideToolbar = false, interval = "D", timeframe = "5D" }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear previous content
        container.innerHTML = "";

        // Create container div for the widget
        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";
        widgetContainer.style.height = "100%";
        widgetContainer.style.width = "100%";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: symbol,
            interval: interval,
            timeframe: timeframe,
            timezone: "Asia/Kolkata",
            theme: theme,
            style: "1",
            locale: "en",
            enable_publishing: false,
            allow_symbol_change: true,
            hide_top_toolbar: false,
            hide_side_toolbar: hideSideToolbar,
            save_image: false,
            studies: [],
            currency: "INR",
            support_host: "https://www.tradingview.com"
        });

        container.appendChild(widgetContainer);
        widgetContainer.appendChild(script);

        // Cleanup function
        return () => {
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [symbol, theme]);

    return (
        <div
            ref={containerRef}
            className="tradingview-widget-container"
            style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}
        />
    );
}

export default memo(TradingChart);
