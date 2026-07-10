import Link from "next/link";
import { DomainSearch } from "./components/domain-search";

const capabilities = [
  { number: "01", title: "Understand the asset", copy: "Map meanings, industries, use cases, and buyer personas before searching." },
  { number: "02", title: "Discover the market", copy: "Find public companies, startups, institutions, and decision-makers across modular sources." },
  { number: "03", title: "Prioritize the right buyers", copy: "Merge duplicates, preserve source evidence, and rank every lead by fit and confidence." },
];

export default function Home() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="DomainHunter AI home">
          <span className="brand-mark">DH</span>
          <span>DomainHunter <em>AI</em></span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <Link className="nav-cta" href="/projects">View projects <span>↗</span></Link>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> Domain intelligence, grounded in public data</div>
        <h1>Find the companies<br />that should own <span>your domain.</span></h1>
        <p className="hero-copy">
          Turn a domain into a ranked market of credible buyers. Analyze every meaning,
          discover matching organizations, and keep the evidence behind every lead.
        </p>
        <DomainSearch />
        <div className="search-footnote">
          <span>PUBLIC SOURCES ONLY</span>
          <span className="dot">•</span>
          <span>EVIDENCE-BACKED RESULTS</span>
          <span className="dot">•</span>
          <span>LOCAL-FIRST WORKSPACE</span>
        </div>

        <div className="signal-card" aria-label="Example buyer signal">
          <div className="signal-top">
            <span className="signal-label"><i /> Buyer signal</span>
            <span className="signal-score">92</span>
          </div>
          <div className="signal-domain">ip.xyz</div>
          <div className="signal-row"><span>Semantic match</span><b>Intellectual property</b></div>
          <div className="signal-row"><span>Buyer segment</span><b>Legal technology</b></div>
          <div className="signal-row"><span>Confidence</span><b className="positive">High</b></div>
          <div className="signal-bars"><i /><i /><i /><i /><i /></div>
        </div>
      </section>

      <section className="capabilities" aria-labelledby="workflow-title">
        <div className="section-intro">
          <span>THE WORKFLOW</span>
          <h2 id="workflow-title">From domain name<br />to buyer shortlist.</h2>
        </div>
        <div className="capability-grid">
          {capabilities.map((item) => (
            <article key={item.number}>
              <span className="capability-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <span className="arrow">↗</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
