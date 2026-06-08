"use client";

import { useState } from "react";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import { MainWindow } from "./components/MainWindow/MainWindow";

type MsnAppProps = {
  onClose: () => void;
};

export function MsnApp({ onClose }: MsnAppProps) {
  const [showLoginWindow, setShowLoginWindow] = useState(true);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [isLoginMinimized, setIsLoginMinimized] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  function closeLoginWindow() {
    setShowLoginWindow(false);

    if (!showChatWindow) {
      onClose();
    }
  }

  function closeChatWindow() {
    setShowChatWindow(false);

    if (!showLoginWindow) {
      onClose();
    }
  }

  return (
    <div className="msn-app">
      {showLoginWindow && !isLoginMinimized ? (
        <div className="msn-window-slot">
          <MainWindow
            onClose={closeLoginWindow}
            onMinimize={() => setIsLoginMinimized(true)}
            toggleChatWindow={() => {
              setIsChatMinimized(false);
              setShowChatWindow(true);
            }}
          />
        </div>
      ) : (
        <div style={{ width: "300px", height: "550px" }} />
      )}

      {showChatWindow && !isChatMinimized ? (
        <div className="msn-window-slot">
          <ChatWindow
            onClose={closeChatWindow}
            onMinimize={() => setIsChatMinimized(true)}
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
              Gemini
            </button>
          )}
        </div>
      )}
    </div>
  );
}
