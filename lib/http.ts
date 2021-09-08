import { Context } from "vm";

export function jsonResponse(
  context: Context,
  status: number,
  body: Record<string, unknown>
): void {
  context.res = {
    status,
    body,
    headers: {
      "Content-Type": "application/json",
    },
  };
}

export function internalServerErrorResponse(context: Context): void {
  jsonResponse(context, 500, { message: "Internal server error" });
}

export function notAuthenticatedErrorResponse(context: Context): void {
  jsonResponse(context, 401, { message: "Not authenticated" });
}
