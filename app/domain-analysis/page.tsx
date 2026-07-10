import type { Metadata } from "next";
import { AppShell, EmptyState } from "../components/app-shell";
export const metadata: Metadata = { title: "Domain analysis" };
export default function DomainAnalysisPage() { return <AppShell eyebrow="Intelligence" title="Domain analysis"><EmptyState label="Analysis is ready to begin" description="Brandability, commercial value, meanings, industries, buyer personas, and valuation will live here." /></AppShell>; }
