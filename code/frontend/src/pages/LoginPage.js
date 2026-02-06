import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    full_name: "",
  });
  const [loading, setLoading] = useState(false);
  const { login, API } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // OAuth2 Password Grant - requires form data
        const params = new URLSearchParams();
        params.append('username', formData.email || formData.phone);
        params.append('password', formData.password);

        console.log("Attempting login...");
        const response = await axios.post(`${API}/token`, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        console.log("Login success, token received:", response.data);

        const token = response.data.access_token;

        // Fetch User Profile
        console.log("Fetching user profile...");
        const userResponse = await axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Profile received:", userResponse.data);

        login(token, userResponse.data);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        console.log("Attempting registration with:", {
          email: formData.email,
          mobile: formData.phone,
          // Don't log password
        });

        const response = await axios.post(`${API}/users/register`, {
          email: formData.email,
          username: formData.full_name.split(' ')[0] + Math.floor(Math.random() * 1000), // Generate username
          mobile: formData.phone || "0000000000",
          password: formData.password,
        });

        console.log("Registration success:", response.data);

        // Auto login after register
        const params = new URLSearchParams();
        params.append('username', formData.email);
        params.append('password', formData.password);

        console.log("Auto-logging in...");
        const loginRes = await axios.post(`${API}/token`, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const token = loginRes.data.access_token;
        // Fetch User Profile
        const userResponse = await axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        login(token, userResponse.data);
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="absolute inset-0 hero-glow"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 border-glow">
          <div className="text-center mb-8">
            <div className="font-heading text-2xl font-bold tracking-tight">CANDLECODEX</div>
            <p className="text-muted-foreground font-body">
              {isLogin ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-body font-medium mb-2">
                  Full Name
                </label>
                <input
                  data-testid="register-fullname-input"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-primary font-body text-sm focus:outline-none"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-body font-medium mb-2">
                Email
              </label>
              <input
                data-testid="auth-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-primary font-body text-sm focus:outline-none"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-body font-medium mb-2">
                  Phone (Optional)
                </label>
                <input
                  data-testid="register-phone-input"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-primary font-body text-sm focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-body font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  data-testid="auth-password-input"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 focus:border-primary font-body text-sm focus:outline-none"
                  required
                />
                <button
                  type="button"
                  data-testid="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              data-testid="auth-submit-button"
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? "PROCESSING..." : isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary-hover font-body text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}