import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Sparkles, MessageSquare, Shield, HelpCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AICopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "👋 Namaste! I am the **CivicMind India AI Copilot**. \n\nI can help you understand municipal rules, navigate urban administration, draft Right to Information (RTI) questions, or escalate unresolved civic grievances in your area. \n\nWhat civic issue can I guide you with today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { text: "How to file an RTI on local ward budget?", icon: <HelpCircle size={12} /> },
    { text: "What are my civic rights for pothole safety?", icon: <Shield size={12} /> },
    { text: "Draft a solid waste complaint letter format", icon: <MessageSquare size={12} /> }
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Map frontend history format to backend expectation
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: history
        })
      });

      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: data.text,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } else {
        throw new Error("No response text");
      }
    } catch (err) {
      console.error("Failed to fetch chat:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "⚠️ I encountered an issue connecting to the AI system. Please verify that your `GEMINI_API_KEY` is fully configured in your system workspace. I am ready to resume as soon as the key is verified!",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/35">
            <Sparkles className="text-white" size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm">CivicMind India Copilot</h4>
            <p className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              AI Copilot Online
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">RTI Act & Civic Guide</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs shadow-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-100 text-slate-700 font-sans"
              }`}
            >
              <div className="whitespace-pre-line prose max-w-none">
                {m.text}
              </div>
              <div className="text-[9px] font-mono text-right text-slate-400 mt-2 block">{m.timestamp}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Quick Prompts selection */}
      {messages.length === 1 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Frequently Asked Guides</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.text)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                {qp.icon}
                <span>{qp.text}</span>
                <ArrowRight size={10} className="ml-1 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about RTI rules, file complaints format, local committee rules, etc..."
          className="flex-grow p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
