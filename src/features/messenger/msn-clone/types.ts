export type MessengerContact = {
  id: string;
  nick: string;
  status: "online" | "away" | "offline";
  message?: string;
  avatar: string;
};

export type MessengerMessage = {
  id: string;
  sender: "me" | "contact";
  body: string;
  createdAt: Date;
};
