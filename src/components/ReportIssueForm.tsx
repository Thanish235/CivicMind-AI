import { useState, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, MapPin, ShieldAlert, Send } from "lucide-react";

interface ReportIssueFormProps {
  onSuccess: () => void;
}

export default function ReportIssueForm({ onSuccess }: ReportIssueFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Roads & Traffic",
    city: "Bengaluru",
    area: "",
    state: "Karnataka",
    address: "",
    urgency: "medium",
    reporterName: "",
    reporterEmail: ""
  });

  const categories = [
    "Roads & Traffic",
    "Waste Management",
    "Water Supply",
    "Electricity & Power",
    "Public Health & Safety",
    "Others"
  ];

  const IndianCities = [
    { name: "Bengaluru", state: "Karnataka" },
    { name: "Mumbai", state: "Maharashtra" },
    { name: "New Delhi", state: "Delhi" },
    { name: "Chennai", state: "Tamil Nadu" },
    { name: "Hyderabad", state: "Telangana" },
    { name: "Kolkata", state: "West Bengal" },
    { name: "Pune", state: "Maharashtra" },
    { name: "Others", state: "" }
  ];

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = e.target.value;
    const cityObj = IndianCities.find((c) => c.name === selectedCity);
    setFormData({
      ...formData,
      city: selectedCity,
      state: cityObj?.state || ""
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
        setError("Please complete all fields in Step 1.");
        return;
      }
    } else if (step === 2) {
      if (!formData.city || !formData.area.trim()) {
        setError("Please state the City and Area/Ward to pinpoint the issue.");
        return;
      }
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.reporterName.trim() || !formData.reporterEmail.trim()) {
      setError("Please provide your name and email to submit the report.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit civic report.");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden max-w-2xl mx-auto">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center">
        <h3 className="text-xl font-bold font-sans">Report a Local Civil Problem</h3>
        <p className="text-xs text-slate-300 mt-1">
          Provide accurate details. CivicMind AI will automatically analyze urgency, identify the correct municipal body, and generate official documents.
        </p>

        {/* Steps Tracker */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition ${
                  step === s
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : step > s
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-emerald-500" : "bg-slate-800"}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Civic Report Filed Successfully!</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                CivicMind AI is currently compiling drafts, assessing hazards, and matching authorities for you...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-3 border border-red-100">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* STEP 1: Civic Problem Details */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                      Select Civic Category
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={`p-3 text-left rounded-xl text-sm font-medium border transition ${
                            formData.category === cat
                              ? "bg-indigo-50/50 border-indigo-500 text-indigo-700"
                              : "border-slate-100 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                      Title of Report
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Blocked drainage overflowing on school lane"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                      Detailed Description
                    </label>
                    <textarea
                      placeholder="Please describe the issue, how long it has been pending, how it affects residents/traffic, and any specific safety dangers..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
                    >
                      Next Step
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Hyperlocal Location pinpoint */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                        City / Town
                      </label>
                      <select
                        value={formData.city}
                        onChange={handleCityChange}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                      >
                        {IndianCities.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="State name"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 focus:outline-none text-sm cursor-not-allowed"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                      Specific Area / Ward Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., HSR Layout Ward 174, Sector 3"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                      Full Address / Landmark Details (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Opposite Lakshmi Temple, next to government high school gate"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                    />
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
                    >
                      Next Step
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Urgency & Contact */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-3">
                    <label className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                      Assess Urgency Level
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["low", "medium", "high", "critical"] as const).map((urg) => {
                        const styleMap = {
                          low: "border-slate-100 text-slate-600 active:bg-slate-50 hover:bg-slate-50",
                          medium: "border-amber-100 text-amber-700 active:bg-amber-50 hover:bg-amber-50",
                          high: "border-orange-100 text-orange-700 active:bg-orange-50 hover:bg-orange-50",
                          critical: "border-red-100 text-red-700 active:bg-red-50 hover:bg-red-50"
                        };

                        const activeStyleMap = {
                          low: "bg-slate-50 border-slate-400 text-slate-800 ring-2 ring-slate-100",
                          medium: "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-100",
                          high: "bg-orange-50 border-orange-500 text-orange-800 ring-2 ring-orange-100",
                          critical: "bg-red-50 border-red-500 text-red-800 ring-2 ring-red-100"
                        };

                        return (
                          <button
                            key={urg}
                            type="button"
                            onClick={() => setFormData({ ...formData, urgency: urg })}
                            className={`p-3 rounded-xl text-xs font-bold border capitalize transition text-center ${
                              formData.urgency === urg ? activeStyleMap[urg] : styleMap[urg]
                            }`}
                          >
                            {urg}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-4 space-y-4">
                    <h5 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                      Reporter Identity (Required for Formal Letters)
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 block">Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Suresh Kumar"
                          value={formData.reporterName}
                          onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-slate-500 block">Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g., suresh@example.com"
                          value={formData.reporterEmail}
                          onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
                      disabled={loading}
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 disabled:opacity-55"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          Submit & Run AI Copilot
                          <Send size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
