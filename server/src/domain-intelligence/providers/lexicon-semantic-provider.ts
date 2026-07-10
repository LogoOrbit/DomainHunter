import type { SemanticProvider } from "./semantic-provider.ts";

type MeaningSeed = { phrase: string; confidence: number; category: string; explanation: string };

const LEXICON: Record<string, MeaningSeed[]> = {
  ip: [
    ["Internet Protocol", .98, "Technology", "The standard abbreviation for network addressing and internet communication."],
    ["Intellectual Property", .97, "Legal", "A widely recognized term for patents, trademarks, copyrights, and other protected assets."],
    ["Identity Platform", .88, "Identity", "A concise brand for authentication, verification, and digital identity infrastructure."],
    ["Information Platform", .86, "Data", "A broad interpretation for products that organize, publish, or exchange information."],
    ["Innovation Platform", .84, "Business", "A strong fit for venture building, research commercialization, and innovation programs."],
    ["Investment Platform", .83, "Finance", "A natural abbreviation for digital investing, portfolio, or capital-market products."],
    ["Infrastructure Platform", .82, "Technology", "A credible positioning for cloud, developer, and enterprise infrastructure."],
    ["Image Processing", .80, "Artificial Intelligence", "A standard technical phrase in computer vision and imaging systems."],
    ["Internet Privacy", .79, "Cybersecurity", "A relevant interpretation for privacy, protection, and secure browsing services."],
    ["Internet Provider", .76, "Telecommunications", "A recognizable shorthand for connectivity and internet service providers."],
  ].map(([phrase, confidence, category, explanation]) => ({ phrase: String(phrase), confidence: Number(confidence), category: String(category), explanation: String(explanation) })),
  ai: seeds(["Artificial Intelligence", "AI systems, agents, and intelligent software products.", "Artificial Intelligence"], ["Applied Intelligence", "Decision intelligence and analytics products.", "Data"]),
  ml: seeds(["Machine Learning", "Predictive models, training infrastructure, and intelligent applications.", "Artificial Intelligence"], ["Markup Language", "Developer tooling and structured document technologies.", "Technology"]),
  hr: seeds(["Human Resources", "People operations, recruiting, benefits, and workforce software.", "Business"], ["Human Relations", "Employee engagement and organizational culture services.", "Business"]),
  ar: seeds(["Augmented Reality", "Spatial computing and interactive visual experiences.", "Technology"], ["Accounts Receivable", "Billing, collections, and finance automation.", "Finance"]),
  vr: seeds(["Virtual Reality", "Immersive computing, simulation, and entertainment.", "Technology"]),
  ux: seeds(["User Experience", "Product design, research, and usability services.", "Design"]),
  ui: seeds(["User Interface", "Digital interface design systems and component tooling.", "Design"]),
};

export class LexiconSemanticProvider implements SemanticProvider {
  readonly id = "lexicon-v1";

  async expand({ domain }: Parameters<SemanticProvider["expand"]>[0]): Promise<MeaningSeed[]> {
    const exact = LEXICON[domain.rootKeyword];
    if (exact) return exact;

    const phrase = toTitleCase(domain.rootKeywords.join(" "));
    return [{
      phrase,
      confidence: domain.rootKeywords.length > 1 ? .88 : .74,
      category: "Brand",
      explanation: `A direct brand interpretation based on the readable keyword “${phrase}”.`,
    }];
  }
}

function seeds(...values: [string, string, string][]): MeaningSeed[] {
  return values.map(([phrase, explanation, category], index) => ({ phrase, explanation, category, confidence: .96 - index * .1 }));
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
