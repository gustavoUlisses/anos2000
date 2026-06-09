"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type {
  MsnBlockedContact,
  MsnChatPart,
  MsnContact,
  MsnMessage,
  MsnNudgeEvent,
  MsnOnlineEvent,
  MsnProfile,
} from "./types";
import { defaultMsnAvatar, normalizeMsnAvatar } from "./avatars";

const clientIdStorageKey = "anos2000:msn:client-id";
const profileStorageKey = "anos2000:msn:profile";
const gusDevId = "gusdev-offline";
const presenceHeartbeatMs = 12_000;
const presenceStaleMs = 30_000;
const nudgeSendCooldownMs = 5_000;
const nudgeReceiveCooldownMs = 2_000;

type PresencePayload = MsnProfile;
type PresenceStatusPayload = {
  profile: MsnProfile;
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
  const nickFromEmail = rawNick.includes("@") ? rawNick.split("@")[0] : rawNick;
  const cleanedNick = nickFromEmail.trim().replace(/\s+/g, " ").slice(0, 24);

  if (!cleanedNick) {
    throw new Error("Nick is required.");
  }

  return cleanedNick;
}

function normalizePersonalMessage(rawMessage: string | undefined) {
  const cleanedMessage = rawMessage?.trim().replace(/\s+/g, " ").slice(0, 80);
  return cleanedMessage || "";
}

function ensureProfileDefaults(profile: MsnProfile): MsnProfile {
  return {
    ...profile,
    avatar: normalizeMsnAvatar(profile.avatar),
    personalMessage: normalizePersonalMessage(profile.personalMessage),
  };
}

function getStoredProfile() {
  try {
    const storedProfile = localStorage.getItem(profileStorageKey);

    if (!storedProfile) {
      return null;
    }

    const profile = JSON.parse(storedProfile) as MsnProfile;

    if (profile.nick?.toLowerCase() === "gusdev" && !profile.isAdmin) {
      localStorage.removeItem(profileStorageKey);
      return null;
    }

    return ensureProfileDefaults(profile);
  } catch {
    return null;
  }
}

function storeProfile(profile: MsnProfile) {
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}

function clearStoredSession() {
  localStorage.removeItem(profileStorageKey);
  localStorage.removeItem(clientIdStorageKey);
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

function isMsnContact(value: unknown): value is MsnContact {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MsnContact>;

  return (
    typeof candidate.avatar === "string" &&
    typeof candidate.id === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.nick === "string" &&
    (candidate.status === "online" || candidate.status === "away" || candidate.status === "offline")
  );
}

function isMsnNudgeEvent(value: unknown): value is MsnNudgeEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MsnNudgeEvent>;

  return (
    typeof candidate.createdAt === "string" &&
    typeof candidate.id === "string" &&
    typeof candidate.recipientId === "string" &&
    typeof candidate.senderId === "string" &&
    isMsnContact(candidate.sender)
  );
}

function isMsnOnlineEvent(value: unknown): value is MsnOnlineEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MsnOnlineEvent>;

  return (
    typeof candidate.createdAt === "string" &&
    typeof candidate.id === "string" &&
    isMsnContact(candidate.contact)
  );
}

function isPresenceStatusPayload(value: unknown): value is PresenceStatusPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PresenceStatusPayload>;

  return (
    candidate.status === "offline" &&
    Boolean(candidate.profile?.id && candidate.profile.nick)
  );
}

function isProfileFresh(profile: MsnProfile, now: number) {
  const lastSeenAt = new Date(profile.lastSeenAt).getTime();
  return Number.isFinite(lastSeenAt) && now - lastSeenAt <= presenceStaleMs;
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

async function createSessionProfile(clientId: string, nick: string, password?: string, avatar?: string) {
  const isGusDev = nick.toLowerCase() === "gusdev";
  const fallbackProfile: MsnProfile = {
    avatar: normalizeMsnAvatar(avatar),
    id: clientId,
    isAdmin: false,
    lastSeenAt: new Date().toISOString(),
    nick,
    personalMessage: "",
  };

  try {
    const response = await fetch("/api/msn/session", {
      body: JSON.stringify({
        clientId,
        avatarUrl: normalizeMsnAvatar(avatar),
        nick,
        password,
        personalMessage: isGusDev ? "Criador do projeto" : "",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      if (isGusDev) {
        throw new Error("Nick GusDev reservado.");
      }

      return fallbackProfile;
    }

    const data = await response.json() as { profile?: MsnProfile };
    return data.profile ? ensureProfileDefaults(data.profile) : fallbackProfile;
  } catch {
    if (isGusDev) {
      throw new Error("Nick GusDev reservado.");
    }

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

async function persistPersonalMessage(profileId: string, personalMessage: string) {
  if (!isUuid(profileId)) {
    return;
  }

  await fetch("/api/msn/session", {
    body: JSON.stringify({ clientId: profileId, personalMessage }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  }).catch(() => undefined);
}

async function persistAvatar(profileId: string, avatarUrl: string) {
  if (!isUuid(profileId)) {
    return;
  }

  await fetch("/api/msn/session", {
    body: JSON.stringify({ avatarUrl, clientId: profileId }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  }).catch(() => undefined);
}

async function fetchBlockedContacts(profileId: string) {
  if (!isUuid(profileId)) {
    return [];
  }

  try {
    const params = new URLSearchParams({ blockerId: profileId });
    const response = await fetch(`/api/msn/blocks?${params.toString()}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { blockedContacts?: MsnBlockedContact[] };
    return data.blockedContacts ?? [];
  } catch {
    return [];
  }
}

async function persistBlockedContact(profileId: string, contact: MsnContact) {
  if (!isUuid(profileId) || !isUuid(contact.id)) {
    return null;
  }

  try {
    const response = await fetch("/api/msn/blocks", {
      body: JSON.stringify({
        blockedId: contact.id,
        blockedNickSnapshot: contact.nick,
        blockerId: profileId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as { blockedContact?: MsnBlockedContact };
    return data.blockedContact ?? null;
  } catch {
    return null;
  }
}

async function deleteBlockedContact(profileId: string, contactId: string) {
  if (!isUuid(profileId) || !isUuid(contactId)) {
    return false;
  }

  try {
    const response = await fetch("/api/msn/blocks", {
      body: JSON.stringify({
        blockedId: contactId,
        blockerId: profileId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function announceOffline(channel: RealtimeChannel | null, profile: MsnProfile | null) {
  if (!channel || !profile) {
    return;
  }

  await channel.send({
    event: "presence-status",
    payload: {
      profile,
      status: "offline",
    },
    type: "broadcast",
  }).catch(() => undefined);
}

export function useMsnRealtime() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const announceOnlineOnSubscribe = useRef<string | null>(null);
  const blockedContactIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastNudgeReceivedAt = useRef<Map<string, number>>(new Map());
  const lastNudgeSentAt = useRef<Map<string, number>>(new Map());
  const [messages, setMessages] = useState<MsnMessage[]>([]);
  const [blockedContacts, setBlockedContacts] = useState<MsnBlockedContact[]>([]);
  const [nudges, setNudges] = useState<MsnNudgeEvent[]>([]);
  const [onlineLogins, setOnlineLogins] = useState<MsnOnlineEvent[]>([]);
  const [hasPresenceSynced, setHasPresenceSynced] = useState(false);
  const [presenceNow, setPresenceNow] = useState(() => Date.now());
  const [onlineProfiles, setOnlineProfiles] = useState<MsnProfile[]>([]);
  const [profile, setProfile] = useState<MsnProfile | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getStoredProfile();
  });

  useEffect(() => {
    blockedContactIdsRef.current = new Set(blockedContacts.map((contact) => contact.id));
  }, [blockedContacts]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPresenceNow(Date.now());
    }, 5_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    let isActive = true;

    void fetchBlockedContacts(profile.id).then((contacts) => {
      if (isActive) {
        setBlockedContacts(contacts);
      }
    });

    return () => {
      isActive = false;
    };
  }, [profile]);

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
        .filter((presenceProfile) => presenceProfile.id && presenceProfile.nick)
        .map(ensureProfileDefaults);

      setOnlineProfiles(dedupeProfiles(profiles));
      setHasPresenceSynced(true);
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

        if (payload.senderId !== profile.id && blockedContactIdsRef.current.has(payload.senderId)) {
          return;
        }

        setMessages((current) => dedupeMessages([...current, payload]));
      })
      .on("broadcast", { event: "nudge" }, ({ payload }: { payload: unknown }) => {
        if (!isMsnNudgeEvent(payload)) {
          return;
        }

        if (payload.senderId === profile.id || payload.recipientId !== profile.id) {
          return;
        }

        if (blockedContactIdsRef.current.has(payload.senderId)) {
          return;
        }

        const now = Date.now();
        const lastNudgeAt = lastNudgeReceivedAt.current.get(payload.senderId) ?? 0;

        if (now - lastNudgeAt < nudgeReceiveCooldownMs) {
          return;
        }

        lastNudgeReceivedAt.current.set(payload.senderId, now);
        setNudges((current) => [...current.slice(-20), payload]);
      })
      .on("broadcast", { event: "user-online" }, ({ payload }: { payload: unknown }) => {
        if (!isMsnOnlineEvent(payload) || payload.contact.id === profile.id) {
          return;
        }

        if (blockedContactIdsRef.current.has(payload.contact.id)) {
          return;
        }

        setOnlineLogins((current) => [...current.slice(-20), payload]);
      })
      .on("broadcast", { event: "presence-status" }, ({ payload }: { payload: unknown }) => {
        if (!isPresenceStatusPayload(payload) || payload.profile.id === profile.id) {
          return;
        }

        setOnlineProfiles((current) => current.filter((onlineProfile) => onlineProfile.id !== payload.profile.id));
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel.track({
          ...profile,
          lastSeenAt: new Date().toISOString(),
        });

        if (announceOnlineOnSubscribe.current === profile.id) {
          announceOnlineOnSubscribe.current = null;
          await channel.send({
            event: "user-online",
            payload: {
              contact: {
                avatar: profile.avatar,
                id: profile.id,
                isAdmin: profile.isAdmin,
                message: profile.personalMessage || (profile.isAdmin ? "Criador do projeto" : ""),
                nick: profile.nick,
                status: "online",
              },
              createdAt: new Date().toISOString(),
              id: createId(),
            } satisfies MsnOnlineEvent,
            type: "broadcast",
          }).catch(() => undefined);
        }
      });

    const heartbeat = window.setInterval(() => {
      void channel.track({
        ...profile,
        lastSeenAt: new Date().toISOString(),
      });
    }, presenceHeartbeatMs);

    function untrackPresence() {
      void announceOffline(channel, profile);
      void channel.untrack();
    }

    window.addEventListener("beforeunload", untrackPresence);
    window.addEventListener("pagehide", untrackPresence);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("beforeunload", untrackPresence);
      window.removeEventListener("pagehide", untrackPresence);
      channelRef.current = null;
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [profile, supabase]);

  const login = useCallback(async (rawNick: string, password?: string, avatar?: string) => {
    const nick = normalizeNick(rawNick);
    const nextProfile = await createSessionProfile(getClientId(), nick, password, avatar);
    announceOnlineOnSubscribe.current = nextProfile.id;
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

    clearStoredSession();
    setBlockedContacts([]);
    setMessages([]);
    setNudges([]);
    setOnlineLogins([]);
    setHasPresenceSynced(false);
    setOnlineProfiles([]);
    setProfile(null);
  }, [profile, supabase]);

  const updatePersonalMessage = useCallback((rawMessage: string) => {
    if (!profile) {
      return;
    }

    const personalMessage = normalizePersonalMessage(rawMessage);
    const nextProfile: MsnProfile = {
      ...profile,
      lastSeenAt: new Date().toISOString(),
      personalMessage,
    };

    storeProfile(nextProfile);
    setProfile(nextProfile);
    setOnlineProfiles((current) => dedupeProfiles([
      ...current.filter((onlineProfile) => onlineProfile.id !== nextProfile.id),
      nextProfile,
    ]));

    if (channelRef.current) {
      void channelRef.current.track(nextProfile);
    }

    void persistPersonalMessage(nextProfile.id, personalMessage);
  }, [profile]);

  const updateAvatar = useCallback((avatarUrl: string) => {
    if (!profile) {
      return;
    }

    const avatar = normalizeMsnAvatar(avatarUrl);
    const nextProfile: MsnProfile = {
      ...profile,
      avatar,
      lastSeenAt: new Date().toISOString(),
    };

    storeProfile(nextProfile);
    setProfile(nextProfile);
    setOnlineProfiles((current) => dedupeProfiles([
      ...current.filter((onlineProfile) => onlineProfile.id !== nextProfile.id),
      nextProfile,
    ]));

    if (channelRef.current) {
      void channelRef.current.track(nextProfile);
    }

    void persistAvatar(nextProfile.id, avatar);
  }, [profile]);

  const loadConversation = useCallback(async (contactId: string) => {
    if (!profile || blockedContactIdsRef.current.has(contactId)) {
      return;
    }

    const history = await fetchConversation(profile.id, contactId);

    if (history.length) {
      setMessages((current) => dedupeMessages([...current, ...history]));
    }
  }, [profile]);

  const sendMessage = useCallback(async (contact: MsnContact, parts: MsnChatPart[]) => {
    if (!profile || blockedContactIdsRef.current.has(contact.id)) {
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

    await persistMessage(message);
  }, [profile]);

  const sendNudge = useCallback((contact: MsnContact) => {
    if (!profile || !channelRef.current || blockedContactIdsRef.current.has(contact.id)) {
      return false;
    }

    const now = Date.now();
    const lastNudgeAt = lastNudgeSentAt.current.get(contact.id) ?? 0;

    if (now - lastNudgeAt < nudgeSendCooldownMs) {
      return false;
    }

    lastNudgeSentAt.current.set(contact.id, now);

    const nudge: MsnNudgeEvent = {
      createdAt: new Date().toISOString(),
      id: createId(),
      recipientId: contact.id,
      sender: {
        avatar: profile.avatar,
        id: profile.id,
        isAdmin: profile.isAdmin,
        message: profile.personalMessage || (profile.isAdmin ? "Criador do projeto" : ""),
        nick: profile.nick,
        status: "online",
      },
      senderId: profile.id,
    };

    void channelRef.current.send({
      event: "nudge",
      payload: nudge,
      type: "broadcast",
    }).catch(() => undefined);

    return true;
  }, [profile]);

  const addSystemMessage = useCallback((contact: MsnContact, text: string) => {
    if (!profile) {
      return;
    }

    const message: MsnMessage = {
      createdAt: new Date().toISOString(),
      id: `system-${contact.id}-${createId()}`,
      kind: "system",
      parts: [{ text, type: "text" }],
      recipientId: profile.id,
      senderId: contact.id,
      senderNick: "Windows Live Messenger",
    };

    setMessages((current) => dedupeMessages([...current, message]));
  }, [profile]);

  const blockContact = useCallback(async (contact: MsnContact) => {
    if (!profile || profile.id === contact.id || !isUuid(contact.id)) {
      return false;
    }

    const optimisticContact: MsnBlockedContact = {
      avatar: contact.avatar,
      blockedAt: new Date().toISOString(),
      id: contact.id,
      nick: contact.nick,
    };

    setBlockedContacts((current) => dedupeBlockedContacts([optimisticContact, ...current]));
    const persistedContact = await persistBlockedContact(profile.id, contact);

    if (persistedContact) {
      setBlockedContacts((current) => dedupeBlockedContacts([persistedContact, ...current]));
    }

    return true;
  }, [profile]);

  const unblockContact = useCallback(async (contactId: string) => {
    if (!profile || !isUuid(contactId)) {
      return false;
    }

    setBlockedContacts((current) => current.filter((contact) => contact.id !== contactId));
    const wasDeleted = await deleteBlockedContact(profile.id, contactId);

    if (!wasDeleted) {
      const contacts = await fetchBlockedContacts(profile.id);
      setBlockedContacts(contacts);
    }

    return wasDeleted;
  }, [profile]);

  const contacts = useMemo(() => {
    if (!profile) {
      return [];
    }

    const visibleOnlineProfiles = supabase ? onlineProfiles : profile ? [profile] : [];
    const freshOnlineProfiles = visibleOnlineProfiles.filter((onlineProfile) => (
      onlineProfile.id === profile.id || isProfileFresh(onlineProfile, presenceNow)
    ));
    const onlineContacts: MsnContact[] = freshOnlineProfiles
      .filter((onlineProfile) => onlineProfile.id !== profile.id)
      .map((onlineProfile) => ({
        avatar: onlineProfile.avatar,
        id: onlineProfile.id,
        isAdmin: onlineProfile.isAdmin,
        message: onlineProfile.personalMessage || (onlineProfile.isAdmin ? "Criador do projeto" : ""),
        nick: onlineProfile.nick,
        status: "online",
      }));

    const hasGusDevOnline = onlineContacts.some((contact) => contact.nick.toLowerCase() === "gusdev");
    const offlineContacts: MsnContact[] = [];

    if (!hasGusDevOnline && profile.nick.toLowerCase() !== "gusdev") {
      offlineContacts.push({
        avatar: defaultMsnAvatar,
        id: gusDevId,
        isAdmin: true,
        message: "Criador do projeto",
        nick: "GusDev",
        status: "offline",
      });
    }

    const blockedIds = new Set(blockedContacts.map((contact) => contact.id));

    return [...onlineContacts, ...offlineContacts].filter((contact) => !blockedIds.has(contact.id));
  }, [blockedContacts, onlineProfiles, presenceNow, profile, supabase]);

  const getConversation = useCallback((contactId: string) => {
    if (!profile) {
      return [];
    }

    if (blockedContactIdsRef.current.has(contactId)) {
      return [];
    }

    return messages.filter((message) => (
      (message.senderId === profile.id && message.recipientId === contactId) ||
      (message.senderId === contactId && message.recipientId === profile.id)
    ));
  }, [messages, profile]);

  const onlineProfileIds = useMemo(() => (
    onlineProfiles
      .filter((onlineProfile) => isProfileFresh(onlineProfile, presenceNow))
      .map((onlineProfile) => onlineProfile.id)
  ), [onlineProfiles, presenceNow]);

  return {
    addSystemMessage,
    blockContact,
    blockedContacts,
    contacts,
    getConversation,
    hasPresenceSynced,
    isRealtimeConfigured: Boolean(supabase),
    loadConversation,
    login,
    logout,
    messages,
    nudges,
    onlineLogins,
    onlineProfileIds,
    profile,
    sendMessage,
    sendNudge,
    unblockContact,
    updatePersonalMessage,
    updateAvatar,
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

function dedupeBlockedContacts(contacts: MsnBlockedContact[]) {
  const byId = new Map<string, MsnBlockedContact>();

  for (const contact of contacts) {
    byId.set(contact.id, contact);
  }

  return Array.from(byId.values()).sort((a, b) => b.blockedAt.localeCompare(a.blockedAt));
}
