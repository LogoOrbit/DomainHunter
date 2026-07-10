import type { IndustrySuggestion, SemanticMeaning, UseCaseSuggestion } from "./types.ts";

type IndustrySeed = [name: string, category: string, relevance: number];
type UseCaseSeed = [title: string, description: string, relevance: number];

const INDUSTRIES: Record<string, IndustrySeed[]> = {
  "Internet Protocol": [["Networking", "Technology", 98], ["Cloud Infrastructure", "Technology", 95], ["Cybersecurity", "Security", 94], ["Internet Infrastructure", "Telecommunications", 93], ["Hosting", "Technology", 88], ["Developer Tools", "Software", 86]],
  "Intellectual Property": [["Law Firms", "Legal", 98], ["Patent Software", "Legal Technology", 96], ["Legal AI", "Legal Technology", 94], ["Licensing", "Business Services", 91], ["Research Commercialization", "Research", 86]],
  "Identity Platform": [["Identity Verification", "Security", 97], ["Authentication", "Cybersecurity", 96], ["Fintech", "Finance", 86], ["Enterprise SaaS", "Software", 84]],
  "Information Platform": [["Data Platforms", "Software", 94], ["Business Intelligence", "Data", 91], ["Publishing", "Media", 83], ["Knowledge Management", "Software", 87]],
  "Innovation Platform": [["Venture Capital", "Finance", 90], ["Corporate Innovation", "Business Services", 94], ["Research", "Science", 88], ["Startup Ecosystems", "Technology", 86]],
  "Investment Platform": [["Wealth Management", "Finance", 96], ["Fintech", "Finance", 95], ["Brokerage", "Finance", 91], ["Alternative Assets", "Finance", 88]],
  "Infrastructure Platform": [["Cloud Infrastructure", "Technology", 97], ["DevOps", "Software", 94], ["Enterprise IT", "Technology", 90], ["Developer Tools", "Software", 88]],
  "Image Processing": [["Computer Vision", "Artificial Intelligence", 97], ["Medical Imaging", "Healthcare", 90], ["Creative Software", "Software", 86], ["Industrial Automation", "Manufacturing", 84]],
  "Internet Privacy": [["Privacy Technology", "Cybersecurity", 97], ["VPN Services", "Cybersecurity", 92], ["Consumer Security", "Security", 89], ["Compliance", "Legal Technology", 84]],
  "Internet Provider": [["Internet Service Providers", "Telecommunications", 97], ["Broadband", "Telecommunications", 94], ["Wireless Networks", "Telecommunications", 89], ["Managed IT", "Technology", 82]],
  Technology: [["Software", "Technology", 88], ["Developer Tools", "Software", 84], ["Enterprise IT", "Technology", 80]],
  Brand: [["Digital Commerce", "Commerce", 78], ["Consumer Products", "Consumer", 74], ["Professional Services", "Business Services", 72]],
};

const USE_CASES: Record<string, UseCaseSeed[]> = {
  "Internet Protocol": [["IP lookup platform", "Search and inspect public IP address metadata.", 98], ["IP geolocation", "Resolve network addresses to approximate geographic signals.", 96], ["Cybersecurity SaaS", "Detect suspicious addresses and network activity.", 94], ["Network analytics", "Monitor traffic, address space, and connectivity performance.", 92], ["Developer API", "Provide programmable IP intelligence to applications.", 88]],
  "Intellectual Property": [["IP portfolio management", "Track patents, trademarks, deadlines, and ownership.", 98], ["Patent intelligence", "Search and analyze patent landscapes and competitors.", 95], ["Licensing marketplace", "Connect rights holders with commercial licensees.", 91], ["Legal AI assistant", "Support public-record IP research and workflow automation.", 89]],
  "Identity Platform": [["Identity verification", "Verify people or businesses during onboarding.", 97], ["Authentication service", "Provide secure login and access management.", 95], ["Identity developer API", "Embed reusable identity capabilities in software.", 91]],
  "Investment Platform": [["Digital investing", "Offer research, portfolio, and transaction workflows.", 96], ["Alternative asset marketplace", "Connect qualified participants with private opportunities.", 88], ["Portfolio analytics", "Measure allocation, risk, and performance.", 90]],
  "Image Processing": [["Computer vision API", "Analyze and transform images programmatically.", 96], ["Medical image analysis", "Assist imaging workflows with automated measurement.", 88], ["Creative image tools", "Enhance, resize, classify, and generate visual assets.", 91]],
  "Internet Privacy": [["Privacy dashboard", "Audit exposed data and privacy settings.", 94], ["Secure browsing", "Protect network traffic and reduce tracking.", 92], ["Privacy compliance", "Manage consent, requests, and privacy controls.", 86]],
};

export function enrichMeaning(meaning: Omit<SemanticMeaning, "industries" | "useCases">): SemanticMeaning {
  const industries = (INDUSTRIES[meaning.phrase] ?? INDUSTRIES[meaning.category] ?? INDUSTRIES.Technology).map(toIndustry);
  const useCases = (USE_CASES[meaning.phrase] ?? defaultUseCases(meaning)).map(toUseCase);
  return { ...meaning, industries: sortByRelevance(industries), useCases: sortByRelevance(useCases) };
}

function defaultUseCases(meaning: Omit<SemanticMeaning, "industries" | "useCases">): UseCaseSeed[] {
  const phrase = meaning.phrase;
  return [[`${phrase} platform`, `A focused digital platform serving the ${phrase.toLowerCase()} market.`, 84], [`${phrase} analytics`, `Measure and interpret operational signals related to ${phrase.toLowerCase()}.`, 78], [`${phrase} API`, `Expose reusable ${phrase.toLowerCase()} capabilities to software teams.`, 74]];
}

function toIndustry([name, category, relevance]: IndustrySeed): IndustrySuggestion { return { slug: slugify(name), name, category, relevance }; }
function toUseCase([title, description, relevance]: UseCaseSeed): UseCaseSuggestion { return { title, description, relevance }; }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function sortByRelevance<T extends { relevance: number }>(items: T[]): T[] { return [...items].sort((a, b) => b.relevance - a.relevance); }
