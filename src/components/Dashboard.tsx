import { useMemo } from "react";
import { Issue } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Users, Award, MapPin } from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  issues: Issue[];
}

export default function Dashboard({ issues }: DashboardProps) {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter((i) => i.status === "resolved").length;
    const active = issues.filter((i) => i.status !== "resolved").length;
    const critical = issues.filter((i) => i.urgency === "critical" && i.status !== "resolved").length;

    return { total, resolved, active, critical };
  }, [issues]);

  // Recharts Data: Category breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      counts[issue.category] = (counts[issue.category] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [issues]);

  // Recharts Data: Status breakdown
  const statusData = useMemo(() => {
    const counts = { pending: 0, verified: 0, in_progress: 0, resolved: 0 };
    issues.forEach((issue) => {
      if (counts[issue.status] !== undefined) {
        counts[issue.status]++;
      }
    });

    return [
      { name: "Reported (Pending)", value: counts.pending, color: "#ef4444" },
      { name: "Citizen Verified", value: counts.verified, color: "#f97316" },
      { name: "In Progress", value: counts.in_progress, color: "#3b82f6" },
      { name: "Resolved / Closed", value: counts.resolved, color: "#10b981" },
    ];
  }, [issues]);

  // Mock Citizen Leaderboard
  const leaderBoard = [
    { name: "Aarav Sharma", location: "HSR, Bengaluru", points: 480, reports: 12, resolved: 8, rank: "🥇 National Guardian" },
    { name: "Neha Deshmukh", location: "Andheri West, Mumbai", points: 350, reports: 9, resolved: 5, rank: "🥈 Civic Champion" },
    { name: "Pranav Iyer", location: "Dwarka, Delhi", points: 290, reports: 7, resolved: 4, rank: "🥉 Local Watchdog" },
    { name: "Suresh Pillai", location: "Adyar, Chennai", points: 180, reports: 5, resolved: 3, rank: "Active Contributor" },
  ];

  // Hotspot city stats
  const cityData = useMemo(() => {
    const cities: Record<string, number> = {};
    issues.forEach((issue) => {
      const city = issue.location.city;
      cities[city] = (cities[city] || 0) + 1;
    });
    return Object.entries(cities)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [issues]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div id="dashboard-view" className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Total Reports</p>
            <h3 className="text-2xl font-bold font-sans text-slate-800">{stats.total}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Resolved Issues</p>
            <h3 className="text-2xl font-bold font-sans text-slate-800">{stats.resolved}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Active Watch</p>
            <h3 className="text-2xl font-bold font-sans text-slate-800">{stats.active}</h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-center space-x-4"
        >
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Active Critical</p>
            <h3 className="text-2xl font-bold font-sans text-slate-800 text-red-600">{stats.critical}</h3>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Issue Statuses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
              Civic Resolution Funnel
            </h4>
            <span className="text-xs font-mono text-slate-400">Live Statuses</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={140} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "transparent" }} formatter={(value) => [`${value} Issues`, "Count"]} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-violet-600 rounded-full"></span>
              Grievances by Category
            </h4>
            <span className="text-xs font-mono text-slate-400">Distribution</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-slate-400 text-sm">No data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Reports`, "Count"]} />
                  <Legend verticalAlign="bottom" height={36} tick={{ fontSize: 11 }} iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard and Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hotspots Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <MapPin size={18} className="text-red-500" />
              Active Cities
            </h4>
            <span className="text-xs font-mono text-slate-400">Hotspots</span>
          </div>
          <div className="space-y-3">
            {cityData.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No reports active</p>
            ) : (
              cityData.map((city, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-semibold text-slate-400 w-5">#{idx + 1}</span>
                    <span className="font-medium text-slate-700 text-sm">{city.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 text-xs font-semibold font-mono rounded-full bg-blue-100 text-blue-700">
                      {city.count} {city.count === 1 ? "report" : "reports"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Citizen Leaderboard */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              Citizen Guardians Leaderboard
            </h4>
            <span className="text-xs font-mono text-emerald-600 font-semibold flex items-center gap-1">
              <Users size={12} />
              Active Community
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono text-xs">
                  <th className="py-2">Rank & Citizen</th>
                  <th className="py-2">Location</th>
                  <th className="py-2 text-center">Reports</th>
                  <th className="py-2 text-center">Resolved</th>
                  <th className="py-2 text-right">Reputation Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderBoard.map((citizen, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5">
                      <div>
                        <div className="font-medium text-slate-800">{citizen.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{citizen.rank}</div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600">{citizen.location}</td>
                    <td className="py-3.5 text-center font-mono text-slate-700">{citizen.reports}</td>
                    <td className="py-3.5 text-center font-mono text-emerald-600 font-semibold">{citizen.resolved}</td>
                    <td className="py-3.5 text-right font-mono font-bold text-indigo-600">+{citizen.points} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
