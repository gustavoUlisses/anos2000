import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const sessionSchema = z.object({
  clientId: z.string().uuid(),
  nick: z.string().trim().min(1).max(24),
  password: z.string().optional(),
  personalMessage: z.string().optional(),
});

const profileMessageSchema = z.object({
  clientId: z.string().uuid(),
  personalMessage: z.string(),
});

function normalizePersonalMessage(message: string | undefined) {
  const cleanedMessage = message?.trim().replace(/\s+/g, " ").slice(0, 80);
  return cleanedMessage || "";
}

export async function POST(request: Request) {
  const parsedBody = sessionSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid MSN session payload." }, { status: 400 });
  }

  try {
    const env = getServerEnv();
    const supabase = createAdminSupabaseClient();
    const nick = parsedBody.data.nick;
    const isGusDev = nick.toLowerCase() === "gusdev";

    if (isGusDev && (!env.MSN_GUSDEV_PASSWORD || parsedBody.data.password !== env.MSN_GUSDEV_PASSWORD)) {
      return NextResponse.json({ error: "Reserved nick." }, { status: 403 });
    }

    const profile = {
      id: parsedBody.data.clientId,
      is_admin: isGusDev,
      last_seen_at: new Date().toISOString(),
      nick,
      personal_message: normalizePersonalMessage(
        parsedBody.data.personalMessage ?? (isGusDev ? "Criador do projeto" : undefined),
      ),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "id" })
      .select("id,nick,personal_message,is_admin,last_seen_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        id: data.id,
        isAdmin: data.is_admin,
        lastSeenAt: data.last_seen_at ?? new Date().toISOString(),
        nick: data.nick,
        personalMessage: data.personal_message,
      },
    });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const parsedBody = profileMessageSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid MSN profile payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const personalMessage = normalizePersonalMessage(parsedBody.data.personalMessage);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        last_seen_at: new Date().toISOString(),
        personal_message: personalMessage,
      })
      .eq("id", parsedBody.data.clientId)
      .select("id,nick,personal_message,is_admin,last_seen_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        id: data.id,
        isAdmin: data.is_admin,
        lastSeenAt: data.last_seen_at ?? new Date().toISOString(),
        nick: data.nick,
        personalMessage: data.personal_message,
      },
    });
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }
}
