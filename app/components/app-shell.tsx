import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Results", "/results"],
  ["Domain analysis", "/domain-analysis"],
  ["Lead discovery", "/lead-discovery"],
  ["Valuation", "/valuation"],
  ["Buyer rankings", "/buyer-rankings"],
  ["Outreach", "/outreach"],
  ["Negotiation", "/negotiation"],
  ["Analytics", "/analytics"],
  ["Opportunities", "/opportunities"],
  ["Recommendations", "/recommendations"],
  ["Monitoring", "/monitoring"],
  ["Alerts", "/alerts"],
  ["Trends", "/trends"],
  ["Watchlists", "/watchlists"],
  ["Reminders", "/reminders"],
  ["AI workspace", "/ai-workspace"],
  ["Integrations", "/integrations"],
  ["Reports", "/reports"],
  ["Plugins", "/plugins"],
  ["System health", "/health"],
  ["Command palette", "/command-palette"],
  ["Projects", "/projects"],
  ["Settings", "/settings"],
] as const;

export function AppShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <main className="workspace-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">DH</span><span>DomainHunter <em>AI</em></span></Link>
        <nav aria-label="Workspace navigation">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <div className="sidebar-note"><span>Continuous intelligence</span><p>Valuation, buyers, outreach, and recurring discovery.</p></div>
      </aside>
      <section className="workspace-content">
        <header><div><span className="workspace-eyebrow">{eyebrow}</span><h1>{title}</h1></div><Link href="/">New search</Link></header>
        {children}
      </section>
    </main>
  );
}

export function EmptyState({ label, description }: { label: string; description: string }) {
  return <section className="empty-state"><span className="empty-icon">◇</span><h2>{label}</h2><p>{description}</p><Link href="/">Analyze your first domain <span>→</span></Link></section>;
}
