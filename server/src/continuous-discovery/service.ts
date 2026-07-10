import { randomUUID } from "node:crypto";
import { getPrisma } from "../domain-intelligence/prisma.ts";
import { getLeadDiscoveryService } from "../lead-discovery/factory.ts";

const builtins = [{ id: "github", name: "GitHub Public Search" }, { id: "wikidata", name: "Wikidata" }];

export class ContinuousDiscoveryService {
  private db = getPrisma();

  async syncConnectors() {
    for (const connector of builtins) await this.db.connector.upsert({ where: { id: connector.id }, create: { ...connector, configuration: { publicDataOnly: true } }, update: { name: connector.name } });
    return this.db.connector.findMany({ orderBy: { name: "asc" } });
  }

  async start(domainId: string, priority = 50) {
    const scan = await getLeadDiscoveryService().start(domainId);
    await this.db.jobQueue.create({ data: { scanJobId: scan.id, priority } });
    await this.db.scanHistory.create({ data: { scanJobId: scan.id, event: "QUEUED", details: { priority } } });
    return scan;
  }

  async process(scanJobId: string) {
    const workerId = `worker-${randomUUID().slice(0, 8)}`;
    await this.db.jobQueue.update({ where: { scanJobId }, data: { status: "RUNNING", claimedBy: workerId, claimedAt: new Date(), attempts: { increment: 1 } } });
    await this.db.workerStatus.upsert({ where: { id: workerId }, create: { id: workerId, status: "RUNNING", currentJobId: scanJobId, lastHeartbeat: new Date(), metadata: {} }, update: { status: "RUNNING", currentJobId: scanJobId, lastHeartbeat: new Date() } });
    try {
      const leadService = getLeadDiscoveryService();
      await leadService.run(scanJobId);
      const result = await leadService.getScan(scanJobId);
      await this.db.jobQueue.update({ where: { scanJobId }, data: { status: result.status === "CANCELLED" ? "CANCELLED" : "COMPLETED" } });
      await this.db.workerStatus.update({ where: { id: workerId }, data: { status: "IDLE", currentJobId: null, jobsCompleted: { increment: 1 }, lastHeartbeat: new Date() } });
      await this.db.scanProgress.create({ data: { scanJobId, progress: result.progress, companiesFound: result.companiesFound, companiesUpdated: 0 } });
      await this.db.notification.create({ data: { type: "SCAN_COMPLETED", domainId: result.domainId, title: "Discovery scan complete", message: `${result.companiesFound} companies were found.`, data: { scanJobId } } });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      const queued = await this.db.jobQueue.findUnique({ where: { scanJobId } });
      const retry = queued && queued.attempts < queued.maxAttempts;
      await this.db.jobQueue.update({ where: { scanJobId }, data: { status: retry ? "QUEUED" : "FAILED", lastError: message, availableAt: new Date(Date.now() + Math.pow(2, queued?.attempts ?? 1) * 30_000) } });
      await this.db.workerStatus.update({ where: { id: workerId }, data: { status: "IDLE", currentJobId: null, jobsFailed: { increment: 1 }, lastHeartbeat: new Date() } });
      throw error;
    }
  }

  pause(id: string) { return getLeadDiscoveryService().pause(id); }
  resume(id: string) { return getLeadDiscoveryService().resume(id); }
  cancel(id: string) { return getLeadDiscoveryService().cancel(id); }

  async status(id?: string) {
    if (id) return getLeadDiscoveryService().getScan(id);
    const [queue, workers, scans] = await Promise.all([this.db.jobQueue.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "asc" }], take: 50 }), this.db.workerStatus.findMany({ orderBy: { lastHeartbeat: "desc" }, take: 20 }), this.db.scanJob.findMany({ orderBy: { requestedAt: "desc" }, take: 20 })]);
    return { queue, workers, scans };
  }

  async health() {
    await this.syncConnectors();
    const now = new Date();
    for (const connector of builtins) await this.db.connectorHealth.create({ data: { connectorId: connector.id, healthy: true, latencyMs: 0, message: "Connector registered and ready", checkedAt: now } });
    return this.db.connectorHealth.findMany({ orderBy: { checkedAt: "desc" }, distinct: ["connectorId"] });
  }

  notifications() { return this.db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }); }
  companyChanges(companyId: string) { return this.db.companyChange.findMany({ where: { companyId }, orderBy: { detectedAt: "desc" }, take: 100 }); }

  async schedules(domainId?: string) { return this.db.scanSchedule.findMany({ where: domainId ? { domainId } : undefined, orderBy: { nextRunAt: "asc" } }); }
  async schedule(input: { domainId: string; frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM"; nextRunAt?: string; cron?: string; priority?: number }) {
    const nextRunAt = input.nextRunAt ? new Date(input.nextRunAt) : new Date();
    if (Number.isNaN(nextRunAt.getTime())) throw new Error("nextRunAt must be a valid date");
    return this.db.scanSchedule.create({ data: { domainId: input.domainId, frequency: input.frequency, cron: input.cron, priority: input.priority ?? 50, nextRunAt } });
  }
  async runDueSchedules(now = new Date()) {
    const due = await this.db.scanSchedule.findMany({ where: { enabled: true, nextRunAt: { lte: now } }, orderBy: { priority: "desc" }, take: 25 });
    const jobs = [];
    for (const schedule of due) {
      const scan = await this.start(schedule.domainId, schedule.priority); jobs.push(scan);
      const days = schedule.frequency === "DAILY" ? 1 : schedule.frequency === "WEEKLY" ? 7 : schedule.frequency === "MONTHLY" ? 30 : 1;
      await this.db.scanSchedule.update({ where: { id: schedule.id }, data: { lastRunAt: now, nextRunAt: new Date(now.getTime() + days * 86_400_000) } });
    }
    return jobs;
  }
}

let service: ContinuousDiscoveryService | undefined;
export const getContinuousDiscoveryService = () => service ??= new ContinuousDiscoveryService();
