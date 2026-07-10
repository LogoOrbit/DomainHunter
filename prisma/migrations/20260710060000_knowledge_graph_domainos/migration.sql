-- CreateTable
CREATE TABLE "knowledge_graph" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entity_count" INTEGER NOT NULL DEFAULT 0,
    "edge_count" INTEGER NOT NULL DEFAULT 0,
    "input_hash" TEXT NOT NULL,
    "built_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_graph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_relationships" (
    "id" TEXT NOT NULL,
    "graph_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'DIRECTED',
    "evidence" JSONB NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_scores" (
    "id" TEXT NOT NULL,
    "relationship_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "input_hash" TEXT NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationship_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_cache" (
    "id" TEXT NOT NULL,
    "cache_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_memory" (
    "id" TEXT NOT NULL,
    "memory_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "source_ids" TEXT[],
    "input_hash" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_relationships" (
    "id" TEXT NOT NULL,
    "domain_a_id" TEXT NOT NULL,
    "domain_b_id" TEXT NOT NULL,
    "overlap_type" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "shared_items" JSONB NOT NULL,
    "input_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_history" (
    "id" TEXT NOT NULL,
    "recommendation_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "input_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_timeline" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "source_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intelligence_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_snapshots" (
    "id" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger_type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_executions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "outcome" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_graph_name_key" ON "knowledge_graph"("name");

-- CreateIndex
CREATE INDEX "entity_relationships_source_type_source_id_idx" ON "entity_relationships"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "entity_relationships_target_type_target_id_idx" ON "entity_relationships"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "entity_relationships_relation_idx" ON "entity_relationships"("relation");

-- CreateIndex
CREATE UNIQUE INDEX "entity_relationships_graph_id_source_type_source_id_target__key" ON "entity_relationships"("graph_id", "source_type", "source_id", "target_type", "target_id", "relation");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_scores_relationship_id_key" ON "relationship_scores"("relationship_id");

-- CreateIndex
CREATE INDEX "relationship_scores_score_confidence_idx" ON "relationship_scores"("score", "confidence");

-- CreateIndex
CREATE INDEX "knowledge_cache_entity_type_entity_id_idx" ON "knowledge_cache"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_cache_cache_type_entity_type_entity_id_input_hash_key" ON "knowledge_cache"("cache_type", "entity_type", "entity_id", "input_hash");

-- CreateIndex
CREATE INDEX "research_memory_entity_type_entity_id_idx" ON "research_memory"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "research_memory_memory_type_input_hash_key" ON "research_memory"("memory_type", "input_hash");

-- CreateIndex
CREATE INDEX "portfolio_relationships_score_idx" ON "portfolio_relationships"("score");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_relationships_domain_a_id_domain_b_id_overlap_typ_key" ON "portfolio_relationships"("domain_a_id", "domain_b_id", "overlap_type");

-- CreateIndex
CREATE INDEX "recommendation_history_score_confidence_created_at_idx" ON "recommendation_history"("score", "confidence", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_history_recommendation_type_input_hash_key" ON "recommendation_history"("recommendation_type", "input_hash");

-- CreateIndex
CREATE INDEX "intelligence_timeline_occurred_at_idx" ON "intelligence_timeline"("occurred_at");

-- CreateIndex
CREATE INDEX "intelligence_timeline_entity_type_entity_id_occurred_at_idx" ON "intelligence_timeline"("entity_type", "entity_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "intelligence_timeline_event_type_entity_type_entity_id_sour_key" ON "intelligence_timeline"("event_type", "entity_type", "entity_id", "source_id");

-- CreateIndex
CREATE INDEX "research_snapshots_scope_type_scope_id_created_at_idx" ON "research_snapshots"("scope_type", "scope_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "research_snapshots_scope_type_scope_id_input_hash_key" ON "research_snapshots"("scope_type", "scope_id", "input_hash");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_entity_type_key_key" ON "custom_field_definitions"("entity_type", "key");

-- CreateIndex
CREATE INDEX "custom_field_values_entity_id_idx" ON "custom_field_values"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_definition_id_entity_id_key" ON "custom_field_values"("definition_id", "entity_id");

-- CreateIndex
CREATE INDEX "automation_rules_enabled_trigger_type_priority_idx" ON "automation_rules"("enabled", "trigger_type", "priority");

-- CreateIndex
CREATE INDEX "automation_executions_status_started_at_idx" ON "automation_executions"("status", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "automation_executions_rule_id_event_id_key" ON "automation_executions"("rule_id", "event_id");

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");
