"use client";

import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { LoginWindowToolbar } from "./LoginWindowToolbar";
import { MainWindowLoading } from "./MainWindowLoading";
import { MainWindowLogged } from "./MainWindowLogged";
import { MainWindowNotLogged } from "./MainWindowNotLogged";
import type { MsnBlockedContact, MsnContact, MsnProfile } from "../../types";

type MainWindowProps = {
  blockedContacts: MsnBlockedContact[];
  contacts: MsnContact[];
  isRealtimeConfigured: boolean;
  onClose: () => void;
  onLogin: (nick: string, password?: string, avatar?: string) => Promise<void>;
  onLogout: () => void;
  onMinimize: () => void;
  onOpenChat: (contact: MsnContact) => void;
  onAvatarChange: (avatar: string) => void;
  onPersonalMessageChange: (message: string) => void;
  onUnblockContact: (contactId: string) => void;
  profile: MsnProfile | null;
};

export function MainWindow({
  blockedContacts,
  contacts,
  isRealtimeConfigured,
  onClose,
  onLogin,
  onLogout,
  onMinimize,
  onOpenChat,
  onAvatarChange,
  onPersonalMessageChange,
  onUnblockContact,
  profile,
}: MainWindowProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function login(nick: string, password?: string, avatar?: string) {
    setIsLoading(true);
    try {
      await onLogin(nick, password, avatar);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className={`login-window p-2 position-relative ${isLoading ? "isLoading" : ""} ${profile && !isLoading ? "is-logged-in" : ""}`}>
        <LoginWindowToolbar onClose={onClose} onMinimize={onMinimize} />

        {isLoading && <MainWindowLoading handleClick={() => setIsLoading(false)} />}

        {!profile && !isLoading && (
          <MainWindowNotLogged handleLogin={login} />
        )}

        {profile && !isLoading && (
          <MainWindowLogged
            blockedContacts={blockedContacts}
            contacts={contacts}
            isRealtimeConfigured={isRealtimeConfigured}
            onAvatarChange={onAvatarChange}
            onLogout={onLogout}
            onOpenChat={onOpenChat}
            onPersonalMessageChange={onPersonalMessageChange}
            onUnblockContact={onUnblockContact}
            profile={profile}
          />
        )}
      </div>
    </Draggable>
  );
}
