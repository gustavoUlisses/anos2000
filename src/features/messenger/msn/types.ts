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
  id: string;
  isAdmin: boolean;
  lastSeenAt: string;
  nick: string;
};

export type MsnContact = {
  avatar: string;
  id: string;
  isAdmin?: boolean;
  isBot?: boolean;
  message: string;
  nick: string;
  status: "online" | "away" | "offline";
};

export type MsnMessage = {
  createdAt: string;
  id: string;
  parts: MsnChatPart[];
  recipientId: string | null;
  senderId: string;
  senderNick: string;
};
