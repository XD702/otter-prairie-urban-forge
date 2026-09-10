import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const EASTSIDE_LEAGUE_ID = "eastside-legends";
export const LEAGUE_CHAT_CAP = 12;

export type LeagueChatMessage = {
  id: string;
  league_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export type LeagueChatMember = {
  league_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
};

export type LeagueChatSnapshot = {
  members: LeagueChatMember[];
  messages: LeagueChatMessage[];
  joined: boolean;
  full: boolean;
  cap: number;
};

function asIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapMember(row: {
  league_id: string;
  user_id: string;
  display_name: string;
  joined_at: string | Date;
}): LeagueChatMember {
  return {
    league_id: row.league_id,
    user_id: row.user_id,
    display_name: row.display_name,
    joined_at: asIso(row.joined_at),
  };
}

function mapMessage(row: {
  id: string;
  league_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string | Date;
}): LeagueChatMessage {
  return {
    id: row.id,
    league_id: row.league_id,
    user_id: row.user_id,
    display_name: row.display_name,
    body: row.body,
    created_at: asIso(row.created_at),
  };
}

export const loadLeagueChat = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LeagueChatSnapshot> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const members = (
      await sql<{
        league_id: string;
        user_id: string;
        display_name: string;
        joined_at: string | Date;
      }>`
        select league_id, user_id, display_name, joined_at
        from league_chat_members
        where league_id = ${EASTSIDE_LEAGUE_ID}
        order by joined_at asc
      `
    ).map(mapMember);
    const messages = (
      await sql<{
        id: string;
        league_id: string;
        user_id: string;
        display_name: string;
        body: string;
        created_at: string | Date;
      }>`
        select id, league_id, user_id, display_name, body, created_at
        from league_chat_messages
        where league_id = ${EASTSIDE_LEAGUE_ID}
        order by created_at asc
        limit 100
      `
    ).map(mapMessage);
    return {
      members,
      messages,
      joined: members.some((m) => m.user_id === context.userId),
      full: members.length >= LEAGUE_CHAT_CAP,
      cap: LEAGUE_CHAT_CAP,
    };
  });

export const joinLeagueChat = createServerFn({ method: "POST" })
  .validator((displayName: string) => displayName.trim().slice(0, 80))
  .middleware([authMiddleware])
  .handler(async ({ context, data: displayName }): Promise<{ ok: boolean; reason?: string }> => {
    const name = displayName || "Member";
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const existing = await sql<{ user_id: string }>`
      select user_id from league_chat_members
      where league_id = ${EASTSIDE_LEAGUE_ID} and user_id = ${context.userId}
    `;
    if (existing.length > 0) {
      await sql`
        update league_chat_members
        set display_name = ${name}
        where league_id = ${EASTSIDE_LEAGUE_ID} and user_id = ${context.userId}
      `;
      return { ok: true };
    }
    const counted = await sql<{ n: number }>`
      select count(*)::int as n from league_chat_members
      where league_id = ${EASTSIDE_LEAGUE_ID}
    `;
    const n = Number(counted[0]?.n ?? 0);
    if (n >= LEAGUE_CHAT_CAP) {
      return { ok: false, reason: `League chat is full (${LEAGUE_CHAT_CAP}/${LEAGUE_CHAT_CAP}).` };
    }
    await sql`
      insert into league_chat_members (league_id, user_id, display_name)
      values (${EASTSIDE_LEAGUE_ID}, ${context.userId}, ${name})
    `;
    return { ok: true };
  });

export const sendLeagueMessage = createServerFn({ method: "POST" })
  .validator((body: string) => body.trim().slice(0, 2000))
  .middleware([authMiddleware])
  .handler(async ({ context, data: body }): Promise<LeagueChatMessage> => {
    if (!body) throw new Error("Empty message");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const member = await sql<{ display_name: string }>`
      select display_name from league_chat_members
      where league_id = ${EASTSIDE_LEAGUE_ID} and user_id = ${context.userId}
    `;
    if (member.length === 0) throw new Error("Join the room before sending.");
    const id = crypto.randomUUID();
    const rows = await sql<{
      id: string;
      league_id: string;
      user_id: string;
      display_name: string;
      body: string;
      created_at: string | Date;
    }>`
      insert into league_chat_messages (id, league_id, user_id, display_name, body)
      values (${id}, ${EASTSIDE_LEAGUE_ID}, ${context.userId}, ${member[0].display_name}, ${body})
      returning id, league_id, user_id, display_name, body, created_at
    `;
    return mapMessage(rows[0]);
  });
