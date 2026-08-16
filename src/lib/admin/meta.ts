import { getResource } from "./resources";
import { listDepartments } from "../services/site";

export interface ResourceMeta {
  name: string;
  label: string;
  plural: string;
  icon: string;
  columns: unknown[];
  fields: unknown[];
  filters?: unknown[];
  bulkDelete?: boolean;
  description?: string;
}

/** UI-only metadata for a resource (no service/schema objects). */
export function getResourceMeta(name: string): ResourceMeta | null {
  const r = getResource(name);
  if (!r) return null;

  const fields = r.fields.map((f) => {
    // Populate relation selects at runtime.
    if (f.name === "department_id") {
      return {
        ...f,
        options: listDepartments().map((d) => ({ value: String(d.id), label: d.name })),
      };
    }
    return f;
  });

  return {
    name: r.name,
    label: r.label,
    plural: r.plural,
    icon: r.icon,
    columns: r.columns,
    fields,
    filters: r.filters,
    bulkDelete: r.bulkDelete,
    description: r.description,
  };
}
