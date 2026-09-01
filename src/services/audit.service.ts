import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface WriteAuditLogInput {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Prisma.InputJsonValue;
}

type AuditLogClient = typeof db | Prisma.TransactionClient;

export async function writeAuditLog(
  input: WriteAuditLogInput,
  client: AuditLogClient = db
): Promise<void> {
  await client.moderationAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      meta: input.meta ?? undefined,
    },
  });
}

export interface AuditLogEntry {
  id: string;
  actorUsername: string;
  action: string;
  entityType: string;
  entityId: string;
  meta: unknown;
  createdAt: string;
}

export interface ListAuditLogsOptions {
  limit?: number;
  offset?: number;
  action?: string;
  entityType?: string;
  actorUsername?: string;
  query?: string;
}

export async function listAuditLogs(
  limitOrOptions: number | ListAuditLogsOptions = 100
): Promise<AuditLogEntry[]> {
  const options: ListAuditLogsOptions =
    typeof limitOrOptions === "number"
      ? { limit: limitOrOptions }
      : limitOrOptions;

  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;

  const logs = await db.moderationAuditLog.findMany({
    where: {
      ...(options.action ? { action: options.action } : {}),
      ...(options.entityType ? { entityType: options.entityType } : {}),
      ...(options.actorUsername
        ? {
            actor: {
              username: { contains: options.actorUsername, mode: "insensitive" },
            },
          }
        : {}),
      ...(options.query
        ? {
            OR: [
              { action: { contains: options.query, mode: "insensitive" } },
              { entityType: { contains: options.query, mode: "insensitive" } },
              { entityId: { contains: options.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: { actor: { select: { username: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    actorUsername: log.actor.username,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    meta: log.meta,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function countAuditLogs(
  options: Omit<ListAuditLogsOptions, "limit" | "offset"> = {}
): Promise<number> {
  return db.moderationAuditLog.count({
    where: {
      ...(options.action ? { action: options.action } : {}),
      ...(options.entityType ? { entityType: options.entityType } : {}),
      ...(options.actorUsername
        ? {
            actor: {
              username: { contains: options.actorUsername, mode: "insensitive" },
            },
          }
        : {}),
      ...(options.query
        ? {
            OR: [
              { action: { contains: options.query, mode: "insensitive" } },
              { entityType: { contains: options.query, mode: "insensitive" } },
              { entityId: { contains: options.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
  });
}

export async function listAuditActionTypes(): Promise<string[]> {
  const rows = await db.moderationAuditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
    take: 50,
  });
  return rows.map((row) => row.action);
}
