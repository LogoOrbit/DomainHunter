-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('QUEUED', 'CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('HIGH_PRIORITY_BUYER', 'SCORE_INCREASE', 'NEW_EXECUTIVE', 'FUNDING_EVENT', 'REBRAND', 'COMPANY_CHANGE', 'SCAN_COMPLETED', 'SCAN_FAILED');

-- CreateTable
CREATE TABLE "valuations" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "low_estimate" INTEGER NOT NULL,
    "fair_estimate" INTEGER NOT NULL,
    "premium_estimate" INTEGER NOT NULL,
    "investor_estimate" INTEGER NOT NULL,
    "end_user_estimate" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "components" JSONB NOT NULL,
    "comparables" JSONB NOT NULL,
    "verified_public_data" JSONB NOT NULL,
    "ai_estimate" JSONB NOT NULL,
    "explanation" JSONB NOT NULL,
    "opportunity_report" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_history" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "valuation_id" TEXT NOT NULL,
    "low_estimate" INTEGER NOT NULL,
    "fair_estimate" INTEGER NOT NULL,
    "premium_estimate" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_rankings" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "segment" TEXT NOT NULL,
    "buyer_fit" INTEGER NOT NULL,
    "strategic_relevance" INTEGER NOT NULL,
    "business_model_fit" INTEGER NOT NULL,
    "semantic_alignment" INTEGER NOT NULL,
    "commercial_potential" INTEGER NOT NULL,
    "acquisition_probability" INTEGER NOT NULL,
    "outreach_priority" INTEGER NOT NULL,
    "explanation" JSONB NOT NULL,
    "ranked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_explanations" (
    "id" TEXT NOT NULL,
    "ranking_id" TEXT NOT NULL,
    "reasons" TEXT[],
    "risks" TEXT[],
    "suggested_angle" TEXT NOT NULL,
    "score_details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "placeholders" JSONB NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_messages" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "company_id" TEXT,
    "template_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "customizations" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_plans" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "valuation_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "opening_price" INTEGER NOT NULL,
    "target_price" INTEGER NOT NULL,
    "floor_price" INTEGER NOT NULL,
    "strategy" JSONB NOT NULL,
    "objection_scripts" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiation_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB NOT NULL,
    "total_requests" INTEGER NOT NULL DEFAULT 0,
    "successful_runs" INTEGER NOT NULL DEFAULT 0,
    "failed_runs" INTEGER NOT NULL DEFAULT 0,
    "records_collected" INTEGER NOT NULL DEFAULT 0,
    "average_latency_ms" INTEGER NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_health" (
    "id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "healthy" BOOLEAN NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "message" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_tasks" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "scan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_history" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_progress" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "companies_found" INTEGER NOT NULL,
    "companies_updated" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_changes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "scan_job_id" TEXT,
    "field" TEXT NOT NULL,
    "previous_value" TEXT,
    "current_value" TEXT,
    "significance" INTEGER NOT NULL DEFAULT 50,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "domain_id" TEXT,
    "company_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_queue" (
    "id" TEXT NOT NULL,
    "scan_job_id" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 4,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_by" TEXT,
    "claimed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_status" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_job_id" TEXT,
    "jobs_completed" INTEGER NOT NULL DEFAULT 0,
    "jobs_failed" INTEGER NOT NULL DEFAULT 0,
    "last_heartbeat" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "worker_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_schedules" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "cron" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "valuations_domain_id_key" ON "valuations"("domain_id");

-- CreateIndex
CREATE INDEX "valuations_input_hash_idx" ON "valuations"("input_hash");

-- CreateIndex
CREATE INDEX "pricing_history_domain_id_recorded_at_idx" ON "pricing_history"("domain_id", "recorded_at");

-- CreateIndex
CREATE INDEX "buyer_rankings_domain_id_rank_idx" ON "buyer_rankings"("domain_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_rankings_domain_id_company_id_key" ON "buyer_rankings"("domain_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_explanations_ranking_id_key" ON "buyer_explanations"("ranking_id");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_templates_key_key" ON "outreach_templates"("key");

-- CreateIndex
CREATE INDEX "generated_messages_domain_id_created_at_idx" ON "generated_messages"("domain_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "negotiation_plans_domain_id_key" ON "negotiation_plans"("domain_id");

-- CreateIndex
CREATE INDEX "analytics_snapshots_domain_id_created_at_idx" ON "analytics_snapshots"("domain_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_domain_id_input_hash_key" ON "analytics_snapshots"("domain_id", "input_hash");

-- CreateIndex
CREATE INDEX "connector_health_connector_id_checked_at_idx" ON "connector_health"("connector_id", "checked_at");

-- CreateIndex
CREATE INDEX "scan_tasks_status_available_at_idx" ON "scan_tasks"("status", "available_at");

-- CreateIndex
CREATE UNIQUE INDEX "scan_tasks_scan_job_id_connector_id_query_key" ON "scan_tasks"("scan_job_id", "connector_id", "query");

-- CreateIndex
CREATE INDEX "scan_history_scan_job_id_created_at_idx" ON "scan_history"("scan_job_id", "created_at");

-- CreateIndex
CREATE INDEX "scan_progress_scan_job_id_recorded_at_idx" ON "scan_progress"("scan_job_id", "recorded_at");

-- CreateIndex
CREATE INDEX "company_changes_company_id_detected_at_idx" ON "company_changes"("company_id", "detected_at");

-- CreateIndex
CREATE INDEX "notifications_read_at_created_at_idx" ON "notifications"("read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_queue_scan_job_id_key" ON "job_queue"("scan_job_id");

-- CreateIndex
CREATE INDEX "job_queue_status_priority_available_at_idx" ON "job_queue"("status", "priority", "available_at");

-- CreateIndex
CREATE INDEX "worker_status_last_heartbeat_idx" ON "worker_status"("last_heartbeat");

-- CreateIndex
CREATE INDEX "scan_schedules_enabled_next_run_at_idx" ON "scan_schedules"("enabled", "next_run_at");
