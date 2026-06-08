import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { MsnChatPart, MsnMessage } from "@/features/messenger/msn/types";

const chatPartSchema = z.discriminatedUnion("type", [
  z.object({
    text: z.string().max(1000),
    type: z.literal("text"),
  }),
  z.object({
    alt: z.string().max(40),
    src: z.string().max(200),
    type: z.literal("emoji"),
  }),
]);

const postMessageSchema = z.object({
  id: z.string().uuid(),
  parts: z.array(chatPartSchema).min(1).max(80),
  recipientId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderNick: z.string().trim().min(1).max(24),
});

const getMessagesSchema = z.object({
  contactId: z.string().uuid(),
  selfId: z.string().uuid(),
});

function encodeParts(parts: MsnChatPart[]) {
  return JSON.stringify(parts).slice(0, 1000);
}

function decodeParts(body: string): MsnChatPart[] {
  try {
    const parsedParts = chatPartSchema.array().parse(JSON.parse(body));
    return parsedParts;
  } catch {
    return [{ text: body, type: "text" }];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = getMessagesSchema.safeParse({
    contactId: searchParams.get("contactId"),
    selfId: searchParams.get("selfId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid MSN messages query." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { contactId, selfId } = parsedQuery.data;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,sender_id,recipient_id,body,created_at")
      .eq("channel", "msn")
      .or(`and(sender_id.eq.${selfId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${selfId})`)
      .order("created_at", { ascending: true })
      .limit(80);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const senderIds = Array.from(new Set((data ?? []).map((row) => row.sender_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,nick")
      .in("id", senderIds);
    const nickByProfileId = new Map((profiles ?? []).map((profile) => [profile.id, profile.nick]));

    const messages: MsnMessage[] = (data ?? []).map((row) => {
      return {
        createdAt: row.created_at,
        id: row.id,
        parts: decodeParts(row.body),
        recipientId: row.recipient_id,
        senderId: row.sender_id,
        senderNick: nickByProfileId.get(row.sender_id) ?? (row.sender_id === selfId ? "Voce" : "Contato"),
      };
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsedBody = postMessageSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid MSN message payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const message = parsedBody.data;
    const { error } = await supabase
      .from("chat_messages")
      .insert({
        body: encodeParts(message.parts),
        channel: "msn",
        recipient_id: message.recipientId,
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
