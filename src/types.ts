export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface AIAnalysis {
  severity: string;
  targetAuthority: string;
  temporarySolutions: string[];
  officialDraft: string;
  socialMediaDraft: string;
}

export interface Issue {
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

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}
