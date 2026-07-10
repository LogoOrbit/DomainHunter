"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AnalysisResult, DomainAnalysisRecord, ScoreName } from "@/server/src/domain-intelligence/types";

const SCORE_LABELS: [ScoreName, string][] = [
  ["premium", "Premium score"], ["commercialPotential", "Commercial potential"],
  ["brandability", "Brandability"], ["memorability", "Memorability"],
  ["pronounceability", "Pronounceability"], ["length", "Length"],
  ["seoFriendliness", "SEO friendliness"], ["globalUsability", "Global usability"],
  ["startupFriendliness", "Startup friendliness"],
];

export function AnalysisClient() {
  const query = useSearchParams();
  const domain = query.get("domain");
  const [analysis, setAnalysis] = useState<DomainAnalysisRecord | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(Boolean(domain));
  const [error, setError] = useState("");

  const analyze = useCallback(async (refresh = false) => {
    if (!domain) return;
    setLoading(true);
    setError("");
    try {
      const payload = await requestAnalysis(domain, refresh);
      setAnalysis(payload.analysis);
      setCached(payload.cached);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis could not be completed");
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    if (!domain) return;
    const controller = new AbortController();
    void requestAnalysis(domain, false, controller.signal)
      .then((payload) => { setAnalysis(payload.analysis); setCached(payload.cached); setError(""); })
      .catch((caught: unknown) => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Analysis could not be completed"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [domain]);

  if (!domain) return <EmptyAnalysis />;
  if (loading && !analysis) return <section className="analysis-loading" aria-live="polite"><span className="analysis-spinner" /><h2>Analyzing {domain}</h2><p>Scoring quality, expanding meanings, and ranking markets.</p></section>;
  if (error && !analysis) return <section className="analysis-error"><span>Analysis unavailable</span><h2>{error}</h2><button onClick={() => void analyze(false)}>Try again</button></section>;
  if (!analysis) return null;

  return (
    <div className="analysis-report">
      <section className="analysis-hero-card">
        <div>
          <span className="analysis-kicker">Intelligence report</span>
          <h2>{analysis.parsed.domain}</h2>
          <p><b>{analysis.parsed.rootKeyword}</b> · .{analysis.parsed.extension} · {analysis.metrics.characterCount} characters · {analysis.metrics.wordCount} word{analysis.metrics.wordCount === 1 ? "" : "s"}</p>
        </div>
        <div className="analysis-actions">
          {cached && <span className="cache-badge">Cached analysis</span>}
          <button disabled={loading} onClick={() => void analyze(true)}>{loading ? "Refreshing…" : "Refresh analysis"}</button>
        </div>
      </section>

      <section className="score-grid" aria-label="Domain scores">
        {SCORE_LABELS.map(([key, label]) => <ScoreCard key={key} label={label} score={analysis.scores[key]} primary={key === "premium" || key === "commercialPotential"} />)}
      </section>

      <section className="report-section">
        <div className="report-heading"><span>SEMANTIC EXPANSION</span><h2>{analysis.semanticMeanings.length} credible interpretations</h2><p>Ranked by contextual confidence and enriched with market applications.</p></div>
        <div className="meaning-list">
          {analysis.semanticMeanings.map((meaning, index) => (
            <article className="meaning-card" key={meaning.phrase}>
              <div className="meaning-rank">{String(index + 1).padStart(2, "0")}</div>
              <div className="meaning-copy"><div className="meaning-title"><h3>{meaning.phrase}</h3><span>{meaning.category}</span><b>{Math.round(meaning.confidence * 100)}%</b></div><p>{meaning.explanation}</p>
                <div className="meaning-columns">
                  <div><h4>Relevant industries</h4>{meaning.industries.map((industry) => <div className="ranked-item" key={industry.slug}><span>{industry.name}</span><i><em style={{ width: `${industry.relevance}%` }} /></i><b>{industry.relevance}</b></div>)}</div>
                  <div><h4>Business use cases</h4>{meaning.useCases.map((useCase) => <div className="use-case" key={useCase.title}><span>{useCase.title}</span><p>{useCase.description}</p></div>)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="quality-grid">
        <QualityCard title="Strengths" tone="positive" items={analysis.quality.strengths} />
        <QualityCard title="Weaknesses" tone="caution" items={analysis.quality.weaknesses} />
        <QualityCard title="Opportunities" tone="positive" items={analysis.quality.opportunities} />
        <QualityCard title="Risks" tone="caution" items={analysis.quality.risks} />
      </section>

      <section className="buyer-profile-card">
        <div><span>IDEAL BUYER PROFILE</span><h2>{analysis.quality.idealBuyerProfile}</h2><p>{analysis.quality.globalMarketSuitability.summary}</p></div>
        <div className="global-score"><strong>{analysis.quality.globalMarketSuitability.score}</strong><span>Global market<br />suitability</span></div>
      </section>
    </div>
  );
}

async function requestAnalysis(domain: string, refresh: boolean, signal?: AbortSignal): Promise<AnalysisResult> {
  const response = await fetch("/api/domain/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ domain, refresh }),
    signal,
  });
  const payload = await response.json() as AnalysisResult | { error: { message: string } };
  if (!response.ok || !("analysis" in payload)) throw new Error("error" in payload ? payload.error.message : "Analysis failed");
  return payload;
}

function ScoreCard({ label, score, primary }: { label: string; score: number; primary?: boolean }) {
  return <article className={`score-card${primary ? " primary" : ""}`}><div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><strong>{score}</strong></div><span>{label}</span><small>{score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 55 ? "Moderate" : "Limited"}</small></article>;
}

function QualityCard({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  return <article className={`quality-card ${tone}`}><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>;
}

function EmptyAnalysis() {
  return <section className="empty-state"><span className="empty-icon">◇</span><h2>Analyze a domain</h2><p>Start from the homepage to generate a complete quality, semantic, industry, and use-case report.</p><Link href="/">Enter a domain <span>→</span></Link></section>;
}
