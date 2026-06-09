import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UolProfile } from "@/features/uol-chat/types";

const sessionSchema = z.object({
  clientId: z.string().uuid(),
  nick: z.string().trim().min(1).max(24),
});

const heartbeatSchema = z.object({
  clientId: z.string().uuid(),
});

const presenceStaleMs = 30_000;

function normalizeNick(rawNick: string) {
  return rawNick.trim().replace(/\s+/g, " ").slice(0, 24);
}

export async function POST(request: Request) {
  const parsedBody = sessionSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid UOL chat session payload." }, { status: 400 });
  }

  const nick = normalizeNick(parsedBody.data.nick);

  if (nick.toLowerCase() === "gusdev") {
    return NextResponse.json({ error: "Reserved nick." }, { status: 403 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const lastSeenAt = new Date().toISOString();
    const activeCutoff = new Date(Date.now() - presenceStaleMs).toISOString();
    const { data: activeProfiles, error: activeProfilesError } = await supabase
      .from("profiles")
      .select("id,nick,last_seen_at")
      .gte("last_seen_at", activeCutoff)
      .limit(200);

    if (activeProfilesError) {
      return NextResponse.json({ error: activeProfilesError.message }, { status: 500 });
    }

    const isNickInUse = (activeProfiles ?? []).some((profile) => (
      profile.id !== parsedBody.data.clientId && profile.nick.toLowerCase() === nick.toLowerCase()
    ));

    if (isNickInUse) {
      return NextResponse.json({ error: "Nick already in use." }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        avatar_url: "/msn/images/user.png",
        id: parsedBody.data.clientId,
        is_admin: false,
        last_seen_at: lastSeenAt,
        nick,
        personal_message: "",
      }, { onConflict: "id" })
      .select("id,nick,last_seen_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile: UolProfile = {
      id: data.id,
      lastSeenAt: data.last_seen_at ?? lastSeenAt,
      nick: data.nick,
    };

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const parsedBody = heartbeatSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid UOL heartbeat payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", parsedBody.data.clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const parsedBody = heartbeatSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid UOL logout payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ last_seen_at: null })
      .eq("id", parsedBody.data.clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}
