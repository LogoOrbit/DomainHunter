import { AppShell } from "../components/app-shell"; import { IntelligenceWorkspace } from "../components/intelligence-workspace";
export default function Page() { return <AppShell eyebrow="Buyer intelligence" title="Buyer rankings"><IntelligenceWorkspace mode="buyers" /></AppShell>; }
