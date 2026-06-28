import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// Storage for issues in a JSON file for persistence
const DATA_FILE = path.join(process.cwd(), "issues.json");

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface AIAnalysis {
  severity: string;
  targetAuthority: string;
  temporarySolutions: string[];
  officialDraft: string;
  socialMediaDraft: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    city: string;
    area: string;
    state: string;
    address?: string;
  };
  urgency: "low" | "medium" | "high" | "critical";
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
  status: "pending" | "verified" | "in_progress" | "resolved";
  upvotes: number;
  upvotedBy: string[];
  comments: Comment[];
  aiAnalysis?: AIAnalysis;
}

// Default Seed Data
const defaultIssues: Issue[] = [
  {
    id: "iss-1",
    title: "Severe Road Potholes near Silk Board Junction",
    description: "Huge, dangerous potholes have developed right under the metro construction line. This causes massive water logging during evening showers and is a critical safety hazard for two-wheelers. Several bikes have slipped already.",
    category: "Roads & Traffic",
    location: {
      city: "Bengaluru",
      area: "HSR Layout / Silk Board",
      state: "Karnataka",
      address: "Outer Ring Rd, near Central Silk Board Metro Station"
    },
    urgency: "critical",
    reporterName: "Rajesh Kumar",
    reporterEmail: "rajesh@example.com",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_progress",
    upvotes: 42,
    upvotedBy: [],
    comments: [
      {
        id: "c-1",
        author: "Ananya Rao",
        text: "I travel here daily. The situation is extremely bad, especially at night when streetlights aren't working.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "c-2",
        author: "CivicMind Moderator",
        text: "We have compiled the AI complaint draft and forwarded it to BBMP Ward Office.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiAnalysis: {
      severity: "Critical - High risk of accidents for two-wheelers and heavy traffic congestion.",
      targetAuthority: "Bruhat Bengaluru Mahanagara Palike (BBMP) - Executive Engineer (Road Infrastructure)",
      temporarySolutions: [
        "Avoid the leftmost lane under the metro pillar line where water accumulates.",
        "Keep speed under 20km/h and follow larger vehicles' tyre tracks to gauge depth.",
        "Report to local traffic police to place temporary warning cones."
      ],
      officialDraft: "To,\nThe Executive Engineer (Road Infrastructure),\nBruhat Bengaluru Mahanagara Palike (BBMP),\nHSR Layout Division, Bengaluru.\n\nSubject: Urgent Redressal Request for Dangerous Potholes near Central Silk Board Junction\n\nRespected Sir/Madam,\n\nI am writing to draw your urgent attention to the deplorable state of the Outer Ring Road near the Central Silk Board Junction. Due to ongoing metro construction and recent rains, several deep, hazardous potholes have developed, posing a direct threat to commuter safety, especially two-wheeler riders.\n\nOver the last week, multiple minor accidents have been witnessed as riders attempt to swerve abruptly to avoid these craters. The traffic congestion caused by vehicles slowing down adds significantly to commute times.\n\nUnder the Karnataka Municipal Corporations Act, the BBMP is legally obligated to maintain safe public roads. We request you to direct immediate filling and tarring of these potholes to prevent any fatal accidents.\n\nThanking you,\n\nYours faithfully,\nCitizens of Bengaluru\n(Via CivicMind India platform)",
      socialMediaDraft: "🚨 Critical safety hazard at Silk Board Junction, Bengaluru! Massive potholes under metro construction are leading to accidents daily. Commuters be extremely careful. @BBMPCOMM @BlrCityTraffic please address this urgently! #CivicMind #BengaluruRoads"
    }
  },
  {
    id: "iss-2",
    title: "Unattended Garbage Pile & Drainage Overflow",
    description: "A major commercial waste pile-up has accumulated over the last two weeks next to the public park entrance. It is now mixing with sewage overflow from a blocked drain, emitting a terrible stench and attracting swarms of mosquitoes.",
    category: "Waste Management",
    location: {
      city: "Mumbai",
      area: "Andheri West",
      state: "Maharashtra",
      address: "Model Town Road, Opp. Shastri Nagar Park"
    },
    urgency: "high",
    reporterName: "Pooja Mehta",
    reporterEmail: "pooja.mehta@example.com",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    upvotes: 28,
    upvotedBy: [],
    comments: [
      {
        id: "c-3",
        author: "Vikram Shah",
        text: "Swarms of mosquitoes have entered our residential society opposite this spot. There is a high risk of Dengue/Malaria.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiAnalysis: {
      severity: "High - Serious public health risk (vector-borne diseases) and blocking of public park access.",
      targetAuthority: "Brihanmumbai Municipal Corporation (BMC) - K-West Ward SWM Office",
      temporarySolutions: [
        "Use mosquito repellent sprays in the nearby areas.",
        "Avoid walking through the overflow water as it contains harmful bacteria.",
        "Request nearby shop owners to temporarily cover the pile with plastic sheets to restrict stench."
      ],
      officialDraft: "To,\nThe Ward Officer (K-West Ward),\nBrihanmumbai Municipal Corporation (BMC),\nAndheri West, Mumbai.\n\nSubject: Complaint Regarding Garbage Pile-up and Blocked Drainage Sewer at Shastri Nagar Park\n\nRespected Sir/Madam,\n\nI am writing on behalf of the residents of Shastri Nagar, Andheri West, to draw your attention to a critical public health hazard on Model Town Road, opposite Shastri Nagar Park.\n\nA massive heap of municipal and commercial solid waste has remained unattended for over 14 days. To make matters worse, a major stormwater drain adjacent to this spot is clogged, causing raw sewage to overflow and mix with the decomposing waste. The resulting toxic mix is attracting rodents, flies, and mosquitoes, raising dengue and malaria concerns in our neighborhood.\n\nWe request the Solid Waste Management (SWM) department to deploy dumper placers immediately to clear this waste and clear the sewage line choke.\n\nThanking you,\n\nYours faithfully,\nAndheri Residents Collective\n(Via CivicMind India)",
      socialMediaDraft: "⚠️ Disgusting garbage pile and overflowing sewage at Shastri Nagar Park, Andheri West. Residents are living in constant fear of Dengue & Malaria outbreaks. @mybmc @WardKW_BMC please clear this blackspot immediately! #BMC #MumbaiCivic #CleanMumbai"
    }
  },
  {
    id: "iss-3",
    title: "Defective Streetlights leading to Theft Concerns",
    description: "An entire stretch of about 400 meters of the primary residential lane has no functioning streetlights. The wires seem to have been cut during underground cabling works. It gets pitch dark after 7 PM, creating safety issues for women and elderly residents.",
    category: "Electricity & Power",
    location: {
      city: "New Delhi",
      area: "Dwarka Sector 11",
      state: "Delhi",
      address: "Pocket 4, Main Internal Road"
    },
    urgency: "medium",
    reporterName: "Amit Sharma",
    reporterEmail: "amit.sharma@example.com",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "resolved",
    upvotes: 19,
    upvotedBy: [],
    comments: [
      {
        id: "c-4",
        author: "Sanjay Kumar",
        text: "Update: BSES team came today morning and repaired the overhead connection box. Streetlights are fully back on now!",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    aiAnalysis: {
      severity: "Medium - Dark stretches pose safety and security challenges, increasing burglary risks.",
      targetAuthority: "Municipal Corporation of Delhi (MCD) / BSES Rajdhani Power Limited",
      temporarySolutions: [
        "Carry a hand torch or use mobile flashlights when walking post sundown.",
        "Request the neighborhood watch guards to stand at the entrances of the dark lane.",
        "Keep private residential gate/porch lights switched on to illuminate part of the road."
      ],
      officialDraft: "To,\nThe Executive Engineer (Electrical),\nMunicipal Corporation of Delhi (MCD) / BSES Rajdhani,\nDwarka Sector 11 Division, New Delhi.\n\nSubject: Defective Streetlight Infrastructure along Pocket 4 Road, Dwarka Sector 11\n\nRespected Sir/Madam,\n\nThis is to notify you regarding the complete failure of the streetlighting system along the main internal road of Pocket 4, Dwarka Sector 11, spanning over 400 meters.\n\nThe entire stretch is engulfed in pitch darkness after sunset. This is causing significant apprehension among residents, particularly children, women, and senior citizens, regarding their physical safety and the risk of anti-social elements taking advantage of the darkness.\n\nWe kindly urge you to dispatch a maintenance vehicle to inspect the underground cables or timers, and replace the broken bulbs with LED fixtures as soon as possible.\n\nThanking you,\n\nYours sincerely,\nDwarka Resident Welfare Association\n(Via CivicMind India)",
      socialMediaDraft: "🌃 Complete darkness on Pocket 4 Road, Dwarka Sector 11! Streetlights broken for over a week, posing a major security threat. @Official_MCD @BSESDelhi please repair this stretch on priority. #SafeDelhi #MCD"
    }
  }
];

// Helper to read issues
function readIssues(): Issue[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultIssues, null, 2));
      return defaultIssues;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading issues file:", error);
    return defaultIssues;
  }
}

// Helper to write issues
function writeIssues(issues: Issue[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(issues, null, 2));
  } catch (error) {
    console.error("Error writing issues file:", error);
  }
}

// Fallback high-quality analyzer for when Gemini key is missing
function fallbackAIAnalysis(title: string, description: string, city: string, area: string, category: string): AIAnalysis {
  const authorityMap: Record<string, string> = {
    "Bengaluru": "Bruhat Bengaluru Mahanagara Palike (BBMP) - Ward Office",
    "Mumbai": "Brihanmumbai Municipal Corporation (BMC) - Ward Office",
    "New Delhi": "Municipal Corporation of Delhi (MCD) / New Delhi Municipal Council (NDMC)",
    "Delhi": "Municipal Corporation of Delhi (MCD)",
    "Chennai": "Greater Chennai Corporation (GCC) - Zonal Office",
    "Kolkata": "Kolkata Municipal Corporation (KMC)",
    "Hyderabad": "Greater Hyderabad Municipal Corporation (GHMC)",
    "Pune": "Pune Municipal Corporation (PMC)"
  };

  const matchedCity = Object.keys(authorityMap).find(c => city.toLowerCase().includes(c.toLowerCase())) || "Local Municipal Corporation / Ward Office";
  const targetAuthority = authorityMap[matchedCity] || "Local Municipal Council / Panchayat Office";

  return {
    severity: "Medium-High. This issue causes clear inconvenience to local residents and needs active administrative monitoring.",
    targetAuthority,
    temporarySolutions: [
      "Keep local residents informed to exercise caution around the affected spot.",
      "Take photographic and video evidence to support follow-ups with local ward officials.",
      "Place safety visual indicators (like a visible barricade or dry branch) near any danger zones."
    ],
    officialDraft: `To,
The Ward Commissioner / Assistant Commissioner,
${targetAuthority},
${area}, ${city}.

Subject: Formal Grievance regarding unresolved Civic Issue: ${title}

Respected Sir/Madam,

I am writing to officially report an ongoing civic issue in our neighborhood at ${area}, ${city}. The issue concerns: ${description}.

This matter is causing substantial hardship, unhygienic conditions, and general inconvenience to residents and passersby in this locality. Despite verbal reports, no permanent resolution has been initiated yet.

Under relevant municipal guidelines, we request your office to inspect the location, assign a maintenance team, and resolve this civic problem on an immediate priority.

We appreciate your swift attention to this public matter.

Thanking you,

Yours sincerely,
Concerned Citizen
(Via CivicMind India)`,
    socialMediaDraft: `🚨 Civic Alert: "${title}" at ${area}, ${city}. This needs urgent attention from civic authorities. Citizens are facing serious inconvenience. @local_municipal_corp Please resolve this ASAP! #CivicMind #LocalGovernance #ActiveCitizenship`
  };
}

// REST API endpoints

// Get all issues
app.get("/api/issues", (req, res) => {
  const issues = readIssues();
  res.json(issues);
});

// Create a new issue (with synchronous Gemini analysis)
app.post("/api/issues", async (req, res) => {
  try {
    const { title, description, category, city, area, state, address, urgency, reporterName, reporterEmail } = req.body;

    if (!title || !description || !category || !city || !area || !state || !reporterName || !reporterEmail) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    const issues = readIssues();

    const newIssue: Issue = {
      id: `iss-${Date.now()}`,
      title,
      description,
      category,
      location: { city, area, state, address },
      urgency: urgency || "medium",
      reporterName,
      reporterEmail,
      createdAt: new Date().toISOString(),
      status: "pending",
      upvotes: 1,
      upvotedBy: [reporterEmail],
      comments: []
    };

    // Attempt Gemini AI Analysis
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `You are CivicMind AI, a specialized urban governance copilot designed for Indian cities.
Analyze the following civic issue reported by a citizen:

Title: "${title}"
Description: "${description}"
Category: "${category}"
Location: "${area}, ${city}, ${state} (Address details: ${address || "None"})"
Urgency declared by user: "${urgency || "medium"}"

Please respond with a raw JSON object containing these exact keys (do not include any markdown format tags like \`\`\`json or \`\`\` - output ONLY the valid JSON parseable string):
{
  "severity": "A brief 1-2 sentence technical assessment of the safety/health/inconvenience risk, mentioning concrete Indian legal/governance context if applicable.",
  "targetAuthority": "Specify the exact department or executive officer of the municipal body responsible (e.g., 'BBMP Assistant Executive Engineer - Solid Waste Management', 'BMC Ward Officer - Hydraulic Engineer Dept', 'MCD Electrical Wing', 'PWD Road Division Chennai', etc. base on the location and issue type).",
  "temporarySolutions": ["Solution/Safety tip 1", "Solution/Safety tip 2", "Solution/Safety tip 3"],
  "officialDraft": "A highly professional, standard Indian bureaucratic format grievance letter. Keep it polite, formal, mention relevant Municipal acts if you know them (e.g., KMC Act, BMC Act), structured with To, Subject, Salutation, Body, and Sign-off.",
  "socialMediaDraft": "A punchy social media post (e.g., for Twitter/X) under 280 characters, tagging realistic municipal handles (like @BBMPCOMM, @mybmc, @Official_MCD, @kv_mumbai, etc.) and including hashtags like #CivicMind and city-specific tags."
}`;

        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const textResponse = response.text || "";
        // Extract JSON if model wrapped it in markdown block anyway
        const cleanJsonText = textResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJsonText);
        newIssue.aiAnalysis = {
          severity: parsed.severity || "Medium-High risk.",
          targetAuthority: parsed.targetAuthority || "Local Municipal Authority",
          temporarySolutions: parsed.temporarySolutions || [],
          officialDraft: parsed.officialDraft || "",
          socialMediaDraft: parsed.socialMediaDraft || ""
        };
      } catch (geminiError) {
        console.error("Gemini analysis failed, using high-quality fallback:", geminiError);
        newIssue.aiAnalysis = fallbackAIAnalysis(title, description, city, area, category);
      }
    } else {
      console.log("No Gemini API key or lazy init skipped. Using fallback generator.");
      newIssue.aiAnalysis = fallbackAIAnalysis(title, description, city, area, category);
    }

    issues.unshift(newIssue);
    writeIssues(issues);

    res.status(201).json(newIssue);
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ error: "Failed to create civic issue." });
  }
});

// Upvote an issue
app.post("/api/issues/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { email } = req.body; // In a real app we'd track user sessions

  if (!email) {
    return res.status(400).json({ error: "Email is required to upvote." });
  }

  const issues = readIssues();
  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  if (issue.upvotedBy.includes(email)) {
    // Undo upvote
    issue.upvotedBy = issue.upvotedBy.filter(e => e !== email);
    issue.upvotes = Math.max(0, issue.upvotes - 1);
  } else {
    // Add upvote
    issue.upvotedBy.push(email);
    issue.upvotes += 1;
  }

  writeIssues(issues);
  res.json(issue);
});

// Update issue status (simulate official action / citizen verified solution)
app.post("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "verified", "in_progress", "resolved"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const issues = readIssues();
  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  issue.status = status;
  writeIssues(issues);
  res.json(issue);
});

// Add comment to an issue
app.post("/api/issues/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, text } = req.body;

  if (!author || !text) {
    return res.status(400).json({ error: "Author and text are required." });
  }

  const issues = readIssues();
  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author,
    text,
    createdAt: new Date().toISOString()
  };

  issue.comments.push(newComment);
  writeIssues(issues);
  res.json(issue);
});

// AI Chatbot / Copilot Chat
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body; // history format: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      // High-quality conversational fallback
      let reply = "I am the CivicMind India AI Copilot. It seems my Gemini API key is currently not active in the system configuration, but I can still help you with standard guidelines:\n\n";
      
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("rti") || lowerMsg.includes("right to information")) {
        reply += `### How to file an RTI in India:
1. **Identify the Department**: Find out which public authority (state or central) holds the information.
2. **Draft the Application**: You can write it on a plain piece of paper in English, Hindi, or the official language of your area.
3. **Drafting Format**:
   - Mention: 'Application under Section 6(1) of the RTI Act, 2005'.
   - State your specific questions clearly (keep them precise, e.g., "Provide the sanctioned budget and actual expenditure details for road repair works in HSR Sector 2 between 2024 and 2026").
4. **Pay the Fee**: A basic fee of ₹10 (by Court Fee stamp, Demand Draft, Postal Order, or online).
5. **Submit**: Hand it over to the Public Information Officer (PIO) or Assistant PIO. Under the law, they must respond within 30 days.`;
      } else if (lowerMsg.includes("complain") || lowerMsg.includes("pothole") || lowerMsg.includes("garbage")) {
        reply += `### How to escalate local issues in Indian Municipalities:
1. **Document Everything**: Take clear photos with timestamps and location tags.
2. **Use Official Portals**: Use platforms like BBMP Sahaya (Bengaluru), MCGM/BMC website (Mumbai), MCD 311 App (Delhi), or Namma Chennai App (Chennai).
3. **Approach the Ward Committee**: Attend monthly Ward Committee meetings. In cities like Bengaluru, ward committee meetings are legally mandated to allow citizen participation.
4. **Draft Formal Complaints**: Use CivicMind's 'Download Official Draft' tool to generate formal letters to submit directly to your Ward Officer.`;
      } else {
        reply += `I can assist you with:
- **Drafting formal civic complaint letters** tailored to BBMP, BMC, MCD, GCC, and more.
- **Explaining the RTI Act, 2005** and drafting RTI questions for local ward expenditures.
- **Explaining your civic rights** and citizen-centric municipal laws.

Feel free to ask a more specific question, or set up the GEMINI_API_KEY to experience full conversational intelligence!`;
      }

      return res.json({ text: reply });
    }

    const systemPrompt = `You are CivicMind AI, an exceptionally knowledgeable urban governance advisor and citizen empowerment coach specializing in Indian civic administration.
Your primary objective is to assist Indian citizens in navigating municipal bureaucracies, understanding their rights, and taking active part in local governance (active citizenship).
Keep your tone encouraging, authoritative, polite, and highly practical.
You are fluent in details about:
- Local municipal acts (such as the Karnataka Municipal Corporations Act, Maharashtra Municipal Corporations Act, Delhi Municipal Corporation Act).
- The Right to Information (RTI) Act, 2005, and how to draft effective queries to expose municipal inaction or budget diversions.
- Ward committees, citizen participation, and solid waste management bylaws.
- Practical steps citizens can take to resolve civic issues conversationally.

Explain bureaucratic terms clearly. Where appropriate, provide step-by-step instructions. Keep formatting beautifully structured using Markdown. Always reference realistic Indian administrative systems (e.g., Ward Officers, Corporators, MLAs, Junior Engineers, Public Information Officers).`;

    const chatHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Start a chat session using modern SDK
    // Create the session
    const chat = gemini.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({
      message: message
    });

    res.json({ text: result.text || "" });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({ error: "Failed to generate AI response." });
  }
});

// Generate custom RTI draft for an issue
app.post("/api/ai/rti-draft", async (req, res) => {
  try {
    const { issueId, applicantName, applicantAddress } = req.body;

    if (!issueId || !applicantName) {
      return res.status(400).json({ error: "Issue ID and Applicant Name are required." });
    }

    const issues = readIssues();
    const issue = issues.find(i => i.id === issueId);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found." });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      // Return high-quality standard RTI draft fallback
      const standardRti = `FORM 'A'
Form of Application for seeking Information under the Right to Information Act, 2005

To,
The Public Information Officer (PIO) / Assistant PIO,
Office of the Ward Executive Engineer / Ward Commissioner,
${issue.aiAnalysis?.targetAuthority || "Local Municipal Authority Division"},
${issue.location.city}, ${issue.location.state}.

1. Full Name of Applicant: ${applicantName}
2. Permanent Address: ${applicantAddress || "As per record / Mobile-OTP registered"}
3. Particulars of Information Solicited:
   Concerning the persistent issue of "${issue.title}" located at ${issue.location.area}, ${issue.location.city} (Reference reported on CivicMind Platform).

   Please provide certified copies / answers for the following:
   a) Provide details of all funds sanctioned, allocated, and released for road repair/drainage/civic works at ${issue.location.area} for the financial years 2024-25 and 2025-26.
   b) Provide a certified copy of the Work Order, Bill of Quantities (BoQ), and the Agreement with the contractor assigned to maintain this stretch of public infrastructure.
   c) Provide the name, designation, and official email/contact of the public officer/junior engineer responsible for supervising this contractor's work.
   d) If no funds have been sanctioned or works executed despite public reports, please provide the inspection registers or official file-notings showing the reasons for the delay in addressing this hazard.
   e) What is the average resolution time prescribed under the citizen charter of the ${issue.location.city} Municipal Corporation for solving this category of complaint?

4. Application Fee: I am attaching a Court Fee Stamp / IPO of Rs. 10/- herewith (No. ____________).
5. I state that I am a citizen of India.

Date: ${new Date().toLocaleDateString("en-IN")}
Place: ${issue.location.city}

Signature of Applicant: _________________`;
      return res.json({ rtiDraft: standardRti });
    }

    const prompt = `You are an expert RTI (Right to Information, 2005) consultant in India.
Draft a highly professional, strategically targeted RTI Application form under Section 6(1) of the RTI Act, 2005, requesting detailed administrative data regarding this unresolved civic issue:

Issue Title: "${issue.title}"
Issue Location: "${issue.location.area}, ${issue.location.city}, ${issue.location.state}"
Issue Description: "${issue.description}"
Applicant Name: "${applicantName}"
Applicant Address: "${applicantAddress || "Resident of " + issue.location.city}"

Your goal is to write questions that force the municipal body to reveal:
1. Budget allocations and actual expenditure for maintenance/repairs in this specific area over the last 2 years.
2. The contractor details, work orders, completion certificates, or delay penalties assessed.
3. The names and designations of the Junior Engineers or Ward officials responsible for monitoring and verifying this asset.
4. Inspections made on this spot and file-notings related to citizen complaints.

Include standard RTI format header (Form A, Section 6(1) mention), fee section (stamp details), and citizen declaration. Use elegant markdown to present the draft.`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ rtiDraft: response.text || "" });
  } catch (error) {
    console.error("RTI generation error:", error);
    res.status(500).json({ error: "Failed to generate RTI draft." });
  }
});

// Configure Vite middleware or production static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicMind India server listening on port ${PORT}`);
  });
}

setupServer();
