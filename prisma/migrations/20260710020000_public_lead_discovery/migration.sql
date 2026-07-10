-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('BUSINESS_EMAIL', 'SALES_EMAIL', 'SUPPORT_EMAIL', 'PHONE', 'FOUNDER', 'CEO', 'DECISION_MAKER');

-- CreateEnum
CREATE TYPE "ConnectorLogStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'RETRYING', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "official_domain" TEXT,
    "description" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "headquarters" TEXT,
    "linkedin_url" TEXT,
    "contact_page" TEXT,
    "company_size" TEXT,
    "funding_stage" TEXT,
    "latest_funding" TEXT,
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "first_collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "name" TEXT,
    "title" TEXT,
    "value" TEXT,
    "source_url" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_sources" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "field_origins" JSONB NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_scores" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "buyer_score" INTEGER NOT NULL,
    "confidence_score" INTEGER NOT NULL,
    "semantic_relevance" INTEGER NOT NULL,
    "industry_match" INTEGER NOT NULL,
    "brand_similarity" INTEGER NOT NULL,
    "keyword_similarity" INTEGER NOT NULL,
    "domain_similarity" INTEGER NOT NULL,
    "company_strength" INTEGER NOT NULL,
    "technology_match" INTEGER NOT NULL,
    "business_model_fit" INTEGER NOT NULL,
    "match_reason" TEXT NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_industries" (
    "company_id" TEXT NOT NULL,
    "industry_id" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL,
    "source_url" TEXT NOT NULL,

    CONSTRAINT "company_industries_pkey" PRIMARY KEY ("company_id","industry_id")
);

-- CreateTable
CREATE TABLE "company_keywords" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL,

    CONSTRAINT "company_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_history" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_jobs" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_queries" INTEGER NOT NULL DEFAULT 0,
    "processed_queries" INTEGER NOT NULL DEFAULT 0,
    "companies_found" INTEGER NOT NULL DEFAULT 0,
    "duplicate_merges" INTEGER NOT NULL DEFAULT 0,
    "estimated_seconds_left" INTEGER,
    "query_plan" JSONB NOT NULL,
    "processed_query_keys" TEXT[],
    "connector_status" JSONB NOT NULL,
    "errors" JSONB NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_results" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_logs" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "query" TEXT,
    "status" "ConnectorLogStatus" NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "duration_ms" INTEGER,
    "records_collected" INTEGER,
    "error_message" TEXT,
    "api_usage" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_lead_filters" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_lead_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_dedupe_key_key" ON "companies"("dedupe_key");

-- CreateIndex
CREATE INDEX "companies_normalized_name_idx" ON "companies"("normalized_name");

-- CreateIndex
CREATE INDEX "companies_official_domain_idx" ON "companies"("official_domain");

-- CreateIndex
CREATE INDEX "companies_country_idx" ON "companies"("country");

-- CreateIndex
CREATE INDEX "companies_company_size_idx" ON "companies"("company_size");

-- CreateIndex
CREATE INDEX "companies_funding_stage_idx" ON "companies"("funding_stage");

-- CreateIndex
CREATE INDEX "company_contacts_company_id_type_idx" ON "company_contacts"("company_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "company_contacts_company_id_type_value_source_url_key" ON "company_contacts"("company_id", "type", "value", "source_url");

-- CreateIndex
CREATE INDEX "company_sources_connector_id_collected_at_idx" ON "company_sources"("connector_id", "collected_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_sources_company_id_source_url_key" ON "company_sources"("company_id", "source_url");

-- CreateIndex
CREATE INDEX "company_scores_domain_id_buyer_score_idx" ON "company_scores"("domain_id", "buyer_score");

-- CreateIndex
CREATE INDEX "company_scores_domain_id_confidence_score_idx" ON "company_scores"("domain_id", "confidence_score");

-- CreateIndex
CREATE UNIQUE INDEX "company_scores_company_id_domain_id_key" ON "company_scores"("company_id", "domain_id");

-- CreateIndex
CREATE INDEX "company_industries_industry_id_idx" ON "company_industries"("industry_id");

-- CreateIndex
CREATE INDEX "company_keywords_keyword_idx" ON "company_keywords"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "company_keywords_company_id_keyword_key" ON "company_keywords"("company_id", "keyword");

-- CreateIndex
CREATE INDEX "company_history_company_id_created_at_idx" ON "company_history"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "scan_jobs_domain_id_requested_at_idx" ON "scan_jobs"("domain_id", "requested_at");

-- CreateIndex
CREATE INDEX "scan_jobs_status_requested_at_idx" ON "scan_jobs"("status", "requested_at");

-- CreateIndex
CREATE INDEX "scan_results_scan_job_id_created_at_idx" ON "scan_results"("scan_job_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "scan_results_scan_job_id_company_id_connector_id_query_key" ON "scan_results"("scan_job_id", "company_id", "connector_id", "query");

-- CreateIndex
CREATE INDEX "connector_logs_scan_job_id_connector_id_created_at_idx" ON "connector_logs"("scan_job_id", "connector_id", "created_at");

-- CreateIndex
CREATE INDEX "saved_lead_filters_domain_id_created_at_idx" ON "saved_lead_filters"("domain_id", "created_at");

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_sources" ADD CONSTRAINT "company_sources_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_scores" ADD CONSTRAINT "company_scores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_scores" ADD CONSTRAINT "company_scores_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_keywords" ADD CONSTRAINT "company_keywords_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_history" ADD CONSTRAINT "company_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_scan_job_id_fkey" FOREIGN KEY ("scan_job_id") REFERENCES "scan_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_logs" ADD CONSTRAINT "connector_logs_scan_job_id_fkey" FOREIGN KEY ("scan_job_id") REFERENCES "scan_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "connector_cache" (
    "id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "query_key" TEXT NOT NULL,
    "records" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "connector_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connector_cache_connector_id_query_key_key" ON "connector_cache"("connector_id", "query_key");
CREATE INDEX "connector_cache_expires_at_idx" ON "connector_cache"("expires_at");
