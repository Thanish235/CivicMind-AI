import { useState } from "react";
import { Issue } from "../types";
import { Search, MapPin, Calendar, ThumbsUp, MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface IssueFeedProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onUpvote: (issueId: string) => void;
}

export default function IssueFeed({ issues, onSelectIssue, onUpvote }: IssueFeedProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedUrgency, setSelectedUrgency] = useState("all");

  const categories = [
    "all",
    "Roads & Traffic",
    "Waste Management",
    "Water Supply",
    "Electricity & Power",
    "Public Health & Safety",
    "Others"
  ];

  const cities = ["all", "Bengaluru", "Mumbai", "New Delhi", "Chennai", "Hyderabad", "Kolkata", "Pune"];

  // Filtering Logic
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.description.toLowerCase().includes(search.toLowerCase()) ||
      issue.location.area.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;
    const matchesCity = selectedCity === "all" || issue.location.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesUrgency = selectedUrgency === "all" || issue.urgency === selectedUrgency;

    return matchesSearch && matchesCategory && matchesCity && matchesUrgency;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200 animate-pulse";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return {
          label: "Resolved",
          style: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      case "in_progress":
        return {
          label: "In Progress",
          style: "bg-blue-50 text-blue-700 border-blue-200"
        };
      case "verified":
        return {
          label: "Citizen Verified",
          style: "bg-orange-50 text-orange-700 border-orange-200"
        };
      default:
        return {
          label: "Reported (Pending)",
          style: "bg-rose-50 text-rose-700 border-rose-200"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search problems by keyword, ward, or street..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
          />
        </div>

        {/* Multi-Filter Row */}
        <div className="flex flex-wrap gap-3">
          {/* City Filter */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Filter City</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-50 border border-slate-100/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === "all" ? "All Cities" : city}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Filter Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-100/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Filter Urgency</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-slate-50 border border-slate-100/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Urgency</option>
              <option value="critical">🚨 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Feed Grid */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <p className="text-slate-400 text-sm font-medium">No reported civic issues found matching your filters.</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedCity("all");
              setSelectedUrgency("all");
            }}
            className="text-xs font-semibold font-mono text-indigo-600 hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIssues.map((issue) => {
            const statusBadge = getStatusBadge(issue.status);

            return (
              <div
                key={issue.id}
                id={`issue-card-${issue.id}`}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col h-full"
              >
                {/* Card Top: Badges */}
                <div className="p-6 pb-4 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-slate-100 text-slate-500">
                      {issue.category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${getUrgencyColor(
                        issue.urgency
                      )}`}
                    >
                      {issue.urgency === "critical" ? "🚨 " : ""}
                      {issue.urgency}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${statusBadge.style}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Card Body */}
                <div className="px-6 flex-grow space-y-2">
                  <h4
                    onClick={() => onSelectIssue(issue)}
                    className="font-bold text-slate-800 hover:text-indigo-600 transition cursor-pointer text-base line-clamp-1"
                  >
                    {issue.title}
                  </h4>
                  <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-indigo-500" />
                      {issue.location.area}, {issue.location.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(issue.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Actions & Engagement */}
                <div className="p-6 pt-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Upvote */}
                    <button
                      onClick={() => onUpvote(issue.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <ThumbsUp size={13} />
                      <span className="text-xs font-bold font-mono">{issue.upvotes}</span>
                    </button>

                    {/* Comment Count */}
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                      <MessageSquare size={13} />
                      {issue.comments.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectIssue(issue)}
                    className="text-xs font-bold font-sans text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    View AI Tools
                    <span className="text-xs">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
