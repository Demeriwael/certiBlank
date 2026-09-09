// Return only allowlisted metadata. Never log raw errors, messages, stacks,
// Prisma meta, or connection strings: any of those can contain credentials.
export function databaseDiagnostics(error: unknown, env: Record<string, string | undefined>) {
  const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const rawCode = details.code ?? details.errorCode;
  const code = typeof rawCode === "string" && /^P\d{4}$/.test(rawCode) ? rawCode : null;
  const names = ["PrismaClientInitializationError", "PrismaClientKnownRequestError", "PrismaClientUnknownRequestError", "PrismaClientValidationError", "PrismaClientRustPanicError"];
  const kind = typeof details.name === "string" && names.includes(details.name) ? details.name : "UnknownDatabaseError";
  const message = typeof details.message === "string" ? details.message : "";
  const reasons: Record<string, string> = {
    P1000: "authentication_failed", P1001: "database_unreachable", P1002: "connection_timeout",
    P1003: "database_missing", P1010: "access_denied", P1011: "tls_error",
    P1012: "configuration_error", P1013: "invalid_connection_string", P1017: "connection_closed",
    P2021: "table_missing", P2022: "column_missing", P2024: "connection_pool_timeout",
  };
  let reason = code ? reasons[code] ?? "prisma_error" : "unclassified";
  if (!code && /query engine|query_engine|libquery_engine/i.test(message)) reason = "query_engine_loading_error";
  else if (!code && /environment variable not found/i.test(message)) reason = "missing_environment_variable";
  else if (!code && kind === "PrismaClientValidationError") reason = "query_validation_error";

  function connectionState(value: string | undefined) {
    if (!value?.trim()) return "missing";
    try {
      const url = new URL(value);
      return ["postgres:", "postgresql:"].includes(url.protocol) && url.hostname ? "postgresql_url_present" : "invalid_url_format";
    } catch { return "invalid_url_format"; }
  }
  return { kind, code, reason, databaseUrl: connectionState(env.DATABASE_URL), directUrl: connectionState(env.DIRECT_URL) };
}
