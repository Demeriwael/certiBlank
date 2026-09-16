export class RequestValidationError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function requireOrigin(request: Request) {
  const configured = process.env.BETTER_AUTH_URL;
  if (!configured && process.env.NODE_ENV === "production") throw new Error("Missing application origin");
  const expected = new URL(configured ?? request.url).origin;
  if (request.headers.get("origin") !== expected) throw new RequestValidationError("Invalid request origin", 403);
}

// Count streamed bytes, including requests with missing or misleading Content-Length.
export async function readJson(request: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestValidationError("Expected application/json", 415);
  }
  if (request.headers.get("content-encoding") && request.headers.get("content-encoding") !== "identity") {
    throw new RequestValidationError("Unsupported content encoding", 415);
  }
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new RequestValidationError("Request too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestValidationError("Expected a JSON object");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestValidationError("Request too large", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new RequestValidationError("Invalid JSON"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new RequestValidationError("Expected a JSON object");
  return parsed as Record<string, unknown>;
}

export function requestError(error: unknown, fallback: string) {
  return Response.json({ error: error instanceof RequestValidationError ? error.message : fallback }, {
    status: error instanceof RequestValidationError ? error.status : 500,
    headers: { "Cache-Control": "no-store" },
  });
}

export function validSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100;
}
