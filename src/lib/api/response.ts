import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { ApiError, isApiError } from "./errors";
import { logger } from "../logger";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  status: number,
  message: string,
  code = "ERROR",
  fields?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    { ok: false, error: { message, code, fields } },
    { status }
  );
}

export function errorResponse(e: unknown): NextResponse {
  if (isApiError(e)) {
    return fail(e.status, e.message, e.code, e.fields);
  }
  logger.error("Unhandled API error", e);
  return fail(500, "Something went wrong. Please try again.", "INTERNAL");
}

/** Parse a JSON request body, throwing a 400 ApiError on failure. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON", "INVALID_JSON");
  }
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  fields?: Record<string, string[]>;
}

/** Validate + coerce an input against a Zod schema. */
export function validate<T>(schema: ZodSchema<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  if (result.error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ||= []).push(issue.message);
    }
    return { success: false, fields };
  }
  return { success: false, fields: { _: ["Invalid input"] } };
}

/** Validate a body; on failure throws a 422 ApiError with field errors. */
export function validateOrThrow<T>(schema: ZodSchema<T>, input: unknown): any {
  const result = validate(schema, input);
  if (!result.success) {
    throw new ApiError(422, "Please correct the highlighted fields", "VALIDATION", result.fields);
  }
  return result.data;
}
