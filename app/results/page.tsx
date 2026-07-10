import type { Metadata } from "next";
import { AppShell, EmptyState } from "../components/app-shell";
export const metadata: Metadata = { title: "Results" };
export default function ResultsPage() { return <AppShell eyebrow="Discovery" title="Buyer results"><EmptyState label="No buyer results yet" description="Potential buyers, public contacts, fit scores, and source evidence will appear here after a search." /></AppShell>; }
