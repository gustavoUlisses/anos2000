"use client";

import { useState } from "react";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import { MainWindow } from "./components/MainWindow/MainWindow";
import { useMsnRealtime } from "./useMsnRealtime";
import type { MsnContact } from "./types";

type MsnAppProps = {
  onClose: () => void;
};

export function MsnApp({ onClose }: MsnAppProps) {
  const messenger = useMsnRealtime();
  const [activeContact, setActiveContact] = useState<MsnContact | null>(null);
  const [showLoginWindow, setShowLoginWindow] = useState(true);
  const [isLoginMinimized, setIsLoginMinimized] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  function closeLoginWindow() {
    setShowLoginWindow(false);

    if (!activeContact) {
      onClose();
    }
  }

  function closeChatWindow() {
    setActiveContact(null);

    if (!showLoginWindow) {
      onClose();
    }
  }

  async function openChat(contact: MsnContact) {
    setActiveContact(contact);
    setIsChatMinimized(false);
    await messenger.loadConversation(contact.id);
  }

  return (
    <div className="msn-app">
      {showLoginWindow && !isLoginMinimized ? (
        <div className="msn-window-slot">
          <MainWindow
            contacts={messenger.contacts}
            isRealtimeConfigured={messenger.isRealtimeConfigured}
            onClose={closeLoginWindow}
            onLogin={messenger.login}
            onMinimize={() => setIsLoginMinimized(true)}
            onOpenChat={openChat}
            profile={messenger.profile}
          />
        </div>
      ) : (
        <div style={{ width: "300px", height: "550px" }} />
      )}

      {activeContact && !isChatMinimized && messenger.profile ? (
        <div className="msn-window-slot">
          <ChatWindow
            contact={activeContact}
            currentProfile={messenger.profile}
            messages={messenger.getConversation(activeContact.id)}
            onClose={closeChatWindow}
            onMinimize={() => setIsChatMinimized(true)}
            onSendMessage={(parts) => messenger.sendMessage(activeContact, parts)}
          />
        </div>
      ) : (
        <div style={{ width: "500px", height: "550px" }} />
      )}

      {(isLoginMinimized || isChatMinimized) && (
        <div className="msn-minimized">
          {isLoginMinimized && (
            <button type="button" onClick={() => setIsLoginMinimized(false)}>
              Windows Live Messenger
            </button>
          )}
          {isChatMinimized && (
            <button type="button" onClick={() => setIsChatMinimized(false)}>
              {activeContact?.nick ?? "Conversa"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
