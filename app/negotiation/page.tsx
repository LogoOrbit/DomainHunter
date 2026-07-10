import { AppShell } from "../components/app-shell"; import { IntelligenceWorkspace } from "../components/intelligence-workspace";
export default function Page() { return <AppShell eyebrow="Deal planning" title="Negotiation assistant"><IntelligenceWorkspace mode="negotiation" /></AppShell>; }
