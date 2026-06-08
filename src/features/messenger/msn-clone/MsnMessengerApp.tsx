"use client";

import { useMemo, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { DraggableWindow } from "./DraggableWindow";
import { MainWindowLoading } from "./MainWindowLoading";
import { MainWindowLogged } from "./MainWindowLogged";
import { MainWindowNotLogged } from "./MainWindowNotLogged";
import { WindowToolbar } from "./WindowToolbar";
import type { MessengerContact, MessengerMessage } from "./types";

const contacts: MessengerContact[] = [
  {
    id: "gusdev",
    nick: "GusDev",
    status: "online",
    message: "Criador do projeto",
    avatar: "/images/user.png",
  },
  {
    id: "anos2000",
    nick: "Anos2000 Bot",
    status: "away",
    message: "Em breve: usuarios reais online",
    avatar: "/images/msn.webp",
  },
  {
    id: "visitante-off",
    nick: "Visitante offline",
    status: "offline",
    message: "Saiu para tomar um cafe",
    avatar: "/images/user.png",
  },
];

type MsnMessengerAppProps = {
  onClose: () => void;
};

export function MsnMessengerApp({ onClose }: MsnMessengerAppProps) {
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nick, setNick] = useState("");
  const [status, setStatus] = useState("online");
  const [messagesByContact, setMessagesByContact] = useState<Record<string, MessengerMessage[]>>({});

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === activeContactId) ?? null,
    [activeContactId],
  );

  const displayNick = nick.trim() || "Visitante";

  function login(email: string) {
    const normalizedEmail = email.trim();
    const emailNick = normalizedEmail.includes("@")
      ? normalizedEmail.split("@")[0]
      : normalizedEmail;

    setNick(emailNick);
    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
    }, 1100);
  }

  function openChat(contact: MessengerContact) {
    setActiveContactId(contact.id);
    setMessagesByContact((current) => {
      if (current[contact.id]) {
        return current;
      }

      return {
        ...current,
        [contact.id]: [
          {
            id: `${contact.id}-welcome`,
            sender: "contact",
            body:
              contact.id === "gusdev"
                ? "Opa! Me manda uma mensagem por aqui. Em breve isso vai chegar no dashboard admin em tempo real."
                : "Esse contato e temporario ate conectarmos o Supabase Realtime.",
            createdAt: new Date(),
          },
        ],
      };
    });
  }

  function sendMessage(contact: MessengerContact, body: string) {
    setMessagesByContact((current) => ({
      ...current,
      [contact.id]: [
        ...(current[contact.id] ?? []),
        {
          id: `${contact.id}-${Date.now()}`,
          sender: "me",
          body,
          createdAt: new Date(),
        },
      ],
    }));
  }

  return (
    <div className="msn-clone">
      <DraggableWindow initialX={24} initialY={24}>
        <div className={`login-window p-2 position-relative ${isLoading ? "isLoading" : ""}`}>
          <WindowToolbar onClose={onClose} />

          {isLoading && <MainWindowLoading onCancel={() => setIsLoading(false)} />}

          {!isLoggedIn && !isLoading && (
            <MainWindowNotLogged
              onLogin={login}
              setStatus={setStatus}
              status={status}
            />
          )}

          {isLoggedIn && !isLoading && (
            <MainWindowLogged
              activeContactId={activeContactId}
              contacts={contacts}
              nick={displayNick}
              onOpenChat={openChat}
            />
          )}
        </div>
      </DraggableWindow>

      {activeContact && (
        <DraggableWindow initialX={368} initialY={24}>
          <ChatWindow
            contact={activeContact}
            messages={messagesByContact[activeContact.id] ?? []}
            nick={displayNick}
            onClose={() => setActiveContactId(null)}
            onSendMessage={(body) => sendMessage(activeContact, body)}
          />
        </DraggableWindow>
      )}
    </div>
  );
}
