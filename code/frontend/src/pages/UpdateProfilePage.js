import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function UpdateProfilePage() {
    const { user, API } = useAuth();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Note: This endpoint is currently 404 on the backend.
            await axios.put(`${API}/auth/profile?full_name=${encodeURIComponent(fullName)}`);
            toast.success("Profile updated successfully");
            navigate("/profile");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <nav className="glass-card border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        data-testid="back-button"
                        onClick={() => navigate("/profile")}
                        className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={24} />
                        <span className="font-body text-sm">Back to Profile</span>
                    </button>
                    <div className="font-heading text-2xl font-bold tracking-tight">UPDATE PROFILE</div>
                    <div className="w-8"></div> {/* Spacer for centering if needed, or empty */}
                </div>
            </nav>

            <div className="max-w-xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="glass-card p-8">
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-body font-medium mb-2">Full Name</label>
                                <input
                                    data-testid="update-fullname-input"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-primary font-body text-sm focus:outline-none"
                                    required
                                />
                            </div>

                            <button
                                data-testid="save-profile-button"
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                {loading ? "SAVING..." : "SAVE CHANGES"}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
