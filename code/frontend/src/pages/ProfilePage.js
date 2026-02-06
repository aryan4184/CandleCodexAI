import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Phone, Calendar, Save, LogOut, Coins } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, API, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  // We are using a dedicated update page now, so this function might not be used directly here
  // except if we wanted to revert to inline editing.
  // Keeping it for reference or future use if needed, but the UI uses the navigate button.
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API}/auth/profile?full_name=${encodeURIComponent(fullName)}`);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              data-testid="back-button"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="font-heading text-2xl font-bold tracking-tight">PROFILE</div>
          </div>
          <button
            data-testid="profile-page-logout-button"
            onClick={(e) => {
              e.preventDefault();
              logout();
              navigate("/");
              toast.success("Logged out successfully");
            }}
            className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
          >
            <LogOut size={20} />
            <span className="font-body text-sm hidden md:inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="glass-card p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 bg-primary/20 border-2 border-primary flex items-center justify-center">
                <User size={40} className="text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-black tracking-tighter">
                  {user?.full_name}
                </h1>
                <p className="text-muted-foreground font-body text-sm">@{user?.username}</p>
              </div>
            </div>

            <div className="space-y-4" data-testid="profile-info">
              <div className="flex items-center gap-3 p-4 bg-black/30 border border-white/5">
                <Mail size={20} className="text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground font-body mb-1">Email</div>
                  <div className="font-body">{user?.email}</div>
                </div>
              </div>

              {user?.mobile && (
                <div className="flex items-center gap-3 p-4 bg-black/30 border border-white/5">
                  <Phone size={20} className="text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground font-body mb-1">Contact Info</div>
                    <div className="font-body">{user.mobile}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-black/30 border border-white/5">
                <Coins size={20} className="text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground font-body mb-1">Available Tokens</div>
                  <div className="font-body text-primary font-bold">{user?.token_balance}</div>
                </div>
              </div>

              {/* Upgrade Plan Button */}
              <button
                onClick={() => navigate("/plans")}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase py-4 mt-2 rounded-lg transition-colors shadow-lg shadow-yellow-500/20"
              >
                UPGRADE PLAN
              </button>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="font-heading text-2xl font-bold tracking-tight mb-6">UPDATE PROFILE</h2>
            <div className="space-y-6">
              <p className="text-muted-foreground font-body text-sm">
                Want to change your profile details?
              </p>
              <button
                data-testid="go-to-update-profile-button"
                onClick={() => navigate("/update-profile")}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Save size={16} />
                EDIT PROFILE
              </button>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="font-heading text-2xl font-bold tracking-tight mb-4 text-destructive">
              DANGER ZONE
            </h2>
            <p className="text-muted-foreground font-body text-sm mb-6">
              Once you logout, you'll need to sign in again to access your account.
            </p>
            <button
              data-testid="profile-logout-button"
              onClick={() => {
                logout();
                navigate("/");
                toast.success("Logged out successfully");
              }}
              className="bg-destructive text-white uppercase tracking-widest font-bold text-xs px-6 py-3 hover:bg-destructive/90 transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}