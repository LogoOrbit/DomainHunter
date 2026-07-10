CREATE TYPE "SearchStatus" AS ENUM ('QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "projects" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "domains" (
  "id" TEXT NOT NULL, "ascii_name" TEXT NOT NULL, "display_name" TEXT NOT NULL, "label" TEXT NOT NULL, "tld" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "domain_searches" (
  "id" TEXT NOT NULL, "project_id" TEXT, "domain_id" TEXT NOT NULL, "status" "SearchStatus" NOT NULL DEFAULT 'QUEUED',
  "started_at" TIMESTAMP(3), "completed_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "domain_searches_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "domain_analysis" (
  "id" TEXT NOT NULL, "domain_id" TEXT NOT NULL, "character_count" INTEGER NOT NULL, "word_count" INTEGER NOT NULL,
  "hyphen_count" INTEGER NOT NULL, "number_count" INTEGER NOT NULL, "letter_count" INTEGER NOT NULL,
  "pronounceability_score" INTEGER NOT NULL, "memorability_score" INTEGER NOT NULL, "brandability_score" INTEGER NOT NULL,
  "length_score" INTEGER NOT NULL, "seo_friendliness" INTEGER NOT NULL, "commercial_potential" INTEGER NOT NULL,
  "premium_score" INTEGER NOT NULL, "global_usability" INTEGER NOT NULL, "startup_friendliness" INTEGER NOT NULL,
  "strengths" TEXT[], "weaknesses" TEXT[], "opportunities" TEXT[], "risks" TEXT[],
  "ideal_buyer_profile" TEXT NOT NULL, "global_market_summary" TEXT NOT NULL,
  "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "domain_analysis_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "semantic_meanings" (
  "id" TEXT NOT NULL, "analysis_id" TEXT NOT NULL, "phrase" TEXT NOT NULL, "confidence" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL, "explanation" TEXT NOT NULL, "rank" INTEGER NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "semantic_meanings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "industries" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "semantic_industries" (
  "semantic_meaning_id" TEXT NOT NULL, "industry_id" TEXT NOT NULL, "relevance" INTEGER NOT NULL, "rank" INTEGER NOT NULL,
  CONSTRAINT "semantic_industries_pkey" PRIMARY KEY ("semantic_meaning_id", "industry_id")
);
CREATE TABLE "use_cases" (
  "id" TEXT NOT NULL, "semantic_meaning_id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
  "relevance" INTEGER NOT NULL, "rank" INTEGER NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "use_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");
CREATE UNIQUE INDEX "domains_ascii_name_key" ON "domains"("ascii_name");
CREATE INDEX "domains_label_idx" ON "domains"("label");
CREATE INDEX "domains_tld_idx" ON "domains"("tld");
CREATE INDEX "domain_searches_project_id_created_at_idx" ON "domain_searches"("project_id", "created_at");
CREATE INDEX "domain_searches_domain_id_status_idx" ON "domain_searches"("domain_id", "status");
CREATE INDEX "domain_searches_status_created_at_idx" ON "domain_searches"("status", "created_at");
CREATE UNIQUE INDEX "domain_analysis_domain_id_key" ON "domain_analysis"("domain_id");
CREATE INDEX "domain_analysis_premium_score_idx" ON "domain_analysis"("premium_score");
CREATE INDEX "domain_analysis_commercial_potential_idx" ON "domain_analysis"("commercial_potential");
CREATE INDEX "domain_analysis_analyzed_at_idx" ON "domain_analysis"("analyzed_at");
CREATE INDEX "semantic_meanings_analysis_id_rank_idx" ON "semantic_meanings"("analysis_id", "rank");
CREATE UNIQUE INDEX "semantic_meanings_analysis_id_phrase_key" ON "semantic_meanings"("analysis_id", "phrase");
CREATE UNIQUE INDEX "industries_slug_key" ON "industries"("slug");
CREATE INDEX "industries_name_idx" ON "industries"("name");
CREATE INDEX "semantic_industries_industry_id_idx" ON "semantic_industries"("industry_id");
CREATE INDEX "semantic_industries_semantic_meaning_id_rank_idx" ON "semantic_industries"("semantic_meaning_id", "rank");
CREATE INDEX "use_cases_semantic_meaning_id_rank_idx" ON "use_cases"("semantic_meaning_id", "rank");
CREATE UNIQUE INDEX "use_cases_semantic_meaning_id_title_key" ON "use_cases"("semantic_meaning_id", "title");

ALTER TABLE "domain_searches" ADD CONSTRAINT "domain_searches_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "domain_searches" ADD CONSTRAINT "domain_searches_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "domain_analysis" ADD CONSTRAINT "domain_analysis_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "semantic_meanings" ADD CONSTRAINT "semantic_meanings_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "domain_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "semantic_industries" ADD CONSTRAINT "semantic_industries_semantic_meaning_id_fkey" FOREIGN KEY ("semantic_meaning_id") REFERENCES "semantic_meanings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "semantic_industries" ADD CONSTRAINT "semantic_industries_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_semantic_meaning_id_fkey" FOREIGN KEY ("semantic_meaning_id") REFERENCES "semantic_meanings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
