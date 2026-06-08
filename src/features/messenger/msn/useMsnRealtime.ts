"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { MsnChatPart, MsnContact, MsnMessage, MsnProfile } from "./types";

const clientIdStorageKey = "anos2000:msn:client-id";
const profileStorageKey = "anos2000:msn:profile";
const gusDevId = "gusdev-offline";

type PresencePayload = MsnProfile;

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
  const nickFromEmail = rawNick.includes("@") ? rawNick.split("@")[0] : rawNick;
  const cleanedNick = nickFromEmail.trim().replace(/\s+/g, " ").slice(0, 24);

  if (!cleanedNick) {
    throw new Error("Nick is required.");
  }

  if (cleanedNick.toLowerCase() === "gusdev") {
    throw new Error("Reserved nick.");
  }

  return cleanedNick;
}

function getStoredProfile() {
  try {
    const storedProfile = localStorage.getItem(profileStorageKey);

    if (!storedProfile) {
      return null;
    }

    const profile = JSON.parse(storedProfile) as MsnProfile;

    if (profile.nick?.toLowerCase() === "gusdev") {
      localStorage.removeItem(profileStorageKey);
      return null;
    }

    return profile;
  } catch {
    return null;
  }
}

function storeProfile(profile: MsnProfile) {
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}

function isUuid(value: string | null | undefined) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));
}

function isChatPart(value: unknown): value is MsnChatPart {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MsnChatPart>;

  if (candidate.type === "text") {
    return typeof candidate.text === "string";
  }

  if (candidate.type === "emoji") {
    return typeof candidate.alt === "string" && typeof candidate.src === "string";
  }

  return false;
}

function isMsnMessage(value: unknown): value is MsnMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MsnMessage>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.senderId === "string" &&
    typeof candidate.senderNick === "string" &&
    (typeof candidate.recipientId === "string" || candidate.recipientId === null) &&
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.parts) &&
    candidate.parts.every(isChatPart)
  );
}

function dedupeMessages(messages: MsnMessage[]) {
  const seenIds = new Set<string>();

  return messages.filter((message) => {
    if (seenIds.has(message.id)) {
      return false;
    }

    seenIds.add(message.id);
    return true;
  });
}

async function createSessionProfile(clientId: string, nick: string) {
  const fallbackProfile: MsnProfile = {
    id: clientId,
    isAdmin: false,
    lastSeenAt: new Date().toISOString(),
    nick,
  };

  try {
    const response = await fetch("/api/msn/session", {
      body: JSON.stringify({ clientId, nick }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      return fallbackProfile;
    }

    const data = await response.json() as { profile?: MsnProfile };
    return data.profile ?? fallbackProfile;
  } catch {
    return fallbackProfile;
  }
}

async function persistMessage(message: MsnMessage) {
  if (!isUuid(message.senderId) || (message.recipientId && !isUuid(message.recipientId))) {
    return;
  }

  await fetch("/api/msn/messages", {
    body: JSON.stringify(message),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => undefined);
}

async function fetchConversation(profileId: string, contactId: string) {
  if (!isUuid(profileId) || !isUuid(contactId)) {
    return [];
  }

  try {
    const params = new URLSearchParams({ contactId, selfId: profileId });
    const response = await fetch(`/api/msn/messages?${params.toString()}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { messages?: MsnMessage[] };
    return data.messages?.filter(isMsnMessage) ?? [];
  } catch {
    return [];
  }
}

export function useMsnRealtime() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [messages, setMessages] = useState<MsnMessage[]>([]);
  const [onlineProfiles, setOnlineProfiles] = useState<MsnProfile[]>([]);
  const [profile, setProfile] = useState<MsnProfile | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getStoredProfile();
  });

  useEffect(() => {
    if (!profile || !supabase) {
      return;
    }

    const channel = supabase.channel("msn-online", {
      config: {
        presence: { key: profile.id },
      },
    });
    channelRef.current = channel;

    function syncPresence() {
      const presenceState = channel.presenceState() as Record<string, PresencePayload[]>;
      const profiles = Object.values(presenceState)
        .flat()
        .filter((presenceProfile) => presenceProfile.id && presenceProfile.nick);

      setOnlineProfiles(dedupeProfiles(profiles));
    }

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("broadcast", { event: "message" }, ({ payload }: { payload: unknown }) => {
        if (!isMsnMessage(payload)) {
          return;
        }

        if (payload.senderId !== profile.id && payload.recipientId !== profile.id) {
          return;
        }

        setMessages((current) => dedupeMessages([...current, payload]));
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel.track({
          ...profile,
          lastSeenAt: new Date().toISOString(),
        });
      });

    const heartbeat = window.setInterval(() => {
      void channel.track({
        ...profile,
        lastSeenAt: new Date().toISOString(),
      });
    }, 25_000);

    return () => {
      window.clearInterval(heartbeat);
      channelRef.current = null;
      void channel.untrack();
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

  const loadConversation = useCallback(async (contactId: string) => {
    if (!profile) {
      return;
    }

    const history = await fetchConversation(profile.id, contactId);

    if (history.length) {
      setMessages((current) => dedupeMessages([...current, ...history]));
    }
  }, [profile]);

  const sendMessage = useCallback(async (contact: MsnContact, parts: MsnChatPart[]) => {
    if (!profile) {
      return;
    }

    const message: MsnMessage = {
      createdAt: new Date().toISOString(),
      id: createId(),
      parts,
      recipientId: contact.id,
      senderId: profile.id,
      senderNick: profile.nick,
    };

    setMessages((current) => dedupeMessages([...current, message]));

    if (channelRef.current) {
      await channelRef.current.send({
        event: "message",
        payload: message,
        type: "broadcast",
      });
    }

    if (contact.isBot) {
      window.setTimeout(() => {
        setMessages((current) => dedupeMessages([
          ...current,
          {
            createdAt: new Date().toISOString(),
            id: createId(),
            parts: [{ text: "Recebi sua mensagem. Em breve eu conecto voce com outros visitantes online.", type: "text" }],
            recipientId: profile.id,
            senderId: contact.id,
            senderNick: contact.nick,
          },
        ]));
      }, 700);
      return;
    }

    await persistMessage(message);
  }, [profile]);

  const contacts = useMemo(() => {
    if (!profile) {
      return [];
    }

    const visibleOnlineProfiles = supabase ? onlineProfiles : profile ? [profile] : [];
    const onlineContacts: MsnContact[] = visibleOnlineProfiles
      .filter((onlineProfile) => onlineProfile.id !== profile.id)
      .map((onlineProfile) => ({
        avatar: "/msn/images/user.png",
        id: onlineProfile.id,
        isAdmin: onlineProfile.isAdmin,
        message: onlineProfile.isAdmin ? "Criador do projeto" : "Online agora",
        nick: onlineProfile.nick,
        status: "online",
      }));

    const hasGusDevOnline = onlineContacts.some((contact) => contact.nick.toLowerCase() === "gusdev");
    const offlineContacts: MsnContact[] = [];

    if (!hasGusDevOnline && profile.nick.toLowerCase() !== "gusdev") {
      offlineContacts.push({
        avatar: "/msn/images/user.png",
        id: gusDevId,
        isAdmin: true,
        message: "Criador do projeto",
        nick: "GusDev",
        status: "offline",
      });
    }

    offlineContacts.push({
      avatar: "/msn/images/msn.webp",
      id: "anos2000-bot",
      isBot: true,
      message: supabase ? "Aguardando visitantes online" : "Modo local sem Supabase",
      nick: "Anos2000 Bot",
      status: "away",
    });

    return [...onlineContacts, ...offlineContacts];
  }, [onlineProfiles, profile, supabase]);

  const getConversation = useCallback((contactId: string) => {
    if (!profile) {
      return [];
    }

    return messages.filter((message) => (
      (message.senderId === profile.id && message.recipientId === contactId) ||
      (message.senderId === contactId && message.recipientId === profile.id)
    ));
  }, [messages, profile]);

  return {
    contacts,
    getConversation,
    isRealtimeConfigured: Boolean(supabase),
    loadConversation,
    login,
    profile,
    sendMessage,
  };
}

function dedupeProfiles(profiles: MsnProfile[]) {
  const byId = new Map<string, MsnProfile>();

  for (const profile of profiles) {
    byId.set(profile.id, profile);
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.isAdmin !== b.isAdmin) {
      return a.isAdmin ? -1 : 1;
    }

    return a.nick.localeCompare(b.nick);
  });
}
