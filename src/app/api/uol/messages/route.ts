import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UolMessage } from "@/features/uol-chat/types";

const uolRoomId = "geral";

const postMessageSchema = z.object({
  body: z.string().trim().min(1).max(500),
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  senderNick: z.string().trim().min(1).max(24),
});

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,sender_id,body,created_at")
      .eq("channel", "uol")
      .eq("room_id", uolRoomId)
      .order("created_at", { ascending: true })
      .limit(120);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const senderIds = Array.from(new Set((data ?? []).map((row) => row.sender_id)));
    const { data: profiles } = senderIds.length
      ? await supabase.from("profiles").select("id,nick").in("id", senderIds)
      : { data: [] };
    const nickByProfileId = new Map((profiles ?? []).map((profile) => [profile.id, profile.nick]));

    const messages: UolMessage[] = (data ?? []).map((row) => ({
      body: row.body,
      createdAt: row.created_at,
      id: row.id,
      senderId: row.sender_id,
      senderNick: nickByProfileId.get(row.sender_id) ?? "visitante",
    }));

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsedBody = postMessageSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid UOL chat message payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const message = parsedBody.data;
    const { error } = await supabase
      .from("chat_messages")
      .insert({
        body: message.body,
        channel: "uol",
        id: message.id,
        room_id: uolRoomId,
        sender_id: message.senderId,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}
