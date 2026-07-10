"use client";

import { useEffect, useState } from "react";
import type { CompanyProfile } from "@/server/src/lead-discovery/types";

export function CompanyProfileClient({ id }: { id: string }) {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { void fetch(`/api/companies/${id}`).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message); setCompany(payload.company); setNotes(payload.company.notes ?? ""); }).catch((caught) => setError(caught instanceof Error ? caught.message : "Company could not be loaded")); }, [id]);

  async function update(patch: { bookmarked?: boolean; notes?: string | null }) { const response = await fetch(`/api/companies/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message); setCompany(payload.company); }
  if (error) return <section className="analysis-error"><span>Profile unavailable</span><h2>{error}</h2></section>;
  if (!company) return <div className="scan-loading"><span className="analysis-spinner" />Loading public company evidence…</div>;

  return <div className="company-profile">
    <section className="company-profile-hero"><div><span>{company.industry ?? "Public organization"}</span><h2>{company.name}</h2><p>{company.description ?? "No public description was available from the configured sources."}</p><div className="company-links">{company.website && <a href={company.website} target="_blank" rel="noreferrer">Official website ↗</a>}{company.linkedinUrl && <a href={company.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a>}{company.contactPage && <a href={company.contactPage} target="_blank" rel="noreferrer">Contact page ↗</a>}</div></div><div className="profile-scores"><div><strong>{company.score.buyerScore}</strong><span>Buyer score</span></div><div><strong>{company.score.confidenceScore}</strong><span>Confidence</span></div><button onClick={() => void update({ bookmarked: !company.bookmarked })}>{company.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}</button></div></section>
    <section className="profile-grid"><article><h3>Why it matches</h3><p>{company.score.matchReason}</p></article><article><h3>Company facts</h3><dl><dt>Domain</dt><dd>{company.officialDomain ?? "Not available"}</dd><dt>Headquarters</dt><dd>{company.headquarters ?? ([company.city, company.state, company.country].filter(Boolean).join(", ") || "Not available")}</dd><dt>Company size</dt><dd>{company.companySize ?? "Not available"}</dd><dt>Funding stage</dt><dd>{company.fundingStage ?? "Not available"}</dd></dl></article></section>
    <section className="profile-grid"><article><h3>Public contacts</h3>{company.contacts.length ? company.contacts.map((contact, index) => <div className="contact-row" key={`${contact.type}-${index}`}><span>{contact.type.replaceAll("_", " ")}</span><b>{contact.name ?? contact.value ?? "Public listing"}</b>{contact.title && <small>{contact.title}</small>}<a href={contact.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a></div>) : <p>No public contacts were listed by the configured sources.</p>}</article><article><h3>Industries & keywords</h3><div className="profile-tags">{company.industries.map((industry) => <span key={industry.name}>{industry.name} · {industry.relevance}</span>)}{company.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div></article></section>
    <section className="profile-grid"><article><h3>Public sources</h3>{company.sources.map((source) => <a className="source-row" href={source.sourceUrl} target="_blank" rel="noreferrer" key={source.sourceUrl}><span>{source.connectorId}</span><b>{new Date(source.collectedAt).toLocaleDateString()}</b><em>↗</em></a>)}</article><article><h3>Notes</h3><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add private research notes…" /><button className="save-notes" onClick={() => void update({ notes })}>Save notes</button></article></section>
    <section className="history-card"><h3>Scan history</h3>{company.history.map((item, index) => <div key={`${item.createdAt}-${index}`}><span>{item.eventType.replaceAll("_", " ")}</span><time>{new Date(item.createdAt).toLocaleString()}</time></div>)}</section>
  </div>;
}
