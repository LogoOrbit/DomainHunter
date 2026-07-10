-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "health" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "quota" JSONB,
    "last_sync_at" TIMESTAMP(3),
    "execution_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "encrypted_secrets" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_rules" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "factor" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "project_id" TEXT,
    "domain_id" TEXT,
    "input_hash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_layouts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_ids" TEXT[],
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparison_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_history" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "record_count" INTEGER NOT NULL,
    "checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_history" (
    "id" TEXT NOT NULL,
    "backup_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_metrics" (
    "id" TEXT NOT NULL,
    "cpu_percent" DOUBLE PRECISION NOT NULL,
    "memory_bytes" BIGINT NOT NULL,
    "heap_bytes" BIGINT NOT NULL,
    "queue_length" INTEGER NOT NULL,
    "active_jobs" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_history" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "verified_data" JSONB NOT NULL,
    "reasoning" JSONB NOT NULL,
    "input_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_saved_items" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "history_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_preferences" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_reports" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checks" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugins" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "health" TEXT NOT NULL DEFAULT 'DISABLED',
    "manifest" JSONB NOT NULL,
    "configuration" JSONB NOT NULL,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_logs" (
    "id" TEXT NOT NULL,
    "plugin_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plugin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_permissions" (
    "plugin_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "plugin_permissions_pkey" PRIMARY KEY ("plugin_id","permission")
);

-- CreateTable
CREATE TABLE "application_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "commit_hash" TEXT,
    "migration_hash" TEXT NOT NULL,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_history" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_reports" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "code" TEXT,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "context" JSONB NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostics" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imports" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "record_count" INTEGER NOT NULL,
    "duplicate_count" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_history" (
    "id" TEXT NOT NULL,
    "import_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_history" (
    "id" TEXT NOT NULL,
    "from_version" TEXT NOT NULL,
    "to_version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "backup_id" TEXT,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "update_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integrations_key_key" ON "integrations"("key");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_integration_id_key" ON "integration_settings"("integration_id");

-- CreateIndex
CREATE INDEX "integration_logs_integration_id_created_at_idx" ON "integration_logs"("integration_id", "created_at");

-- CreateIndex
CREATE INDEX "scoring_profiles_project_id_active_idx" ON "scoring_profiles"("project_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_rules_profile_id_factor_key" ON "scoring_rules"("profile_id", "factor");

-- CreateIndex
CREATE INDEX "analytics_reports_created_at_idx" ON "analytics_reports"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_reports_type_input_hash_key" ON "analytics_reports"("type", "input_hash");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_layouts_name_key" ON "dashboard_layouts"("name");

-- CreateIndex
CREATE INDEX "export_history_created_at_idx" ON "export_history"("created_at");

-- CreateIndex
CREATE INDEX "saved_filters_scope_pinned_idx" ON "saved_filters"("scope", "pinned");

-- CreateIndex
CREATE INDEX "backups_created_at_idx" ON "backups"("created_at");

-- CreateIndex
CREATE INDEX "backup_history_backup_id_created_at_idx" ON "backup_history"("backup_id", "created_at");

-- CreateIndex
CREATE INDEX "maintenance_logs_created_at_idx" ON "maintenance_logs"("created_at");

-- CreateIndex
CREATE INDEX "resource_metrics_captured_at_idx" ON "resource_metrics"("captured_at");

-- CreateIndex
CREATE INDEX "workspace_history_workspace_id_created_at_idx" ON "workspace_history"("workspace_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_saved_items_workspace_id_history_id_key" ON "workspace_saved_items"("workspace_id", "history_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "application_preferences_key_key" ON "application_preferences"("key");

-- CreateIndex
CREATE INDEX "health_reports_created_at_idx" ON "health_reports"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "plugins_key_key" ON "plugins"("key");

-- CreateIndex
CREATE INDEX "plugin_logs_plugin_id_created_at_idx" ON "plugin_logs"("plugin_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "application_versions_version_key" ON "application_versions"("version");

-- CreateIndex
CREATE INDEX "release_history_published_at_idx" ON "release_history"("published_at");

-- CreateIndex
CREATE INDEX "error_reports_resolved_at_created_at_idx" ON "error_reports"("resolved_at", "created_at");

-- CreateIndex
CREATE INDEX "diagnostics_created_at_idx" ON "diagnostics"("created_at");

-- CreateIndex
CREATE INDEX "imports_created_at_idx" ON "imports"("created_at");

-- CreateIndex
CREATE INDEX "import_history_import_id_created_at_idx" ON "import_history"("import_id", "created_at");

-- CreateIndex
CREATE INDEX "update_history_created_at_idx" ON "update_history"("created_at");
