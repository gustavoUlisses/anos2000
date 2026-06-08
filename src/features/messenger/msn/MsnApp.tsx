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
  const [hasChatAttention, setHasChatAttention] = useState(false);
  const handledIncomingMessageIds = useRef<Set<string>>(new Set());
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  function closeLoginWindow() {
    setShowLoginWindow(false);

    if (!activeContact) {
      onClose();
    }
  }

  function closeChatWindow() {
    setActiveContact(null);
    setHasChatAttention(false);

    if (!showLoginWindow) {
      onClose();
    }
  }

  async function openChat(contact: MsnContact) {
    setActiveContact(contact);
    setIsChatMinimized(false);
    setHasChatAttention(false);
    await messenger.loadConversation(contact.id);
  }

  function logout() {
    setActiveContact(null);
    setIsChatMinimized(false);
    setIsLoginMinimized(false);
    setShowLoginWindow(true);
    setHasChatAttention(false);
    handledIncomingMessageIds.current.clear();
    messenger.logout();
  }

  function playIncomingMessageAlert() {
    const audio = new Audio("/msn/sounds/msn-chat-alert.mp3");
    void audio.play().catch(() => undefined);
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
      new Date(message.createdAt).getTime() >= mountedAt.current &&
      !handledIncomingMessageIds.current.has(message.id)
    ));

    if (!incomingMessage) {
      return;
    }

    handledIncomingMessageIds.current.add(incomingMessage.id);
    playIncomingMessageAlert();

    const incomingContact = contactFromIncomingMessage(incomingMessage);
    const isCurrentVisibleChat = activeContact?.id === incomingContact.id && !isChatMinimized;

    setActiveContact(incomingContact);

    if (!isCurrentVisibleChat) {
      setIsChatMinimized(true);
      setHasChatAttention(true);
    }
  }, [activeContact, contactFromIncomingMessage, isChatMinimized, messenger.messages, messenger.profile]);

  useEffect(() => {
    const items: MessengerTaskbarItem[] = [];

    if (isLoginMinimized) {
      items.push({
        icon: "/msn/images/msn.webp",
        id: "msn-main",
        title: "Windows Live Messenger",
      });
    }

    if (isChatMinimized && activeContact) {
      items.push({
        attention: hasChatAttention,
        icon: "/msn/images/msn.webp",
        id: "msn-chat",
        title: activeContact.nick,
      });
    }

    onTaskbarItemsChange(items);
  }, [activeContact, hasChatAttention, isChatMinimized, isLoginMinimized, onTaskbarItemsChange]);

  useEffect(() => {
    function restoreFromTaskbar(event: Event) {
      const itemId = (event as CustomEvent<{ id?: string }>).detail?.id;

      if (itemId === "msn-main") {
        setIsLoginMinimized(false);
      }

      if (itemId === "msn-chat") {
        setIsChatMinimized(false);
        setHasChatAttention(false);
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
            onMinimize={() => {
              setHasChatAttention(false);
              setIsChatMinimized(true);
            }}
            onSendMessage={(parts) => messenger.sendMessage(activeContact, parts)}
          />
        </div>
      ) : (
        <div style={{ width: "500px", height: "550px" }} />
      )}

    </div>
  );
}
