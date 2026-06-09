"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { UolMessage, UolProfile } from "./types";

const clientIdStorageKey = "anos2000:uol:client-id";
const profileStorageKey = "anos2000:uol:profile";
const presenceHeartbeatMs = 12_000;
const presenceStaleMs = 30_000;

type PresencePayload = UolProfile;
type PresenceStatusPayload = {
  profile: UolProfile;
  status: "offline";
};

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getClientId() {
  const storedId = localStorage.getItem(clientIdStorageKey);

  if (storedId) {
    return storedId;
  }

  const id = createId();
  localStorage.setItem(clientIdStorageKey, id);
  return id;
}

function normalizeNick(rawNick: string) {
  const cleanedNick = rawNick.trim().replace(/\s+/g, " ").slice(0, 24);

  if (!cleanedNick) {
    throw new Error("Digite um apelido para entrar.");
  }

  if (cleanedNick.toLowerCase() === "gusdev") {
    throw new Error("Esse apelido esta reservado.");
  }

  return cleanedNick;
}

function normalizeMessage(rawMessage: string) {
  return rawMessage.trim().replace(/\s+/g, " ").slice(0, 500);
}

function isUolProfile(value: unknown): value is UolProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UolProfile>;
  return typeof candidate.id === "string" && typeof candidate.nick === "string" && typeof candidate.lastSeenAt === "string";
}

function isUolMessage(value: unknown): value is UolMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UolMessage>;
  return (
    typeof candidate.body === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.id === "string" &&
    typeof candidate.senderId === "string" &&
    typeof candidate.senderNick === "string"
  );
}

function isPresenceStatusPayload(value: unknown): value is PresenceStatusPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PresenceStatusPayload>;
  return candidate.status === "offline" && isUolProfile(candidate.profile);
}

function getStoredProfile() {
  try {
    const storedProfile = localStorage.getItem(profileStorageKey);
    if (!storedProfile) return null;
    const profile = JSON.parse(storedProfile) as UolProfile;
    return isUolProfile(profile) ? profile : null;
  } catch {
    return null;
  }
}

function storeProfile(profile: UolProfile) {
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}

function clearStoredSession() {
  localStorage.removeItem(clientIdStorageKey);
  localStorage.removeItem(profileStorageKey);
}

function isProfileFresh(profile: UolProfile, now: number) {
  const lastSeenAt = new Date(profile.lastSeenAt).getTime();
  return Number.isFinite(lastSeenAt) && now - lastSeenAt <= presenceStaleMs;
}

function dedupeProfiles(profiles: UolProfile[]) {
  const byId = new Map<string, UolProfile>();

  for (const profile of profiles) {
    byId.set(profile.id, profile);
  }

  return Array.from(byId.values()).sort((a, b) => a.nick.localeCompare(b.nick));
}

function dedupeMessages(messages: UolMessage[]) {
  const seenIds = new Set<string>();

  return messages.filter((message) => {
    if (seenIds.has(message.id)) return false;
    seenIds.add(message.id);
    return true;
  });
}

async function createSessionProfile(clientId: string, nick: string) {
  const fallbackProfile: UolProfile = {
    id: clientId,
    lastSeenAt: new Date().toISOString(),
    nick,
  };

  try {
    const response = await fetch("/api/uol/session", {
      body: JSON.stringify({ clientId, nick }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error("Esse apelido esta reservado.");
      if (response.status === 409) throw new Error("Esse apelido ja esta em uso na sala.");
      return fallbackProfile;
    }

    const data = await response.json() as { profile?: UolProfile };
    return data.profile && isUolProfile(data.profile) ? data.profile : fallbackProfile;
  } catch (error) {
    if (error instanceof Error && error.message.includes("reservado")) {
      throw error;
    }

    return fallbackProfile;
  }
}

async function fetchHistory() {
  try {
    const response = await fetch("/api/uol/messages");

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { messages?: UolMessage[] };
    return data.messages?.filter(isUolMessage) ?? [];
  } catch {
    return [];
  }
}

async function persistMessage(message: UolMessage) {
  await fetch("/api/uol/messages", {
    body: JSON.stringify(message),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => undefined);
}

async function persistHeartbeat(profileId: string) {
  await fetch("/api/uol/session", {
    body: JSON.stringify({ clientId: profileId }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  }).catch(() => undefined);
}

async function persistLogout(profileId: string) {
  await fetch("/api/uol/session", {
    body: JSON.stringify({ clientId: profileId }),
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "DELETE",
  }).catch(() => undefined);
}

async function announceOffline(channel: RealtimeChannel | null, profile: UolProfile | null) {
  if (!channel || !profile) return;

  await channel.send({
    event: "presence-status",
    payload: {
      profile,
      status: "offline",
    },
    type: "broadcast",
  }).catch(() => undefined);
}

export function useUolChat() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [hasPresenceSynced, setHasPresenceSynced] = useState(false);
  const [messages, setMessages] = useState<UolMessage[]>([]);
  const [onlineProfiles, setOnlineProfiles] = useState<UolProfile[]>([]);
  const [presenceNow, setPresenceNow] = useState(() => Date.now());
  const [profile, setProfile] = useState<UolProfile | null>(() => {
    if (typeof window === "undefined") return null;
    return getStoredProfile();
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPresenceNow(Date.now());
    }, 5_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) return;

    const activeProfile = profile;
    let isActive = true;

    void fetchHistory().then((history) => {
      if (isActive) {
        setMessages((current) => dedupeMessages([...history, ...current]));
      }
    });

    return () => {
      isActive = false;
      clearStoredSession();
      void persistLogout(activeProfile.id);
    };
  }, [profile]);

  useEffect(() => {
    if (!profile || !supabase) return;

    const activeProfile = profile;
    const channel = supabase.channel("uol-chat-geral", {
      config: {
        presence: { key: activeProfile.id },
      },
    });
    channelRef.current = channel;

    function syncPresence() {
      const presenceState = channel.presenceState() as Record<string, PresencePayload[]>;
      const profiles = Object.values(presenceState)
        .flat()
        .filter(isUolProfile);

      setOnlineProfiles(dedupeProfiles(profiles));
      setHasPresenceSynced(true);
    }

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("broadcast", { event: "message" }, ({ payload }: { payload: unknown }) => {
        if (!isUolMessage(payload)) return;
        setMessages((current) => dedupeMessages([...current, payload]));
      })
      .on("broadcast", { event: "presence-status" }, ({ payload }: { payload: unknown }) => {
        if (!isPresenceStatusPayload(payload) || payload.profile.id === activeProfile.id) return;
        setOnlineProfiles((current) => current.filter((onlineProfile) => onlineProfile.id !== payload.profile.id));
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        await channel.track({
          ...activeProfile,
          lastSeenAt: new Date().toISOString(),
        });
      });

    const heartbeat = window.setInterval(() => {
      void channel.track({
        ...activeProfile,
        lastSeenAt: new Date().toISOString(),
      });
      void persistHeartbeat(activeProfile.id);
    }, presenceHeartbeatMs);

    function untrackPresence() {
      void announceOffline(channel, activeProfile);
      void channel.untrack();
      void persistLogout(activeProfile.id);
      clearStoredSession();
    }

    window.addEventListener("beforeunload", untrackPresence);
    window.addEventListener("pagehide", untrackPresence);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("beforeunload", untrackPresence);
      window.removeEventListener("pagehide", untrackPresence);
      channelRef.current = null;
      void announceOffline(channel, activeProfile);
      void channel.untrack();
      void persistLogout(activeProfile.id);
      clearStoredSession();
      void supabase.removeChannel(channel);
    };
  }, [profile, supabase]);

  const login = useCallback(async (rawNick: string) => {
    const nick = normalizeNick(rawNick);
    const nextProfile = await createSessionProfile(getClientId(), nick);
    storeProfile(nextProfile);
    setProfile(nextProfile);
    setOnlineProfiles((current) => dedupeProfiles([...current, nextProfile]));
  }, []);

  const logout = useCallback(async () => {
    const channel = channelRef.current;

    await announceOffline(channel, profile);

    if (channel) {
      await channel.untrack().catch(() => undefined);
      channelRef.current = null;
      void supabase?.removeChannel(channel);
    }

    if (profile) {
      await persistLogout(profile.id);
    }

    clearStoredSession();
    setHasPresenceSynced(false);
    setMessages([]);
    setOnlineProfiles([]);
    setProfile(null);
  }, [profile, supabase]);

  const sendMessage = useCallback(async (rawMessage: string) => {
    if (!profile) return false;
    const body = normalizeMessage(rawMessage);
    if (!body) return false;

    const message: UolMessage = {
      body,
      createdAt: new Date().toISOString(),
      id: createId(),
      senderId: profile.id,
      senderNick: profile.nick,
    };

    setMessages((current) => dedupeMessages([...current, message]));

    if (channelRef.current) {
      await channelRef.current.send({
        event: "message",
        payload: message,
        type: "broadcast",
      }).catch(() => undefined);
    }

    await persistMessage(message);
    return true;
  }, [profile]);

  const onlineUsers = useMemo(() => {
    if (!profile) return [];

    const profiles = supabase ? onlineProfiles : [profile];
    return dedupeProfiles(profiles.filter((onlineProfile) => (
      onlineProfile.id === profile.id || isProfileFresh(onlineProfile, presenceNow)
    )));
  }, [onlineProfiles, presenceNow, profile, supabase]);

  return {
    hasPresenceSynced,
    isRealtimeConfigured: Boolean(supabase),
    login,
    logout,
    messages,
    onlineUsers,
    profile,
    sendMessage,
  };
}
