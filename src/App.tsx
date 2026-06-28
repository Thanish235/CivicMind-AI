import { useState, useEffect } from "react";
import { Issue } from "./types";
import Dashboard from "./components/Dashboard";
import IssueFeed from "./components/IssueFeed";
import IssueDetail from "./components/IssueDetail";
import ReportIssueForm from "./components/ReportIssueForm";
import AICopilot from "./components/AICopilot";
import { Shield, Sparkles, PlusCircle, AlertCircle, FileText, CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"feed" | "dashboard" | "report" | "copilot">("feed");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all issues on mount
  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/issues");
      if (!response.ok) throw new Error("Failed to load civic issues.");
      const data = await response.json();
      setIssues(data);
      // If we currently have a selected issue, update it with fresh data
      if (selectedIssue) {
        const updated = data.find((i: Issue) => i.id === selectedIssue.id);
        if (updated) setSelectedIssue(updated);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpvote = async (issueId: string) => {
    // In a real app we'd use the current logged-in email. We can generate a temporary identifier
    let storedEmail = localStorage.getItem("civicmind_user_email");
    if (!storedEmail) {
      storedEmail = `citizen-${Math.floor(Math.random() * 10000)}@civicmind.org`;
      localStorage.setItem("civicmind_user_email", storedEmail);
    }

    try {
      const response = await fetch(`/api/issues/${issueId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail })
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        // Update in state
        setIssues((prev) => prev.map((i) => (i.id === issueId ? updatedIssue : i)));
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue(updatedIssue);
        }
      }
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  const handleStatusChange = async (issueId: string, status: Issue["status"]) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues((prev) => prev.map((i) => (i.id === issueId ? updatedIssue : i)));
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue(updatedIssue);
        }
      }
    } catch (err) {
      console.error("Status change failed:", err);
    }
  };

  const handleAddComment = async (issueId: string, author: string, text: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text })
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues((prev) => prev.map((i) => (i.id === issueId ? updatedIssue : i)));
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue(updatedIssue);
        }
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const handleReportSuccess = () => {
    fetchIssues();
    setActiveTab("feed");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Dynamic Indian Patriotic Visual Stripe (Subtle colored line at very top) */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500 w-full shrink-0"></div>

      {/* Primary Header Bar */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand section */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setSelectedIssue(null); setActiveTab("feed"); }}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md text-white font-mono font-bold">
              CM
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">CivicMind</span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">India</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">AI-Powered Hyperlocal Civic Resolution Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => { setSelectedIssue(null); setActiveTab("feed"); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "feed" && !selectedIssue
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📋 Problem Feed
            </button>
            <button
              onClick={() => { setSelectedIssue(null); setActiveTab("dashboard"); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "dashboard"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📊 Ward Analytics
            </button>
            <button
              onClick={() => { setSelectedIssue(null); setActiveTab("copilot"); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                activeTab === "copilot"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-indigo-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles size={13} />
              AI Copilot Chat
            </button>
            <button
              onClick={() => { setSelectedIssue(null); setActiveTab("report"); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                activeTab === "report"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-200/50 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <PlusCircle size={13} />
              Report Problem
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Loading Indicator */}
        {loading && issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw size={36} className="text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading hyperlocal ward database...</p>
          </div>
        ) : error ? (
          <div className="p-5 bg-red-50 border border-red-100 rounded-3xl text-red-800 max-w-lg mx-auto flex items-start gap-3 shadow-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold">Database Error</h4>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchIssues}
                className="mt-3 text-xs font-mono font-bold bg-white text-red-800 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 transition"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* If an issue has been selected from feed, focus on it */}
            {selectedIssue ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <IssueDetail
                  issue={selectedIssue}
                  onBack={() => setSelectedIssue(null)}
                  onUpvote={handleUpvote}
                  onStatusChange={handleStatusChange}
                  onAddComment={handleAddComment}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "feed" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 max-w-xl">
                        <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          Active Citizen Network
                        </span>
                        <h2 className="text-2xl font-extrabold font-sans tracking-tight">Indian Local Grievance Registry</h2>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Upvote urgent problems in your city ward, verify resolution statuses, and leverage AI to auto-categorize, generate legal complaint drafts, or draft Form A Right to Information (RTI) petitions.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("report")}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/25 shrink-0"
                      >
                        File a Ward Grievance
                      </button>
                    </div>

                    <IssueFeed
                      issues={issues}
                      onSelectIssue={setSelectedIssue}
                      onUpvote={handleUpvote}
                    />
                  </div>
                )}

                {activeTab === "dashboard" && <Dashboard issues={issues} />}

                {activeTab === "report" && (
                  <ReportIssueForm onSuccess={handleReportSuccess} />
                )}

                {activeTab === "copilot" && <AICopilot />}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Compact Civic Status Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-mono shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CivicMind India • Empowering Local Self-Governance</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-500" />
              SLA Tracker Active
            </span>
            <span>RTI Section 6(1) Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
