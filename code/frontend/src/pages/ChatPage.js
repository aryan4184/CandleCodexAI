import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Send, ArrowLeft, Loader2, User, LogOut, Plus, MessageSquare, PanelLeftClose, PanelLeftOpen, MoreHorizontal, Edit2, Trash2, X, Check, Paperclip, Image as ImageIcon } from "lucide-react";
import StockChart from "../components/StockChart";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ErrorBoundary from "../components/ErrorBoundary";

export default function ChatPage() {
  const { user, logout, API } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);

  // Debugging: Monitor messages
  useEffect(() => {
    console.log("Current Messages:", messages);
  }, [messages]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chat/conversations`);
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  }, [API]);

  useEffect(() => {
    fetchConversations();
    // fetchChatHistory(); // Removed: Default to new chat as requested
  }, [fetchConversations]);

  const fetchChatHistory = async (convId = null) => {
    setLoading(true);
    try {
      const url = convId ? `${API}/chat/history?conversation_id=${convId}` : `${API}/chat/history`;
      const response = await axios.get(url);
      setMessages(response.data);

      if (convId) setActiveConversationId(convId);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await axios.delete(`${API}/chat/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConversationId === convId) {
        startNewChat();
      }
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
    setActiveMenuId(null);
  };

  const startEditing = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || `Conversation ${conv.id}`);
    setActiveMenuId(null);
  };

  const saveTitle = async (e) => {
    e.stopPropagation(); // prevent navigation
    try {
      await axios.put(`${API}/chat/conversations/${editingId}`, { title: editTitle });
      setConversations(prev => prev.map(c => c.id === editingId ? { ...c, title: editTitle } : c));
      setEditingId(null);
      toast.success("Renamed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to rename");
    }
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result); // Base64 string
        setPreviewUrl(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const userMessage = input;
    const imageData = selectedFile;
    const imagePreview = previewUrl;

    // Reset Input
    setInput("");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setLoading(true);

    const tempMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: userMessage,
      image_data: imagePreview, // Use preview for local display
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, tempMessage]);

    try {
      // Pass conversation_id if active
      const payload = {
        content: userMessage || " ", // Handle image-only messages if needed, backend might require content
        image_data: imageData,
        conversation_id: activeConversationId
      };

      const response = await axios.post(`${API}/chat`, payload);

      // If it created a new conversation, set it as active
      if (response.data.conversation_id && response.data.conversation_id !== activeConversationId) {
        setActiveConversationId(response.data.conversation_id);
        fetchConversations(); // Update sidebar list
      }

      setMessages((prev) => {
        const newPrev = prev.map(m => m.id === tempMessage.id ? { ...m, id: response.data.conversation_id + "_" + Date.now(), sender: 'user', content: userMessage, image_data: imagePreview } : m);
        return [...newPrev, response.data];
      });

    } catch (error) {
      console.error("Send Message Error:", error);
      if (error.response) {
        toast.error(error.response.data?.detail || "Server rejected message");
      } else if (error.request) {
        console.error("No response from server:", error.request);
        toast.error("Network Error: Message not sent. Check connection/tunnel.");
      } else {
        toast.error("Error sending message: " + error.message);
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <nav className="glass-card border-b border-white/10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              data-testid="back-to-dashboard-button"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="font-heading text-2xl font-bold tracking-tight">AI CHAT</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground font-body text-sm hidden md:block">Powered by CandleCodex AI</div>
            <button
              data-testid="nav-profile-button"
              onClick={() => navigate("/profile")}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <User size={20} />
            </button>
            <button
              data-testid="nav-logout-button"
              onClick={() => {
                logout();
                navigate("/");
                toast.success("Logged out successfully");
              }}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full relative">
        {/* Toggle Button (Mobile & Desktop) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-20 p-2 bg-black/50 glass-card border border-white/10 rounded-md hover:bg-white/10 transition-colors md:hidden"
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card border-r border-white/10 flex flex-col absolute md:static z-10 h-full bg-background md:bg-transparent"
            >
              <div className="p-4 flex items-center justify-between">
                <button
                  onClick={startNewChat}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span className="truncate">NEW CHAT</span>
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="ml-2 p-2 text-muted-foreground hover:text-white md:block hidden"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose size={20} />
                </button>
              </div>

              <div className="px-4 pb-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Your Chats
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                {conversations.map((conv) => (
                  <div key={conv.id} className="relative group">
                    {editingId === conv.id ? (
                      <div className="p-2 flex items-center gap-1 bg-white/5 rounded-md mx-2">
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white min-w-0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle(e);
                            if (e.key === 'Escape') cancelEditing(e);
                          }}
                        />
                        <button onClick={saveTitle} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                        <button onClick={cancelEditing} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          fetchChatHistory(conv.id);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        className={`w-full p-3 pr-8 rounded-md flex items-center gap-3 text-sm transition-colors text-left truncate group ${activeConversationId === conv.id
                          ? "bg-primary/20 text-primary border border-primary/50"
                          : "hover:bg-white/5 text-muted-foreground hover:text-white"
                          }`}
                      >
                        <MessageSquare size={16} className="shrink-0" />
                        <span className="truncate flex-1">
                          {conv.title || `Conversation ${conv.id}`}
                        </span>

                        <div
                          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 ${activeMenuId === conv.id ? 'block' : 'hidden group-hover:block'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === conv.id ? null : conv.id)
                            }}
                            className="p-1 hover:bg-black/50 rounded-full text-muted-foreground hover:text-white"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {activeMenuId === conv.id && (
                            <div ref={menuRef} className="absolute right-0 top-full mt-1 w-32 bg-background border border-white/20 rounded-md shadow-xl z-50 overflow-hidden">
                              <button
                                onClick={(e) => startEditing(e, conv)}
                                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-white/10 text-xs"
                              >
                                <Edit2 size={12} /> Rename
                              </button>
                              <button
                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-500/20 text-red-400 text-xs"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Show Open Button if sidebar is closed (Desktop only, mobile has absolute button) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 left-4 z-10 p-2 text-muted-foreground hover:text-white hidden md:block"
              title="Expand Sidebar"
            >
              <PanelLeftOpen size={24} />
            </button>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 pt-16 md:pt-8" data-testid="chat-messages-container">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="font-heading text-4xl font-black mb-4">
                  ASK ME ANYTHING
                </div>
                <p className="text-muted-foreground font-body mb-8">
                  Get AI-powered insights on stocks, market trends, and trading strategies
                </p>
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {[
                    "What's the outlook for TCS?",
                    "Analyze RELIANCE recent performance",
                    "Best tech stocks to watch?",
                    "Explain RSI indicator",
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      data-testid={`suggestion-${idx}`}
                      onClick={() => setInput(suggestion)}
                      className="p-4 glass-card hover:border-primary/50 transition-colors text-left font-body text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg, idx) => (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Avatar/Icon if needed */}
                  <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>

                    {/* Custom Native Chart (Preferred) */}
                    {(() => {
                      // Logic to extract ticker from msg.ticker OR msg.image_url (hack)
                      let displayTicker = msg.ticker;
                      if (!displayTicker && msg.image_url && msg.image_url.startsWith("ticker:")) {
                        displayTicker = msg.image_url.replace("ticker:", "");
                      }

                      return displayTicker ? (
                        <div className="mb-4 w-[800px] h-[400px]">
                          <ErrorBoundary>
                            <StockChart symbol={displayTicker} />
                          </ErrorBoundary>
                        </div>
                      ) : null;
                    })()}

                    {/* Image/Chart Display (Fallback only if no Custom Chart) */}
                    {!msg.ticker && (msg.image_data || msg.image_url) && (!msg.image_url || !msg.image_url.startsWith("ticker:")) && (
                      <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
                        {/* Check if it's a TradingView widget URL */}
                        {(msg.image_url && msg.image_url.includes('tradingview.com/widgetembed')) ? (
                          // Render as iframe for TradingView widgets
                          <div className="w-full md:w-[1200px] h-[200px] relative">
                            <iframe
                              src={msg.image_url}
                              className="w-full h-full rounded-lg"
                              frameBorder="0"
                              allowTransparency="true"
                              allowFullScreen={true}
                              scrolling="no"
                              title="TradingView Chart"
                              style={{ backgroundColor: 'transparent' }}
                            />
                          </div>

                        ) : (
                          // Render as image for regular images
                          <a
                            href={msg.image_data || msg.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block cursor-zoom-in relative group"
                          >
                            <img
                              src={msg.image_data || msg.image_url}
                              alt="Chart"
                              className="max-h-64 object-contain w-full"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'p-4 text-xs text-red-400';
                                errorDiv.innerHTML = `Failed to load image.<br/>URL: ${msg.image_url || 'N/A'}`;
                                e.target.parentElement.appendChild(errorDiv);
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Inside render loop: */}
                    <div
                      className={`p-4 font-body text-sm rounded-2xl ${msg.sender === "user"
                        ? "bg-primary text-white"
                        : "glass-card text-foreground"
                        }`}
                    >
                      {msg.sender === "user" ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="prose prose-invert max-w-none text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              a: ({ node, ...props }) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                              li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-1 mt-2" {...props} />,
                              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-2 bg-white/5 rounded-r" {...props} />,
                              code: ({ node, inline, className, children, ...props }) => {
                                return inline ? (
                                  <code className="bg-white/10 rounded px-1 py-0.5 font-mono text-xs" {...props}>{children}</code>
                                ) : (
                                  <pre className="bg-black/50 p-2 rounded-md overflow-x-auto my-2 border border-white/10"><code className="font-mono text-xs" {...props}>{children}</code></pre>
                                )
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="p-4 glass-card flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="font-body text-time text-muted-foreground">AI is thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 glass-card border-t border-white/10 shrink-0">
            {/* Image Preview Container */}
            {previewUrl && (
              <div className="flex items-center gap-2 mb-2 p-2 glass-card inline-block relative rounded-md">
                <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                <button
                  onClick={handleRemoveFile}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white hover:bg-red-600 shadow-md"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary px-3 flex items-center justify-center hover:bg-white/10"
                title="Attach file"
              >
                <Plus size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*" // Restrict to images for now as backend usage implies vision
                onChange={handleFileSelect}
              />

              <input
                data-testid="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about stocks, trends, or strategies..."
                className="flex-1 px-4 py-3 bg-black/50 border border-white/10 focus:border-primary font-body text-sm focus:outline-none"
                disabled={loading}
              />
              <button
                data-testid="chat-send-button"
                type="submit"
                disabled={loading || (!input.trim() && !selectedFile)}
                className="btn-primary disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={16} />
                SEND
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}