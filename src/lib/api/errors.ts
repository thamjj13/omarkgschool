export interface FieldErrors {
  [field: string]: string[];
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: FieldErrors;

  constructor(status: number, message: string, code = "ERROR", fields?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
