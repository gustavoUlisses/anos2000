"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import { MainWindow } from "./components/MainWindow/MainWindow";
import { useMsnRealtime } from "./useMsnRealtime";
import type { MessengerTaskbarItem } from "@/features/desktop/react-xp/context/types";
import type { MsnContact, MsnMessage } from "./types";

type MsnAppProps = {
  onClose: () => void;
  onTaskbarItemsChange: (items: MessengerTaskbarItem[]) => void;
};

export function MsnApp({ onClose, onTaskbarItemsChange }: MsnAppProps) {
  const messenger = useMsnRealtime();
  const [activeContact, setActiveContact] = useState<MsnContact | null>(null);
  const [showLoginWindow, setShowLoginWindow] = useState(true);
  const [isLoginMinimized, setIsLoginMinimized] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const handledIncomingMessageIds = useRef<Set<string>>(new Set());

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

  function logout() {
    setActiveContact(null);
    setIsChatMinimized(false);
    setIsLoginMinimized(false);
    setShowLoginWindow(true);
    handledIncomingMessageIds.current.clear();
    messenger.logout();
  }

  const contactFromIncomingMessage = useCallback((message: MsnMessage): MsnContact => {
    const existingContact = messenger.contacts.find((contact) => contact.id === message.senderId);

    return existingContact ?? {
      avatar: "/msn/images/user.png",
      id: message.senderId,
      message: "",
      nick: message.senderNick,
      status: "online",
    };
  }, [messenger.contacts]);

  useEffect(() => {
    if (!messenger.profile) {
      handledIncomingMessageIds.current.clear();
      return;
    }

    const incomingMessage = messenger.messages.findLast((message) => (
      message.senderId !== messenger.profile?.id &&
      message.recipientId === messenger.profile?.id &&
      !handledIncomingMessageIds.current.has(message.id)
    ));

    if (!incomingMessage) {
      return;
    }

    handledIncomingMessageIds.current.add(incomingMessage.id);
    setActiveContact(contactFromIncomingMessage(incomingMessage));
    setIsChatMinimized(false);
  }, [contactFromIncomingMessage, messenger.messages, messenger.profile]);

  useEffect(() => {
    const items: MessengerTaskbarItem[] = [];

    if (isLoginMinimized) {
      items.push({
        icon: "/msn/favicon.ico",
        id: "msn-main",
        title: "Windows Live Messenger",
      });
    }

    if (isChatMinimized && activeContact) {
      items.push({
        icon: "/msn/favicon.ico",
        id: "msn-chat",
        title: activeContact.nick,
      });
    }

    onTaskbarItemsChange(items);
  }, [activeContact, isChatMinimized, isLoginMinimized, onTaskbarItemsChange]);

  useEffect(() => {
    function restoreFromTaskbar(event: Event) {
      const itemId = (event as CustomEvent<{ id?: string }>).detail?.id;

      if (itemId === "msn-main") {
        setIsLoginMinimized(false);
      }

      if (itemId === "msn-chat") {
        setIsChatMinimized(false);
      }
    }

    window.addEventListener("anos2000:msn-taskbar-click", restoreFromTaskbar);

    return () => {
      window.removeEventListener("anos2000:msn-taskbar-click", restoreFromTaskbar);
      onTaskbarItemsChange([]);
    };
  }, [onTaskbarItemsChange]);

  return (
    <div className="msn-app">
      {showLoginWindow && !isLoginMinimized ? (
        <div className="msn-window-slot">
          <MainWindow
            contacts={messenger.contacts}
            isRealtimeConfigured={messenger.isRealtimeConfigured}
            onClose={closeLoginWindow}
            onLogin={messenger.login}
            onLogout={logout}
            onMinimize={() => setIsLoginMinimized(true)}
            onOpenChat={openChat}
            onPersonalMessageChange={messenger.updatePersonalMessage}
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

    </div>
  );
}
