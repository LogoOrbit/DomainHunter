import type { ParsedDomain, SemanticMeaning } from "../types.ts";

export type SemanticContext = { domain: ParsedDomain };

export interface SemanticProvider {
  readonly id: string;
  expand(context: SemanticContext): Promise<Omit<SemanticMeaning, "industries" | "useCases">[]>;
}
