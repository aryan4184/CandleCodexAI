import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Zap, Star, Shield } from "lucide-react";
import { useAuth } from "../App";
import axios from "axios";
import { toast } from "sonner";

export default function PlansPage() {
    const navigate = useNavigate();
    const { API, user, refreshUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const loadScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (planId) => {
        setLoading(true);
        console.log("Loading Razorpay SDK...");
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if (!res) {
            console.error("Razorpay SDK failed to load");
            toast.error("Razorpay SDK failed to load. Are you online?");
            setLoading(false);
            return;
        }
        console.log("Razorpay SDK loaded.");

        try {
            // 1. Create Order
            console.log("Creating order for plan:", planId);
            const { data: order } = await axios.post(`${API}/payment/create-order`, {
                plan_id: planId,
            });
            console.log("Order created successfully:", order);

            // 2. Options
            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: "CandleCodex",
                description: `Upgrade to ${planId}`,
                // image: "/logo.png", // Add logo if available
                order_id: order.order_id,
                handler: async function (response) {
                    console.log("Payment handler triggered", response);
                    try {
                        // 3. Verify
                        const verifyRes = await axios.post(`${API}/payment/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        console.log("Payment verification success:", verifyRes.data);
                        toast.success("Payment Successful! Tokens Credited.");
                        await refreshUserProfile();
                        // Redirect or reload to update balance
                        navigate("/profile");
                    } catch (error) {
                        console.error("Verification failed:", error);
                        toast.error("Payment verification failed");
                    }
                },
                prefill: {
                    name: user?.full_name,
                    email: user?.email,
                    contact: user?.mobile,
                },
                theme: {
                    color: "#3399cc",
                },
            };

            console.log("Initializing Razorpay with options:", options);
            const paymentObject = new window.Razorpay(options);

            paymentObject.on('payment.failed', function (response) {
                console.error("Payment failed:", response.error);
                toast.error(response.error.description);
            });

            paymentObject.open();
            console.log("Razorpay opened.");

        } catch (error) {
            console.error("Payment flow error:", error);
            toast.error(error.response?.data?.detail || "Something went wrong creating order");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    BACK TO DASHBOARD
                </button>

                <div className="text-center mb-16">
                    <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter mb-6">
                        CHOOSE YOUR <span className="text-gradient">EDGE</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
                        Unlock the full potential of FinAi with our premium plans. Tailored for serious traders.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* STARTER PLAN */}
                    <div className="glass-card p-8 rounded-2xl relative flex flex-col border-white/10">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <Zap size={24} className="text-blue-400" />
                            </div>
                            <h3 className="font-heading text-2xl font-bold mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black tracking-tighter">₹0</span>
                                <span className="text-muted-foreground text-sm">/month</span>
                            </div>
                        </div>
                        <div className="space-y-4 mb-8 flex-1">
                            {["100 AI Tokens", "Basic Market Analysis", "Daily News Summary", "Community Support"].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-primary shrink-0" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 px-6 rounded-lg font-bold tracking-wide transition-all bg-white/5 hover:bg-white/10 text-white border border-white/10">
                            CURRENT PLAN
                        </button>
                    </div>

                    {/* PRO PLAN */}
                    <div className="glass-card p-8 rounded-2xl relative flex flex-col border-primary/50 shadow-2xl shadow-primary/10">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest">
                            POPULAR
                        </div>
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <Star size={24} className="text-yellow-400" />
                            </div>
                            <h3 className="font-heading text-2xl font-bold mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black tracking-tighter">₹299</span>
                                <span className="text-muted-foreground text-sm">/month</span>
                            </div>
                        </div>
                        <div className="space-y-4 mb-8 flex-1">
                            {["5000 AI Tokens", "Advanced Technical Analysis", "Real-time Signals", "Priority Support", "Unlimited Watchlists"].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-primary shrink-0" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => handleUpgrade("PRO")}
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-lg font-bold tracking-wide transition-all btn-primary shadow-lg shadow-primary/25 disabled:opacity-50">
                            {loading ? "PROCESSING..." : "UPGRADE NOW"}
                        </button>
                    </div>

                    {/* ENTERPRISE PLAN */}
                    <div className="glass-card p-8 rounded-2xl relative flex flex-col border-white/10">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                <Shield size={24} className="text-purple-400" />
                            </div>
                            <h3 className="font-heading text-2xl font-bold mb-2">Enterprise</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black tracking-tighter">₹999</span>
                                <span className="text-muted-foreground text-sm">/month</span>
                            </div>
                        </div>
                        <div className="space-y-4 mb-8 flex-1">
                            {["Unlimited AI Tokens", "API Access", "Dedicated Account Manager", "Custom Integrations", "White-label Reports"].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-primary shrink-0" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                        {/* Mapping Enterprise to PREMIUM for now, or use CONTACT SALES logic */}
                        <button
                            onClick={() => handleUpgrade("PREMIUM")}
                            disabled={loading}
                            className="w-full py-4 px-6 rounded-lg font-bold tracking-wide transition-all bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-50">
                            {loading ? "PROCESSING..." : "CONTACT SALES"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
