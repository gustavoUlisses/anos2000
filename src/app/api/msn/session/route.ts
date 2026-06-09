import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { defaultMsnAvatar, normalizeMsnAvatar } from "@/features/messenger/msn/avatars";

const sessionSchema = z.object({
  avatarUrl: z.string().optional(),
  clientId: z.string().uuid(),
  nick: z.string().trim().min(1).max(24),
  password: z.string().optional(),
  personalMessage: z.string().optional(),
});

const profileMessageSchema = z.object({
  avatarUrl: z.string().optional(),
  clientId: z.string().uuid(),
  personalMessage: z.string().optional(),
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
      avatar_url: normalizeMsnAvatar(parsedBody.data.avatarUrl ?? defaultMsnAvatar),
      id: parsedBody.data.clientId,
      is_admin: isGusDev,
      last_seen_at: new Date().toISOString(),
      nick,
      personal_message: normalizePersonalMessage(
        parsedBody.data.personalMessage ?? (isGusDev ? "@gus.dev" : undefined),
      ),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "id" })
      .select("id,nick,personal_message,avatar_url,is_admin,last_seen_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        avatar: normalizeMsnAvatar(data.avatar_url),
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
    const updates: {
      avatar_url?: string;
      last_seen_at: string;
      personal_message?: string;
    } = {
      last_seen_at: new Date().toISOString(),
    };

    if (parsedBody.data.personalMessage !== undefined) {
      updates.personal_message = normalizePersonalMessage(parsedBody.data.personalMessage);
    }

    if (parsedBody.data.avatarUrl !== undefined) {
      updates.avatar_url = normalizeMsnAvatar(parsedBody.data.avatarUrl);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", parsedBody.data.clientId)
      .select("id,nick,personal_message,avatar_url,is_admin,last_seen_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        avatar: normalizeMsnAvatar(data.avatar_url),
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
