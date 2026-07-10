import type { Metadata } from "next";
import { AppShell, EmptyState } from "../components/app-shell";
export const metadata: Metadata = { title: "Dashboard" };
export default function DashboardPage() { return <AppShell eyebrow="Overview" title="Dashboard"><div className="metric-grid"><article><span>Projects</span><strong>0</strong><small>Ready for your first project</small></article><article><span>Domains analyzed</span><strong>0</strong><small>Analysis history will appear here</small></article><article><span>Qualified buyers</span><strong>0</strong><small>Evidence-backed leads only</small></article></div><EmptyState label="Start with a domain" description="Run your first analysis to populate buyer signals, projects, and market insights." /></AppShell>; }
