-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'RESEARCHING', 'QUALIFIED', 'HIGH_PRIORITY', 'CONTACT_PLANNED', 'CONTACTED', 'FOLLOW_UP_SCHEDULED', 'NEGOTIATING', 'OFFER_SENT', 'NOT_INTERESTED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MonitoringStatus" AS ENUM ('QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "project_domains" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_companies" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "manual_score" INTEGER,
    "private_comments" TEXT,
    "reminder_date" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),
    "last_contacted_at" TIMESTAMP(3),
    "follow_up_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_notes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_notes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "company_id" TEXT,
    "note_id" TEXT,
    "file_name" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_tags" (
    "company_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "company_tags_pkey" PRIMARY KEY ("company_id","tag_id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "name" TEXT NOT NULL,
    "query" TEXT,
    "filters" JSONB NOT NULL,
    "sort" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status_history" (
    "id" TEXT NOT NULL,
    "project_company_id" TEXT NOT NULL,
    "previous_status" "LeadStatus",
    "current_status" "LeadStatus" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "company_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "company_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparison_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_rules" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ignored_industries" TEXT[],
    "ignored_countries" TEXT[],
    "minimum_buyer_score" INTEGER NOT NULL DEFAULT 60,
    "minimum_confidence" INTEGER NOT NULL DEFAULT 50,
    "maximum_concurrent_jobs" INTEGER NOT NULL DEFAULT 2,
    "notification_preferences" JSONB NOT NULL,
    "last_input_hash" TEXT,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_jobs" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT,
    "domain_id" TEXT NOT NULL,
    "scan_job_id" TEXT,
    "status" "MonitoringStatus" NOT NULL DEFAULT 'QUEUED',
    "input_hash" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_history" (
    "id" TEXT NOT NULL,
    "monitoring_job_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "company_id" TEXT,
    "type" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "priority" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT,
    "company_id" TEXT,
    "type" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "suggested_actions" TEXT[],
    "evidence" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "domain_id" TEXT,
    "company_id" TEXT,
    "opportunity_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_preferences" (
    "id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "in_app" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "threshold" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trend_snapshots" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT,
    "period" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB NOT NULL,

    CONSTRAINT "trend_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_cache" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "insight" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "insight_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_history" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "destination" TEXT,
    "error" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_domains_domain_id_idx" ON "project_domains"("domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_domains_project_id_domain_id_key" ON "project_domains"("project_id", "domain_id");

-- CreateIndex
CREATE INDEX "project_companies_project_id_status_priority_idx" ON "project_companies"("project_id", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "project_companies_project_id_company_id_key" ON "project_companies"("project_id", "company_id");

-- CreateIndex
CREATE INDEX "project_notes_project_id_pinned_updated_at_idx" ON "project_notes"("project_id", "pinned", "updated_at");

-- CreateIndex
CREATE INDEX "company_notes_company_id_pinned_updated_at_idx" ON "company_notes"("company_id", "pinned", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storage_key_key" ON "attachments"("storage_key");

-- CreateIndex
CREATE INDEX "attachments_project_id_idx" ON "attachments"("project_id");

-- CreateIndex
CREATE INDEX "attachments_company_id_idx" ON "attachments"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "company_tags_tag_id_idx" ON "company_tags"("tag_id");

-- CreateIndex
CREATE INDEX "saved_searches_project_id_updated_at_idx" ON "saved_searches"("project_id", "updated_at");

-- CreateIndex
CREATE INDEX "watchlist_items_company_id_idx" ON "watchlist_items"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_watchlist_id_company_id_key" ON "watchlist_items"("watchlist_id", "company_id");

-- CreateIndex
CREATE INDEX "lead_status_history_project_company_id_created_at_idx" ON "lead_status_history"("project_company_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_log_project_id_created_at_idx" ON "activity_log"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_log_company_id_created_at_idx" ON "activity_log"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "reminders_completed_at_due_at_idx" ON "reminders"("completed_at", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_rules_domain_id_key" ON "monitoring_rules"("domain_id");

-- CreateIndex
CREATE INDEX "monitoring_rules_enabled_next_run_at_idx" ON "monitoring_rules"("enabled", "next_run_at");

-- CreateIndex
CREATE INDEX "monitoring_jobs_status_priority_requested_at_idx" ON "monitoring_jobs"("status", "priority", "requested_at");

-- CreateIndex
CREATE INDEX "monitoring_jobs_domain_id_requested_at_idx" ON "monitoring_jobs"("domain_id", "requested_at");

-- CreateIndex
CREATE INDEX "monitoring_history_monitoring_job_id_created_at_idx" ON "monitoring_history"("monitoring_job_id", "created_at");

-- CreateIndex
CREATE INDEX "opportunities_status_score_detected_at_idx" ON "opportunities"("status", "score", "detected_at");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_domain_id_company_id_type_input_hash_key" ON "opportunities"("domain_id", "company_id", "type", "input_hash");

-- CreateIndex
CREATE INDEX "recommendations_score_created_at_idx" ON "recommendations"("score", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_type_input_hash_key" ON "recommendations"("type", "input_hash");

-- CreateIndex
CREATE INDEX "alerts_read_at_created_at_idx" ON "alerts"("read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_alert_type_key" ON "alert_preferences"("alert_type");

-- CreateIndex
CREATE INDEX "trend_snapshots_domain_id_captured_at_idx" ON "trend_snapshots"("domain_id", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "insight_cache_entity_type_entity_id_input_hash_key" ON "insight_cache"("entity_type", "entity_id", "input_hash");

-- CreateIndex
CREATE INDEX "notification_history_alert_id_attempted_at_idx" ON "notification_history"("alert_id", "attempted_at");

-- Full-text indexes for the global research workspace search.
CREATE INDEX "companies_search_idx" ON "companies" USING GIN (to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("description", '') || ' ' || coalesce("official_domain", '')));
CREATE INDEX "company_notes_search_idx" ON "company_notes" USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("content", '')));
CREATE INDEX "project_notes_search_idx" ON "project_notes" USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("content", '')));
