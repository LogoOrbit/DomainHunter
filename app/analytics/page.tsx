import { AppShell } from "../components/app-shell"; import { IntelligenceWorkspace } from "../components/intelligence-workspace";
export default function Page() { return <AppShell eyebrow="Performance intelligence" title="Domain analytics"><IntelligenceWorkspace mode="analytics" /></AppShell>; }
