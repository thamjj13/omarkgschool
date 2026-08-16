import type { ZodSchema } from "zod";
import type { CrudService } from "../services/crud";

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "select"
  | "switch"
  | "date"
  | "datetime"
  | "image"
  | "file"
  | "url"
  | "email";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: FieldOption[];
  colSpan?: 1 | 2;
  min?: number;
  max?: number;
}

export type ColumnType =
  | "text"
  | "date"
  | "image"
  | "badge"
  | "boolean"
  | "number"
  | "richtext"
  | "file";

export interface ColumnDef {
  key: string;
  label: string;
  type?: ColumnType;
  /** optional badge colour map for `badge` columns */
  badgeMap?: Record<string, string>;
  width?: string;
  sortable?: boolean;
}

export interface FilterDef {
  column: string;
  label: string;
  options: FieldOption[];
}

export interface ResourceDefinition {
  /** route key, e.g. "news" */
  name: string;
  label: string;
  plural: string;
  icon: string;
  permission: string;
  service: CrudService<any> | null;
  schema: ZodSchema<any> | null;
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: FilterDef[];
  /** inject the current user id into this column on create */
  authorColumn?: string;
  /** description shown in the list header */
  description?: string;
  /** allow bulk delete */
  bulkDelete?: boolean;
  /** virtual display columns returned by the service (non-crud resources) */
  customList?: boolean;
}
