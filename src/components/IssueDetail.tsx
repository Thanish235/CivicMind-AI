import { useState, FormEvent } from "react";
import { Issue, Comment } from "../types";
import { ArrowLeft, MapPin, Shield, Calendar, ThumbsUp, MessageSquare, Clipboard, Send, CheckCircle2, RefreshCw, FileText, Share2, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
  onUpvote: (issueId: string) => void;
  onStatusChange: (issueId: string, status: Issue["status"]) => void;
  onAddComment: (issueId: string, author: string, text: string) => void;
}

export default function IssueDetail({ issue, onBack, onUpvote, onStatusChange, onAddComment }: IssueDetailProps) {
  const [activeTab, setActiveTab] = useState<"ai_tools" | "actions_comments">("ai_tools");
  const [activeToolTab, setActiveToolTab] = useState<"complaint" | "rti" | "social">("complaint");
  const [newComment, setNewComment] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // RTI Form State
  const [rtiName, setRtiName] = useState("");
  const [rtiAddress, setRtiAddress] = useState("");
  const [rtiDraft, setRtiDraft] = useState<string | null>(null);
  const [rtiLoading, setRtiLoading] = useState(false);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleStatusToggle = (status: Issue["status"]) => {
    onStatusChange(issue.id, status);
  };

  const submitComment = (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthor.trim()) return;
    onAddComment(issue.id, commentAuthor, newComment);
    setNewComment("");
  };

  const generateRtiDraft = async () => {
    if (!rtiName.trim()) return;
    setRtiLoading(true);
    try {
      const response = await fetch("/api/ai/rti-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue.id,
          applicantName: rtiName,
          applicantAddress: rtiAddress
        })
      });
      const data = await response.json();
      if (data.rtiDraft) {
        setRtiDraft(data.rtiDraft);
      }
    } catch (err) {
      console.error("Failed to generate RTI:", err);
    } finally {
      setRtiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to feed header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition bg-white px-4 py-2 rounded-xl border border-slate-100"
        >
          <ArrowLeft size={16} />
          Back to Feed
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono">Status:</span>
          <select
            value={issue.status}
            onChange={(e) => handleStatusToggle(e.target.value as Issue["status"])}
            className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="pending">Reported (Pending)</option>
            <option value="verified">Citizen Verified</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved & Closed</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Info card on left, tabs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Issue details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-slate-100 text-slate-500">
                {issue.category}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${
                issue.urgency === "critical" ? "bg-red-50 text-red-700 border-red-200" :
                issue.urgency === "high" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {issue.urgency}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-800 leading-snug">{issue.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{issue.description}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-50 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-700">
                  {issue.location.area}, {issue.location.city}, {issue.location.state}
                </span>
              </div>
              {issue.location.address && (
                <div className="pl-6 text-[11px] text-slate-400 leading-relaxed italic">
                  "{issue.location.address}"
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar size={14} className="shrink-0" />
                <span>Reported on {new Date(issue.createdAt).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="shrink-0 text-slate-400" />
                <span>By {issue.reporterName} ({issue.reporterEmail})</span>
              </div>
            </div>

            {/* Engagement buttons */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <button
                onClick={() => onUpvote(issue.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <ThumbsUp size={14} />
                <span className="text-xs font-bold font-mono">{issue.upvotes} Upvotes</span>
              </button>
            </div>
          </div>

          {/* AI Hazard Assessment Box */}
          {issue.aiAnalysis && (
            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-3xl border border-indigo-100/50 space-y-3">
              <h5 className="text-xs font-mono font-bold uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                AI Incident Assessment
              </h5>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">Jurisdictional Body:</p>
                <p className="text-xs text-indigo-900 font-mono font-medium leading-relaxed">
                  {issue.aiAnalysis.targetAuthority}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">Impact Analysis:</p>
                <p className="text-xs text-slate-600 leading-relaxed">{issue.aiAnalysis.severity}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI tools / Comments tabs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab("ai_tools")}
              className={`pb-3 text-sm font-bold border-b-2 transition px-4 ${
                activeTab === "ai_tools"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              🛠️ Citizen Action AI Kit
            </button>
            <button
              onClick={() => setActiveTab("actions_comments")}
              className={`pb-3 text-sm font-bold border-b-2 transition px-4 ${
                activeTab === "actions_comments"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              💬 Discussion & Status Logs ({issue.comments.length})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "ai_tools" ? (
              <motion.div
                key="ai_tools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Secondary Horizontal Tool Tabs */}
                <div className="flex gap-2 bg-slate-100/60 p-1 rounded-2xl">
                  <button
                    onClick={() => setActiveToolTab("complaint")}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeToolTab === "complaint"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <FileText size={14} />
                    Grievance Draft
                  </button>
                  <button
                    onClick={() => setActiveToolTab("rti")}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeToolTab === "rti"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <HelpCircle size={14} />
                    RTI Act Form A
                  </button>
                  <button
                    onClick={() => setActiveToolTab("social")}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      activeToolTab === "social"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Share2 size={14} />
                    Social Media Kit
                  </button>
                </div>

                {/* Sub Tab: Bureaucratic Complaint Draft */}
                {activeToolTab === "complaint" && issue.aiAnalysis && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Official Complaint Grievance Letter</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Formal draft for submission to ward administrators.</p>
                      </div>
                      <button
                        onClick={() => handleCopy(issue.aiAnalysis!.officialDraft, "complaint")}
                        className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition"
                      >
                        <Clipboard size={12} />
                        {copiedText === "complaint" ? "Copied!" : "Copy Letter"}
                      </button>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 overflow-y-auto max-h-96">
                      <pre className="font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {issue.aiAnalysis.officialDraft}
                      </pre>
                    </div>

                    {/* How to submit advice */}
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 space-y-2">
                      <h5 className="text-xs font-bold text-amber-800">💡 Citizen submission instructions:</h5>
                      <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                        <li>Print this letter or copy it to an email template.</li>
                        <li>Submit in duplicate to the Assistant Executive Engineer's Ward Office of <span className="font-mono">{issue.location.city}</span>.</li>
                        <li>Keep one signed copy as an "Acknowledgement copy" to track the SLA under your state Public Services Guarantee Act (Sakkaala/Sewa Adhikar).</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Sub Tab: RTI Builder */}
                {activeToolTab === "rti" && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Right to Information (RTI Act 2005) Builder</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Demand budget and contractor verification reports for long-delayed local repairs.
                      </p>
                    </div>

                    {!rtiDraft ? (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 space-y-4">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Enter your details below to generate an official RTI Form A. The system will format strategic questions regarding budgetary allocation, contracts, and inspections for this specific problem spot.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 block">Applicant's Full Name</label>
                            <input
                              type="text"
                              value={rtiName}
                              onChange={(e) => setRtiName(e.target.value)}
                              placeholder="e.g. Anand R. Kulkarni"
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 block">Permanent Postal Address</label>
                            <input
                              type="text"
                              value={rtiAddress}
                              onChange={(e) => setRtiAddress(e.target.value)}
                              placeholder="e.g. Flat 302, Green Glen Layout, Bengaluru"
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700"
                            />
                          </div>
                        </div>

                        <button
                          onClick={generateRtiDraft}
                          disabled={!rtiName.trim() || rtiLoading}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {rtiLoading ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              Compiling RTI...
                            </>
                          ) : (
                            <>
                              <FileText size={13} />
                              Generate Form A RTI Application
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                            RTI Application Ready
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setRtiDraft(null)}
                              className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => handleCopy(rtiDraft, "rti")}
                              className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition"
                            >
                              <Clipboard size={12} />
                              {copiedText === "rti" ? "Copied!" : "Copy RTI Draft"}
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 overflow-y-auto max-h-96">
                          <pre className="font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {rtiDraft}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Tab: Social Media Kit */}
                {activeToolTab === "social" && issue.aiAnalysis && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Citizen Social Escalation Post</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Quick template designed for public visibility on Twitter/X.</p>
                      </div>
                      <button
                        onClick={() => handleCopy(issue.aiAnalysis!.socialMediaDraft, "social")}
                        className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition"
                      >
                        <Clipboard size={12} />
                        {copiedText === "social" ? "Copied!" : "Copy Post"}
                      </button>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
                      <p className="font-sans text-xs text-slate-700 leading-relaxed italic">
                        "{issue.aiAnalysis.socialMediaDraft}"
                      </p>
                    </div>

                    {/* Temporary Safety Tips */}
                    {issue.aiAnalysis.temporarySolutions && issue.aiAnalysis.temporarySolutions.length > 0 && (
                      <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 space-y-3">
                        <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          🛡️ Hyperlocal Safety & Temporary Solutions for Citizens
                        </h5>
                        <ul className="space-y-2">
                          {issue.aiAnalysis.temporarySolutions.map((sol, idx) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                              <span className="font-mono font-bold text-indigo-600 mt-0.5">[{idx + 1}]</span>
                              <span>{sol}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              // Actions & Discussion panel
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Comment Form */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Add your update / verification</h4>
                  <form onSubmit={submitComment} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Your Name / Handle"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="md:col-span-1 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 bg-slate-50/50"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Add a verified update or comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="md:col-span-2 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 bg-slate-50/50"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5"
                      >
                        Post Update
                        <Send size={12} />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Comment History List */}
                <div className="space-y-3">
                  <h5 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Citizen Update Timeline</h5>
                  {issue.comments.length === 0 ? (
                    <p className="text-slate-400 text-xs py-4 text-center italic bg-slate-50 rounded-2xl">
                      No citizen verification comments yet. Be the first to post a status check.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {issue.comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span className="font-bold text-slate-700">{comment.author}</span>
                            <span>{new Date(comment.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
