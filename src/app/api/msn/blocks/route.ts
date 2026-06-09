import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { MsnBlockedContact } from "@/features/messenger/msn/types";

const blocksQuerySchema = z.object({
  blockerId: z.string().uuid(),
});

const blockBodySchema = z.object({
  blockedId: z.string().uuid(),
  blockedNickSnapshot: z.string().trim().min(1).max(24),
  blockerId: z.string().uuid(),
});

function toBlockedContact(row: {
  blocked_id: string;
  blocked_nick_snapshot: string;
  created_at: string;
}): MsnBlockedContact {
  return {
    avatar: "/msn/images/user.png",
    blockedAt: row.created_at,
    id: row.blocked_id,
    nick: row.blocked_nick_snapshot,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = blocksQuerySchema.safeParse({
    blockerId: searchParams.get("blockerId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid MSN blocks query." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("msn_blocks")
      .select("blocked_id,blocked_nick_snapshot,created_at")
      .eq("blocker_id", parsedQuery.data.blockerId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blockedContacts: (data ?? []).map(toBlockedContact) });
  } catch {
    return NextResponse.json({ blockedContacts: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsedBody = blockBodySchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success || parsedBody.data.blockerId === parsedBody.data.blockedId) {
    return NextResponse.json({ error: "Invalid MSN block payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const block = parsedBody.data;
    const { data, error } = await supabase
      .from("msn_blocks")
      .upsert({
        blocked_id: block.blockedId,
        blocked_nick_snapshot: block.blockedNickSnapshot,
        blocker_id: block.blockerId,
      }, { onConflict: "blocker_id,blocked_id" })
      .select("blocked_id,blocked_nick_snapshot,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blockedContact: toBlockedContact(data) });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const parsedBody = blockBodySchema
    .pick({ blockedId: true, blockerId: true })
    .safeParse(await request.json().catch(() => null));

  if (!parsedBody.success || parsedBody.data.blockerId === parsedBody.data.blockedId) {
    return NextResponse.json({ error: "Invalid MSN unblock payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("msn_blocks")
      .delete()
      .eq("blocked_id", parsedBody.data.blockedId)
      .eq("blocker_id", parsedBody.data.blockerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}
