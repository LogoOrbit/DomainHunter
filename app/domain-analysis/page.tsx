import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "../components/app-shell";
import { AnalysisClient } from "./components/analysis-client";

export const metadata: Metadata = { title: "Domain analysis" };

export default function DomainAnalysisPage() {
  return (
    <AppShell eyebrow="Intelligence" title="Domain analysis">
      <Suspense fallback={<AnalysisLoading />}>
        <AnalysisClient />
      </Suspense>
    </AppShell>
  );
}

function AnalysisLoading() {
  return <section className="analysis-loading" aria-live="polite"><span className="analysis-spinner" /><p>Preparing domain intelligence…</p></section>;
}
