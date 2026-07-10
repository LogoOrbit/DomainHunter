import { AppShell } from "../components/app-shell"; import { IntelligenceWorkspace } from "../components/intelligence-workspace";
export default function Page() { return <AppShell eyebrow="Pricing intelligence" title="Domain valuation"><IntelligenceWorkspace mode="valuation" /></AppShell>; }
