"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CompanyListItem, ScanView } from "@/server/src/lead-discovery/types";

type Results = { items: CompanyListItem[]; nextCursor: string | null; total: number };
type Filters = { search: string; country: string; industry: string; minBuyerScore: string; minConfidence: string; companySize: string; fundingStage: string; keyword: string; sort: string };
const EMPTY_FILTERS: Filters = { search: "", country: "", industry: "", minBuyerScore: "", minConfidence: "", companySize: "", fundingStage: "", keyword: "", sort: "buyerScore" };

export function LeadDiscoveryClient() {
  const query = useSearchParams();
  const domainId = query.get("domainId");
  const existingScanId = query.get("scanId");
  const started = useRef(false);
  const [scan, setScan] = useState<ScanView | null>(null);
  const [results, setResults] = useState<Results>({ items: [], nextCursor: null, total: 0 });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [savedFilters, setSavedFilters] = useState<{ id: string; name: string; filters: Partial<Filters> }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (existingScanId) {
      void requestJson<{ scan: ScanView }>(`/api/discovery/scans/${existingScanId}`).then((value) => setScan(value.scan)).catch((caught) => setError(message(caught)));
    } else if (domainId) {
      void requestJson<{ scan: ScanView }>("/api/discovery/scans", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domainId }) }).then((value) => setScan(value.scan)).catch((caught) => setError(message(caught)));
    }
  }, [domainId, existingScanId]);

  useEffect(() => {
    if (!scan || !["QUEUED", "RUNNING"].includes(scan.status)) return;
    const timer = setInterval(() => { void requestJson<{ scan: ScanView }>(`/api/discovery/scans/${scan.id}`).then((value) => setScan(value.scan)).catch((caught) => setError(message(caught))); }, 2_000);
    return () => clearInterval(timer);
  }, [scan]);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams({ pageSize: "50", sort: filters.sort });
    for (const [key, value] of Object.entries(filters)) if (value && key !== "sort") params.set(key, value);
    return params.toString();
  }, [filters]);
  const scanId = scan?.id;
  const scanDomainId = scan?.domainId;
  const companiesFound = scan?.companiesFound;
  const scanStatus = scan?.status;

  useEffect(() => {
    if (!scanId) return;
    const timer = setTimeout(() => { void requestJson<{ results: Results }>(`/api/discovery/scans/${scanId}/results?${filterQuery}`).then((value) => setResults(value.results)).catch((caught) => setError(message(caught))); }, 250);
    return () => clearTimeout(timer);
  }, [scanId, companiesFound, scanStatus, filterQuery]);

  useEffect(() => { if (!scanDomainId) return; void requestJson<{ filters: { id: string; name: string; filters: Partial<Filters> }[] }>(`/api/discovery/filters?domainId=${scanDomainId}`).then((value) => setSavedFilters(value.filters)).catch(() => undefined); }, [scanDomainId]);

  async function control(action: "pause" | "resume" | "cancel") { if (!scan) return; try { setScan((await requestJson<{ scan: ScanView }>(`/api/discovery/scans/${scan.id}/${action}`, { method: "POST" })).scan); } catch (caught) { setError(message(caught)); } }
  async function bookmarkSelected() { await Promise.all([...selected].map((id) => requestJson(`/api/companies/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookmarked: true }) }))); setResults((current) => ({ ...current, items: current.items.map((item) => selected.has(item.id) ? { ...item, bookmarked: true } : item) })); }
  async function saveFilters() { if (!scan) return; const name = window.prompt("Saved filter name"); if (!name?.trim()) return; const value = await requestJson<{ filter: { id: string; name: string; filters: Partial<Filters> } }>("/api/discovery/filters", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domainId: scan.domainId, name, filters }) }); setSavedFilters((current) => [value.filter, ...current]); }

  if (!domainId && !existingScanId) return <section className="empty-state"><span className="empty-icon">◇</span><h2>Choose an analyzed domain</h2><p>Open a domain intelligence report and select “Discover public leads” to begin.</p><Link href="/domain-analysis">Domain analysis <span>→</span></Link></section>;
  if (error && !scan) return <section className="analysis-error"><span>Discovery unavailable</span><h2>{error}</h2></section>;
  if (!scan) return <div className="scan-loading"><span className="analysis-spinner" />Creating public-source scan…</div>;

  return <div className="lead-workspace">
    <section className="scan-panel">
      <div className="scan-summary"><div><span className={`scan-state ${scan.status.toLowerCase()}`}>{scan.status}</span><h2>{scan.domain || "Public lead scan"}</h2><p>{scan.processedQueries} of {scan.totalQueries} searches · {scan.companiesFound} unique companies · {scan.duplicateMerges} duplicates merged</p></div><div className="scan-controls">{scan.status === "RUNNING" && <button onClick={() => void control("pause")}>Pause</button>}{["PAUSED", "FAILED"].includes(scan.status) && <button onClick={() => void control("resume")}>Resume</button>}{!["COMPLETED", "CANCELLED"].includes(scan.status) && <button className="secondary" onClick={() => void control("cancel")}>Cancel</button>}</div></div>
      <div className="progress-track"><i style={{ width: `${scan.progress}%` }} /></div><div className="progress-meta"><b>{scan.progress}% complete</b><span>{scan.estimatedSecondsLeft === null ? "Estimating time…" : scan.estimatedSecondsLeft === 0 ? "Complete" : `About ${scan.estimatedSecondsLeft}s remaining`}</span></div>
      <div className="connector-grid">{scan.connectorStatus.map((connector) => <article key={connector.id}><i className={connector.health} /><div><b>{connector.name}</b><span>{connector.error ?? `${connector.records} records collected`}</span></div></article>)}</div>
      {scan.errors.length > 0 && <details className="scan-errors"><summary>{scan.errors.length} connector warning{scan.errors.length === 1 ? "" : "s"}</summary>{scan.errors.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</details>}
    </section>

    <section className="results-panel">
      <div className="results-toolbar"><div><span>PUBLIC BUYER CANDIDATES</span><h2>{results.total} companies</h2></div><div className="bulk-actions">{savedFilters.length > 0 && <select aria-label="Saved filters" defaultValue="" onChange={(event) => { const preset = savedFilters.find((item) => item.id === event.target.value); if (preset) setFilters({ ...EMPTY_FILTERS, ...Object.fromEntries(Object.entries(preset.filters).map(([key, value]) => [key, value === undefined ? "" : String(value)])) }); }}><option value="" disabled>Saved filters</option>{savedFilters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}{selected.size > 0 && <button onClick={() => void bookmarkSelected()}>Bookmark {selected.size}</button>}<button onClick={() => void saveFilters()}>Save filters</button><button onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button></div></div>
      <div className="lead-filters"><input aria-label="Search companies" placeholder="Search companies, domains, keywords…" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /><input placeholder="Country" value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })} /><input placeholder="Industry" value={filters.industry} onChange={(event) => setFilters({ ...filters, industry: event.target.value })} /><input type="number" min="0" max="100" placeholder="Min buyer score" value={filters.minBuyerScore} onChange={(event) => setFilters({ ...filters, minBuyerScore: event.target.value })} /><input type="number" min="0" max="100" placeholder="Min confidence" value={filters.minConfidence} onChange={(event) => setFilters({ ...filters, minConfidence: event.target.value })} /><input placeholder="Keyword" value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} /><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="buyerScore">Buyer score</option><option value="confidence">Confidence</option><option value="name">Company name</option><option value="collectedAt">Recently collected</option></select></div>
      <div className="lead-table-wrap"><table className="lead-table"><thead><tr><th><input type="checkbox" aria-label="Select all" checked={results.items.length > 0 && selected.size === results.items.length} onChange={(event) => setSelected(event.target.checked ? new Set(results.items.map((item) => item.id)) : new Set())} /></th><th>Company</th><th>Industry</th><th>Location</th><th>Buyer score</th><th>Confidence</th><th>Evidence</th></tr></thead><tbody>{results.items.map((company) => <tr key={company.id}><td><input type="checkbox" aria-label={`Select ${company.name}`} checked={selected.has(company.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(company.id)) next.delete(company.id); else next.add(company.id); return next; })} /></td><td><Link href={`/companies/${company.id}`}><b>{company.name}</b><span>{company.officialDomain ?? company.website ?? "Public profile"}</span></Link></td><td>{company.industry ?? "—"}</td><td>{[company.city, company.country].filter(Boolean).join(", ") || "—"}</td><td><strong className="buyer-score">{company.score.buyerScore}</strong></td><td>{company.score.confidenceScore}%</td><td>{company.sourceCount} source{company.sourceCount === 1 ? "" : "s"}{company.bookmarked && <em>★</em>}</td></tr>)}</tbody></table>{results.items.length === 0 && <div className="no-results">{scan.status === "COMPLETED" ? "No companies match these filters." : "Results will appear as connectors find public organizations."}</div>}</div>
    </section>
  </div>;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> { const response = await fetch(url, init); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Request failed"); return payload as T; }
function message(error: unknown) { return error instanceof Error ? error.message : "Request failed"; }
