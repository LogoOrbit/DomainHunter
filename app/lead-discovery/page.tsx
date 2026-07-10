import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "../components/app-shell";
import { LeadDiscoveryClient } from "./components/lead-discovery-client";
export const metadata: Metadata = { title: "Lead discovery" };
export default function LeadDiscoveryPage() { return <AppShell eyebrow="Public sources" title="Lead discovery"><Suspense fallback={<div className="scan-loading">Loading discovery workspace…</div>}><LeadDiscoveryClient /></Suspense></AppShell>; }
