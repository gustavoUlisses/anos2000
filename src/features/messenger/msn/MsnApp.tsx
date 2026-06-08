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

type OpenChat = {
  attention: boolean;
  contact: MsnContact;
  minimized: boolean;
};

const msnMainTaskbarId = "msn-main";
const msnChatTaskbarPrefix = "msn-chat:";

export function MsnApp({ onClose, onTaskbarItemsChange }: MsnAppProps) {
  const messenger = useMsnRealtime();
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [showLoginWindow, setShowLoginWindow] = useState(true);
  const [isLoginMinimized, setIsLoginMinimized] = useState(false);
  const handledIncomingMessageIds = useRef<Set<string>>(new Set());
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  function closeLoginWindow() {
    setShowLoginWindow(false);

    if (!openChats.length) {
      onClose();
    }
  }

  function closeChatWindow(contactId: string) {
    setOpenChats((current) => current.filter((chat) => chat.contact.id !== contactId));

    if (!showLoginWindow && openChats.length <= 1) {
      onClose();
    }
  }

  async function openChat(contact: MsnContact) {
    setOpenChats((current) => {
      const existingChat = current.find((chat) => chat.contact.id === contact.id);

      if (existingChat) {
        return current.map((chat) => (
          chat.contact.id === contact.id
            ? { ...chat, attention: false, contact, minimized: false }
            : chat
        ));
      }

      return [...current, { attention: false, contact, minimized: false }];
    });
    await messenger.loadConversation(contact.id);
  }

  function minimizeChat(contactId: string) {
    setOpenChats((current) => current.map((chat) => (
      chat.contact.id === contactId
        ? { ...chat, attention: false, minimized: true }
        : chat
    )));
  }

  function restoreChat(contactId: string) {
    setOpenChats((current) => current.map((chat) => (
      chat.contact.id === contactId
        ? { ...chat, attention: false, minimized: false }
        : chat
    )));
  }

  function logout() {
    setOpenChats([]);
    setIsLoginMinimized(false);
    setShowLoginWindow(true);
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

    const incomingMessages = messenger.messages.filter((message) => (
      message.senderId !== messenger.profile?.id &&
      message.recipientId === messenger.profile?.id &&
      new Date(message.createdAt).getTime() >= mountedAt.current &&
      !handledIncomingMessageIds.current.has(message.id)
    ));

    if (!incomingMessages.length) {
      return;
    }

    incomingMessages.forEach((message) => handledIncomingMessageIds.current.add(message.id));
    playIncomingMessageAlert();

    setOpenChats((current) => {
      const nextChats = [...current];

      for (const message of incomingMessages) {
        const incomingContact = contactFromIncomingMessage(message);
        const existingIndex = nextChats.findIndex((chat) => chat.contact.id === incomingContact.id);

        if (existingIndex >= 0) {
          const existingChat = nextChats[existingIndex];
          const isVisible = !existingChat.minimized;
          nextChats[existingIndex] = {
            ...existingChat,
            attention: isVisible ? existingChat.attention : true,
            contact: incomingContact,
            minimized: isVisible ? existingChat.minimized : true,
          };
          continue;
        }

        nextChats.push({
          attention: true,
          contact: incomingContact,
          minimized: true,
        });
      }

      return nextChats;
    });
  }, [contactFromIncomingMessage, messenger.messages, messenger.profile]);

  useEffect(() => {
    const items: MessengerTaskbarItem[] = [];

    if (isLoginMinimized) {
      items.push({
        icon: "/msn/images/msn.webp",
        id: msnMainTaskbarId,
        title: "Windows Live Messenger",
      });
    }

    for (const chat of openChats) {
      if (!chat.minimized) {
        continue;
      }

      items.push({
        attention: chat.attention,
        icon: "/msn/images/msn.webp",
        id: `${msnChatTaskbarPrefix}${chat.contact.id}`,
        title: chat.contact.nick,
      });
    }

    onTaskbarItemsChange(items);
  }, [isLoginMinimized, onTaskbarItemsChange, openChats]);

  useEffect(() => {
    function restoreFromTaskbar(event: Event) {
      const itemId = (event as CustomEvent<{ id?: string }>).detail?.id;

      if (itemId === msnMainTaskbarId) {
        setIsLoginMinimized(false);
      }

      if (itemId?.startsWith(msnChatTaskbarPrefix)) {
        restoreChat(itemId.slice(msnChatTaskbarPrefix.length));
      }
    }

    window.addEventListener("anos2000:msn-taskbar-click", restoreFromTaskbar);

    return () => {
      window.removeEventListener("anos2000:msn-taskbar-click", restoreFromTaskbar);
      onTaskbarItemsChange([]);
    };
  }, [onTaskbarItemsChange]);

  const currentProfile = messenger.profile;

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

      {currentProfile && openChats.some((chat) => !chat.minimized) ? (
        openChats.filter((chat) => !chat.minimized).map((chat) => (
          <div className="msn-window-slot" key={chat.contact.id}>
            <ChatWindow
              contact={chat.contact}
              currentProfile={currentProfile}
              messages={messenger.getConversation(chat.contact.id)}
              onClose={() => closeChatWindow(chat.contact.id)}
              onMinimize={() => minimizeChat(chat.contact.id)}
              onSendMessage={(parts) => messenger.sendMessage(chat.contact, parts)}
            />
          </div>
        ))
      ) : (
        <div style={{ width: "500px", height: "550px" }} />
      )}

    </div>
  );
}
