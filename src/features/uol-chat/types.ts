export type UolProfile = {
  id: string;
  lastSeenAt: string;
  nick: string;
};

export type UolMessage = {
  body: string;
  createdAt: string;
  id: string;
  senderId: string;
  senderNick: string;
};
