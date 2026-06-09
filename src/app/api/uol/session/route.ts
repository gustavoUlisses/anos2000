import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UolProfile } from "@/features/uol-chat/types";

const sessionSchema = z.object({
  clientId: z.string().uuid(),
  nick: z.string().trim().min(1).max(24),
});

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
