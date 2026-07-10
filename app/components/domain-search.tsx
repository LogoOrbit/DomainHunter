"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function DomainSearch() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!DOMAIN_PATTERN.test(normalized)) {
      setError("Enter a valid domain, such as ip.xyz");
      return;
    }
    setError("");
    router.push(`/domain-analysis?domain=${encodeURIComponent(normalized)}`);
  }

  return (
    <form className="domain-search" onSubmit={submit} noValidate>
      <div className="search-box">
        <span className="search-icon" aria-hidden="true" />
        <label className="sr-only" htmlFor="domain">Domain name</label>
        <input
          id="domain"
          name="domain"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="Enter a domain — e.g. ip.xyz"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={error ? "domain-error" : undefined}
          aria-invalid={Boolean(error)}
        />
        <button type="submit">Analyze domain <span>→</span></button>
      </div>
      {error && <p className="search-error" id="domain-error" role="alert">{error}</p>}
    </form>
  );
}
