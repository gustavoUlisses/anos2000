export type MsnChatPart =
  | {
    text: string;
    type: "text";
  }
  | {
    alt: string;
    src: string;
    type: "emoji";
  };

export type MsnProfile = {
  avatar: string;
  id: string;
  isAdmin: boolean;
  lastSeenAt: string;
  nick: string;
  personalMessage: string;
};

export type MsnContact = {
  avatar: string;
  id: string;
  isAdmin?: boolean;
  message: string;
  nick: string;
  status: "online" | "away" | "offline";
};

export type MsnBlockedContact = {
  avatar: string;
  blockedAt: string;
  id: string;
  nick: string;
};

export type MsnMessage = {
  createdAt: string;
  id: string;
  kind?: "system";
  parts: MsnChatPart[];
  recipientId: string | null;
  senderId: string;
  senderNick: string;
};

export type MsnNudgeEvent = {
  createdAt: string;
  id: string;
  recipientId: string;
  sender: MsnContact;
  senderId: string;
};

export type MsnOnlineEvent = {
  contact: MsnContact;
  createdAt: string;
  id: string;
};
