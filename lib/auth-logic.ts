import type { PrismaClient } from "@prisma/client";

// Only accept application paths. Never let an auth callback become an open redirect.
export function authReturnPath(value: string | null | undefined): string {
  if (!value || !/^\/platform\/[a-z0-9-]+(?:\?attempt=[a-zA-Z0-9-]+)?$/.test(value)) return "/account";
  return value;
}

export function attemptAccess(userId: string | undefined, owner: string | undefined) {
  // Once claimed, the old anonymous cookie can never authorize this attempt again.
  return userId ? { userId } : owner ? { owner, userId: null } : null;
}

export async function claimAttempts(db: Pick<PrismaClient, "examAttempt">, userId: string, owner?: string) {
  if (!owner || !/^[a-f0-9-]{36}$/i.test(owner)) return 0;
  const result = await db.examAttempt.updateMany({
    where: { owner, userId: null }, data: { userId },
  });
  return result.count;
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
