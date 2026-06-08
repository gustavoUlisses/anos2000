"use client";

import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { LoginWindowToolbar } from "./LoginWindowToolbar";
import { MainWindowLoading } from "./MainWindowLoading";
import { MainWindowLogged } from "./MainWindowLogged";
import { MainWindowNotLogged } from "./MainWindowNotLogged";
import type { MsnContact, MsnProfile } from "../../types";

type MainWindowProps = {
  contacts: MsnContact[];
  isRealtimeConfigured: boolean;
  onClose: () => void;
  onLogin: (nick: string, password?: string) => Promise<void>;
  onLogout: () => void;
  onMinimize: () => void;
  onOpenChat: (contact: MsnContact) => void;
  profile: MsnProfile | null;
};

export function MainWindow({
  contacts,
  isRealtimeConfigured,
  onClose,
  onLogin,
  onLogout,
  onMinimize,
  onOpenChat,
  profile,
}: MainWindowProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function login(nick: string, password?: string) {
    setIsLoading(true);
    try {
      await onLogin(nick, password);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className={`login-window p-2 position-relative ${isLoading ? "isLoading" : ""}`}>
        <LoginWindowToolbar onClose={onClose} onMinimize={onMinimize} />

        {isLoading && <MainWindowLoading handleClick={() => setIsLoading(false)} />}

        {!profile && !isLoading && (
          <MainWindowNotLogged handleLogin={login} />
        )}

        {profile && !isLoading && (
          <MainWindowLogged
            contacts={contacts}
            isRealtimeConfigured={isRealtimeConfigured}
            onLogout={onLogout}
            onOpenChat={onOpenChat}
            profile={profile}
          />
        )}
      </div>
    </Draggable>
  );
}
