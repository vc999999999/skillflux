import { randomUUID } from "node:crypto";

interface SessionRecord {
  id: string;
  expiresAt: number;
}

const sessions = new Map<string, SessionRecord>();

export function currentSession(sessionKey = "default", ttlSeconds = 1800): string {
  const now = Date.now();
  const existing = sessions.get(sessionKey);
  if (existing && existing.expiresAt > now) {
    return existing.id;
  }
  const id = `sess_${randomUUID().replaceAll("-", "")}`;
  sessions.set(sessionKey, {
    id,
    expiresAt: now + ttlSeconds * 1000
  });
  return id;
}

export function resetSession(sessionKey = "default"): void {
  sessions.delete(sessionKey);
}
