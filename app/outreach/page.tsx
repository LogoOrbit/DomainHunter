import { AppShell } from "../components/app-shell"; import { IntelligenceWorkspace } from "../components/intelligence-workspace";
export default function Page() { return <AppShell eyebrow="Drafts only — never auto-sent" title="Outreach studio"><IntelligenceWorkspace mode="outreach" /></AppShell>; }
