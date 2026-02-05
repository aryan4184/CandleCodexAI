import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ADDED: redirect if not logged in
import api from "../../api/axios"; // Import centralized API client
import { useAuth } from "../../context/AuthContext";

import Header from "../components/header/header";
import "../css/Chat.css";

function Chat() {
  const navigate = useNavigate(); // ADDED: navigation handler
  const { token, isAuthenticated } = useAuth();


  // CHANGED: messages now come from real API responses
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hi! I’m CandleCodex AI. Ask me anything about stock fundamentals, ratios, or company performance."
    }
  ]);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false); // ADDED: loading state
  const messagesEndRef = useRef(null);

  // ADDED: protect chat page (only logged-in users)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/home"); // redirect if not authenticated
    }
  }, [isAuthenticated, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // CHANGED: send prompt to backend /chat API
  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    if (!token) {
      navigate("/home");
      return;
    }

    const userMessage = { role: "user", content: prompt };

    // ADDED: show user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      // ADDED: call backend /chat API
      const response = await api.post("/chat", {
        content: userMessage.content,
        conversation_id: null
      });

      // if (!response.ok) { ... } -> axios throws on error, handled in catch block except specific logic needed below


      // Axios throws on non-2xx. Check error object in catch? 
      // Actually standard axios flow: try { res = await ... } catch (err) { if err.response.status === 402 ... }

      const data = response.data;

      // ADDED: append AI response from backend
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content // backend response
        }
      ]);
    } catch (err) {
      console.error(err);

      if (err.response && err.response.status === 402) {
        // Token insufficient
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ You have insufficient tokens. Please top up to continue chatting."
          }
        ]);
        return;
      }

      // ADDED: show error message in chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Sorry, something went wrong. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="chat-main">
        <div className="chat-container" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
              >
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area" style={{ padding: '16px', borderTop: '1px solid #eaeaea', background: '#ffffff' }}>
            <textarea
              placeholder="Ask CandleCodex AI about a stock..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={loading} // ADDED: disable input while loading
              style={{ flex: 1, resize: 'none', border: '1px solid #ccc', borderRadius: '8px', padding: '10px 12px', fontSize: '0.95rem', height: '48px' }}
            />
            <button onClick={handleSend} disabled={loading} style={{ padding: '0 20px', borderRadius: '8px', border: 'none', background: '#111', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>
              {loading ? "Thinking..." : "Send"} {/* ADDED: loading feedback */}
            </button>
          </div>
        </div>
      </main>
    </>
  );

}

export default Chat;
