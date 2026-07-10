import type { Metadata } from "next";
import { AppShell } from "../components/app-shell";
export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() { return <AppShell eyebrow="Configuration" title="Settings"><section className="settings-card"><div><span>Data policy</span><h2>Public information only</h2><p>DomainHunter AI is designed to retain source evidence and never invent contact data.</p></div><div className="status-pill">Enabled</div></section><section className="settings-card muted"><div><span>Connectors</span><h2>Data sources</h2><p>Connector configuration becomes available in a later milestone.</p></div><div className="status-pill neutral">Not configured</div></section></AppShell>; }
