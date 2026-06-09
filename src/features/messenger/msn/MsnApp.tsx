"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import { MainWindow } from "./components/MainWindow/MainWindow";
import { useMsnRealtime } from "./useMsnRealtime";
import type { MessengerTaskbarItem } from "@/features/desktop/react-xp/context/types";
import type { MsnContact, MsnMessage, MsnNudgeEvent } from "./types";

type MsnAppProps = {
  onClose: () => void;
  onTaskbarItemsChange: (items: MessengerTaskbarItem[]) => void;
};

type OpenChat = {
  attention: boolean;
  contact: MsnContact;
  minimized: boolean;
  nudgeSignal: number;
};

type OnlineNotification = {
  contact: MsnContact;
  id: string;
};

const msnMainTaskbarId = "msn-main";
const msnChatTaskbarPrefix = "msn-chat:";
const onlineNotificationDurationMs = 8_500;
const maxOnlineNotifications = 5;

export function MsnApp({ onClose, onTaskbarItemsChange }: MsnAppProps) {
  const messenger = useMsnRealtime();
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [onlineNotifications, setOnlineNotifications] = useState<OnlineNotification[]>([]);
  const [showLoginWindow, setShowLoginWindow] = useState(true);
  const [isLoginMinimized, setIsLoginMinimized] = useState(false);
  const handledIncomingMessageIds = useRef<Set<string>>(new Set());
  const handledIncomingNudgeIds = useRef<Set<string>>(new Set());
  const handledOnlineLoginIds = useRef<Set<string>>(new Set());
  const onlineNotificationTimers = useRef<number[]>([]);
  const onlineSoundPlayedAt = useRef(0);
  const offlineNotifiedContactIds = useRef<Set<string>>(new Set());
  const mountedAt = useRef(0);
  const addSystemMessage = messenger.addSystemMessage;
  const contacts = messenger.contacts;
  const isRealtimeConfigured = messenger.isRealtimeConfigured;
  const onlineProfileIds = messenger.onlineProfileIds;
  const onlineProfileKey = onlineProfileIds.join("|");
  const profile = messenger.profile;

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

      return [...current, { attention: false, contact, minimized: false, nudgeSignal: 0 }];
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

  function clearChatNudgeSignal(contactId: string) {
    setOpenChats((current) => current.map((chat) => (
      chat.contact.id === contactId && chat.nudgeSignal !== 0
        ? { ...chat, nudgeSignal: 0 }
        : chat
    )));
  }

  function logout() {
    setOpenChats([]);
    setIsLoginMinimized(false);
    setOnlineNotifications([]);
    setShowLoginWindow(true);
    handledIncomingMessageIds.current.clear();
    handledIncomingNudgeIds.current.clear();
    handledOnlineLoginIds.current.clear();
    offlineNotifiedContactIds.current.clear();
    void messenger.logout();
  }

  function playIncomingMessageAlert() {
    const audio = new Audio("/msn/sounds/msn-chat-alert.mp3");
    void audio.play().catch(() => undefined);
  }

  function playUserOnlineAlert() {
    const now = Date.now();

    if (now - onlineSoundPlayedAt.current < 900) {
      return;
    }

    onlineSoundPlayedAt.current = now;
    const audio = new Audio("/msn/sounds/msn-user-online.mp3");
    void audio.play().catch(() => undefined);
  }

  function dismissOnlineNotification(notificationId: string) {
    setOnlineNotifications((current) => current.filter((notification) => notification.id !== notificationId));
  }

  function openChatFromNotification(notification: OnlineNotification) {
    dismissOnlineNotification(notification.id);
    void openChat(notification.contact);
  }

  const contactFromIncomingMessage = useCallback((message: MsnMessage): MsnContact => {
    const existingContact = contacts.find((contact) => contact.id === message.senderId);

    return existingContact ?? {
      avatar: "/msn/images/user.png",
      id: message.senderId,
      message: "",
      nick: message.senderNick,
      status: "online",
    };
  }, [contacts]);

  const contactFromNudge = useCallback((nudge: MsnNudgeEvent): MsnContact => {
    const existingContact = contacts.find((contact) => contact.id === nudge.senderId);

    return existingContact ?? {
      ...nudge.sender,
      status: "online",
    };
  }, [contacts]);

  useEffect(() => {
    if (!profile) {
      handledIncomingMessageIds.current.clear();
      return;
    }

    const incomingMessages = messenger.messages.filter((message) => (
      message.senderId !== profile.id &&
      message.recipientId === profile.id &&
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
          nudgeSignal: 0,
        });
      }

      return nextChats;
    });
  }, [contactFromIncomingMessage, messenger.messages, profile]);

  useEffect(() => {
    if (!profile) {
      handledIncomingNudgeIds.current.clear();
      return;
    }

    const incomingNudges = messenger.nudges.filter((nudge) => (
      nudge.senderId !== profile.id &&
      nudge.recipientId === profile.id &&
      new Date(nudge.createdAt).getTime() >= mountedAt.current &&
      !handledIncomingNudgeIds.current.has(nudge.id)
    ));

    if (!incomingNudges.length) {
      return;
    }

    incomingNudges.forEach((nudge) => handledIncomingNudgeIds.current.add(nudge.id));

    setOpenChats((current) => {
      const nextChats = [...current];

      for (const nudge of incomingNudges) {
        const incomingContact = contactFromNudge(nudge);
        const existingIndex = nextChats.findIndex((chat) => chat.contact.id === incomingContact.id);

        if (existingIndex >= 0) {
          const existingChat = nextChats[existingIndex];
          nextChats[existingIndex] = {
            ...existingChat,
            attention: false,
            contact: incomingContact,
            minimized: false,
            nudgeSignal: existingChat.nudgeSignal + 1,
          };
          continue;
        }

        nextChats.push({
          attention: false,
          contact: incomingContact,
          minimized: false,
          nudgeSignal: 1,
        });
      }

      return nextChats;
    });
  }, [contactFromNudge, messenger.nudges, profile]);

  useEffect(() => {
    if (!profile) {
      onlineNotificationTimers.current.forEach(window.clearTimeout);
      onlineNotificationTimers.current = [];
      handledOnlineLoginIds.current.clear();
      return;
    }

    const newOnlineLogins = messenger.onlineLogins.filter((login) => (
      login.contact.id !== profile.id &&
      new Date(login.createdAt).getTime() >= mountedAt.current &&
      !handledOnlineLoginIds.current.has(login.id)
    ));

    if (!newOnlineLogins.length) {
      return;
    }

    newOnlineLogins.forEach((login) => handledOnlineLoginIds.current.add(login.id));
    playUserOnlineAlert();

    const notifications = newOnlineLogins.map((login) => ({
      contact: login.contact,
      id: login.id,
    }));

    for (const notification of notifications) {
      const timer = window.setTimeout(() => {
        dismissOnlineNotification(notification.id);
      }, onlineNotificationDurationMs);

      onlineNotificationTimers.current.push(timer);
    }

    setOnlineNotifications((current) => [...current, ...notifications].slice(-maxOnlineNotifications));
  }, [messenger.onlineLogins, profile]);

  useEffect(() => (
    () => {
      onlineNotificationTimers.current.forEach(window.clearTimeout);
    }
  ), []);

  useEffect(() => {
    if (!profile || !isRealtimeConfigured) {
      return;
    }

    const onlineIds = new Set(onlineProfileIds);

    for (const chat of openChats) {
      const isOnline = onlineIds.has(chat.contact.id);

      if (isOnline) {
        offlineNotifiedContactIds.current.delete(chat.contact.id);
        continue;
      }

      if (chat.contact.status !== "offline" && !offlineNotifiedContactIds.current.has(chat.contact.id)) {
        offlineNotifiedContactIds.current.add(chat.contact.id);
        addSystemMessage(chat.contact, "O usuario saiu...");
      }
    }
  }, [
    addSystemMessage,
    isRealtimeConfigured,
    onlineProfileKey,
    openChats,
    onlineProfileIds,
    profile,
  ]);

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

  function isContactOnline(contactId: string) {
    return !isRealtimeConfigured || onlineProfileIds.includes(contactId);
  }

  function resolveChatContact(contact: MsnContact): MsnContact {
    if (!isRealtimeConfigured) {
      return contact;
    }

    const onlineContact = contacts.find((candidate) => candidate.id === contact.id);

    if (onlineProfileIds.includes(contact.id)) {
      return onlineContact ?? {
        ...contact,
        status: "online",
      };
    }

    return {
      ...contact,
      message: "",
      status: "offline",
    };
  }

  const currentProfile = profile;

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
        openChats.filter((chat) => !chat.minimized).map((chat) => {
          const resolvedContact = resolveChatContact(chat.contact);
          const contactOnline = isContactOnline(chat.contact.id);

          return (
            <div className="msn-window-slot" key={chat.contact.id}>
              <ChatWindow
                contact={resolvedContact}
                currentProfile={currentProfile}
                isContactOnline={contactOnline}
                messages={messenger.getConversation(chat.contact.id)}
                nudgeSignal={chat.nudgeSignal}
                onClose={() => closeChatWindow(chat.contact.id)}
                onMinimize={() => minimizeChat(chat.contact.id)}
                onNudgePlayed={() => clearChatNudgeSignal(chat.contact.id)}
                onSendNudge={() => {
                  if (!contactOnline) {
                    return false;
                  }

                  return messenger.sendNudge(resolvedContact);
                }}
                onSendMessage={(parts) => {
                  if (!contactOnline) {
                    return;
                  }

                  messenger.sendMessage(resolvedContact, parts);
                }}
              />
            </div>
          );
        })
      ) : (
        <div style={{ width: "500px", height: "550px" }} />
      )}

      {onlineNotifications.length ? (
        <div className="msn-online-notifications" aria-live="polite">
          {onlineNotifications.map((notification) => (
            <div
              className="msn-online-toast"
              key={notification.id}
              onClick={() => openChatFromNotification(notification)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openChatFromNotification(notification);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="msn-online-toast-header">
                <div className="msn-online-toast-title">
                  <img src="/msn/images/msn.webp" alt="" />
                  <span>Windows Live Messenger</span>
                </div>
                <button
                  aria-label="Fechar"
                  className="msn-online-toast-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissOnlineNotification(notification.id);
                  }}
                  type="button"
                >
                  X
                </button>
              </div>
              <div className="msn-online-toast-body">
                <div className="msn-avatar-frame msn-online-toast-avatar">
                  <img src={notification.contact.avatar} alt="" />
                </div>
                <div className="msn-online-toast-copy">
                  <strong>{notification.contact.nick}</strong>
                  <span>has just signed in.</span>
                </div>
              </div>
              <button
                className="msn-online-toast-options"
                onClick={(event) => event.stopPropagation()}
                type="button"
              >
                Options
              </button>
            </div>
          ))}
        </div>
      ) : null}

    </div>
  );
}
