import { getSupabase } from "@/lib/supabase/client";

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

export async function fetchLeagueMembers() {
  const sb = getSupabase();
  if (!sb) return [] as LeagueChatMember[];
  const { data, error } = await sb
    .from("league_chat_members")
    .select("league_id,user_id,display_name,joined_at")
    .eq("league_id", EASTSIDE_LEAGUE_ID)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeagueChatMember[];
}

export async function fetchLeagueMessages(limit = 100) {
  const sb = getSupabase();
  if (!sb) return [] as LeagueChatMessage[];
  const { data, error } = await sb
    .from("league_chat_messages")
    .select("id,league_id,user_id,display_name,body,created_at")
    .eq("league_id", EASTSIDE_LEAGUE_ID)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeagueChatMessage[];
}

export async function joinLeagueChat(displayName: string) {
  const sb = getSupabase();
  if (!sb) return false;
  const { data, error } = await sb.rpc("join_eastside_league_chat", {
    p_display_name: displayName,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function sendLeagueMessage(body: string, displayName: string, userId: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Empty message");
  const { data, error } = await sb
    .from("league_chat_messages")
    .insert({
      league_id: EASTSIDE_LEAGUE_ID,
      user_id: userId,
      display_name: displayName,
      body: trimmed.slice(0, 2000),
    })
    .select("id,league_id,user_id,display_name,body,created_at")
    .single();
  if (error) throw error;
  return data as LeagueChatMessage;
}

export function subscribeLeagueMessages(
  onInsert: (msg: LeagueChatMessage) => void,
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const channel = sb
    .channel(`league-chat:${EASTSIDE_LEAGUE_ID}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "league_chat_messages",
        filter: `league_id=eq.${EASTSIDE_LEAGUE_ID}`,
      },
      (payload) => {
        onInsert(payload.new as LeagueChatMessage);
      },
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}
