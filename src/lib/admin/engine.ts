import { getResource } from "./resources";
import { requirePermission } from "../auth/rbac";
import type { SessionUser } from "../auth/session";
import { validateOrThrow } from "../api/response";
import { ApiError } from "../api/errors";
import { logActivity } from "../services/activity";
import { clientIp } from "../api/origin";
import type { ResourceDefinition } from "./types";

export interface ListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
  filters: Record<string, string>;
}

function parseListParams(url: URL, resource: ResourceDefinition): ListParams {
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");
  const q = url.searchParams.get("q") ?? undefined;
  const sort = url.searchParams.get("sort") ?? undefined;
  const dirParam = url.searchParams.get("dir");
  const filters: Record<string, string> = {};
  for (const col of resource.service?.cfg.filterColumns ?? []) {
    const v = url.searchParams.get(col);
    if (v) filters[col] = v;
  }
  return {
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
    q,
    sort,
    dir: dirParam === "asc" ? "asc" : "desc",
    filters,
  };
}

function assertCrud(resource: ResourceDefinition) {
  if (!resource.service) {
    throw new ApiError(400, `"${resource.name}" does not support generic CRUD`, "NOT_CRUD");
  }
  return resource.service;
}

function titleOf(row: unknown): string {
  const r = row as Record<string, unknown>;
  return String(r.title ?? r.name ?? r.question ?? r.label ?? "");
}

export async function listResource(
  resourceName: string,
  req: Request
) {
  const resource = getResource(resourceName);
  if (!resource) throw new ApiError(404, "Unknown resource", "NOT_FOUND");
  await requirePermission(resource.permission);
  const service = assertCrud(resource);
  const params = parseListParams(new URL(req.url), resource);
  const result = service.list({
    page: params.page,
    pageSize: params.pageSize,
    q: params.q,
    sort: params.sort,
    dir: params.dir,
    filters: params.filters,
  });
  return result;
}

export async function getResourceItem(resourceName: string, id: number) {
  const resource = getResource(resourceName);
  if (!resource) throw new ApiError(404, "Unknown resource", "NOT_FOUND");
  await requirePermission(resource.permission);
  const service = assertCrud(resource);
  const item = service.get(id);
  if (!item) throw new ApiError(404, "Item not found", "NOT_FOUND");
  return item;
}

export async function createResourceItem(
  resourceName: string,
  body: unknown,
  user: SessionUser,
  req: Request
) {
  const resource = getResource(resourceName);
  if (!resource) throw new ApiError(404, "Unknown resource", "NOT_FOUND");
  await requirePermission(resource.permission);
  const service = assertCrud(resource);
  const data = validateOrThrow(resource.schema!, body);
  if (resource.authorColumn) (data as Record<string, unknown>)[resource.authorColumn] = user.id;
  const item = service.create(data as Record<string, unknown>);
  logActivity({
    userId: user.id,
    action: `${resource.name}.create`,
    entityType: resource.name,
    entityId: (item as any).id,
    details: { title: titleOf(item) },
    ip: clientIp(req),
  });
  return item;
}

export async function updateResourceItem(
  resourceName: string,
  id: number,
  body: unknown,
  user: SessionUser,
  req: Request
) {
  const resource = getResource(resourceName);
  if (!resource) throw new ApiError(404, "Unknown resource", "NOT_FOUND");
  await requirePermission(resource.permission);
  const service = assertCrud(resource);
  // Merge with existing row so partial updates validate against a full object.
  const existing = service.get(id);
  if (!existing) throw new ApiError(404, "Item not found", "NOT_FOUND");
  const merged = { ...existing, ...(body as Record<string, unknown>) };
  const data = validateOrThrow(resource.schema!, merged);
  const item = service.update(id, data as Record<string, unknown>);
  logActivity({
    userId: user.id,
    action: `${resource.name}.update`,
    entityType: resource.name,
    entityId: id,
    details: { title: titleOf(item) },
    ip: clientIp(req),
  });
  return item;
}

export async function deleteResourceItem(
  resourceName: string,
  id: number,
  user: SessionUser,
  req: Request
) {
  const resource = getResource(resourceName);
  if (!resource) throw new ApiError(404, "Unknown resource", "NOT_FOUND");
  await requirePermission(resource.permission);
  const service = assertCrud(resource);
  const existing = service.get(id);
  if (!existing) throw new ApiError(404, "Item not found", "NOT_FOUND");
  service.remove(id);
  logActivity({
    userId: user.id,
    action: `${resource.name}.delete`,
    entityType: resource.name,
    entityId: id,
    details: { title: titleOf(existing) },
    ip: clientIp(req),
  });
  return { id };
}

export async function bulkDeleteResource(
  resourceName: string,
  ids: number[],
  user: SessionUser,
  req: Request
) {
  const resource = getResource(resourceName);
  if (!resource) throw new ApiError(404, "Unknown resource", "NOT_FOUND");
  await requirePermission(resource.permission);
  if (!resource.bulkDelete) {
    throw new ApiError(400, "Bulk delete is not available for this resource", "NOT_ALLOWED");
  }
  const service = assertCrud(resource);
  for (const id of ids) {
    service.remove(id);
  }
  logActivity({
    userId: user.id,
    action: `${resource.name}.bulk_delete`,
    entityType: resource.name,
    entityId: ids.join(","),
    ip: clientIp(req),
  });
  return { deleted: ids.length };
}
