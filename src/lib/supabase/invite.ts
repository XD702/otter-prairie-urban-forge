/**
 * Eastside invite helpers.
 *
 * Invite code EASTSIDE is hardcoded here AND optionally seeded in
 * public.league_invites (see supabase/team-claims.sql). Either works;
 * client does not invent accounts — real emails only via magic link.
 *
 * Auth note: laptop /login may still use better-auth email+password.
 * Chat RLS needs Supabase auth.uid(), so the Join page uses
 * getSupabase().auth.signInWithOtp with emailRedirectTo the join URL.
 * AccountBar may still point at /login — Join handles invite OTP itself.
 */

export const INVITE_CODE = "EASTSIDE";
export const EASTSIDE_OPEN_CHAT_KEY = "eastside-open-chat";

export type InviteParse = {
  code: string | null;
  valid: boolean;
};

/** Build shareable invite URL: `${origin}/join?code=EASTSIDE`. */
export function buildInviteUrl(origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080");
  const url = new URL("/join", base.replace(/\/$/, ""));
  url.searchParams.set("code", INVITE_CODE);
  return url.toString();
}

/** Read invite code from current location (?code=EASTSIDE). */
export function parseInviteFromLocation(
  search?: string | URLSearchParams | Record<string, unknown>,
): InviteParse {
  let code: string | null = null;
  if (typeof search === "string") {
    code = new URLSearchParams(
      search.startsWith("?") ? search : `?${search}`,
    ).get("code");
  } else if (search instanceof URLSearchParams) {
    code = search.get("code");
  } else if (search && typeof search === "object" && "code" in search) {
    const raw = (search as { code?: unknown }).code;
    code = typeof raw === "string" ? raw : null;
  } else if (typeof window !== "undefined") {
    code = new URLSearchParams(window.location.search).get("code");
  }
  const normalized = code?.trim().toUpperCase() ?? null;
  return {
    code: normalized,
    valid: normalized === INVITE_CODE,
  };
}

/** Magic-link redirect target — always current join URL with code. */
export function inviteEmailRedirectTo(origin?: string): string {
  return buildInviteUrl(origin);
}

export function markOpenChatOnHome(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(EASTSIDE_OPEN_CHAT_KEY, "1");
}

export function consumeOpenChatFlag(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const v = sessionStorage.getItem(EASTSIDE_OPEN_CHAT_KEY);
  if (v === "1") {
    sessionStorage.removeItem(EASTSIDE_OPEN_CHAT_KEY);
    return true;
  }
  return false;
}
