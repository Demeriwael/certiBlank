import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { readJson, requestError } from "@/lib/request-security";
export const runtime = "nodejs";
const handler = toNextJsHandler(auth);
export const GET = handler.GET;
export async function POST(request: Request) {
  // OAuth callbacks may use form bodies; leave those to Better Auth's validation.
  const path = new URL(request.url).pathname;
  if (!["/sign-up/email", "/sign-in/email", "/update-user"].some(suffix => path.endsWith(suffix))) return handler.POST(request);
  try {
    const body = await readJson(request, 16 * 1024);
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    return handler.POST(new Request(request.url, { method: "POST", headers, body: JSON.stringify(body), signal: request.signal }));
  } catch (error) { return requestError(error, "Unable to process authentication request"); }
}
