"use client";

import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { LoginWindowToolbar } from "./LoginWindowToolbar";
import { MainWindowLoading } from "./MainWindowLoading";
import { MainWindowLogged } from "./MainWindowLogged";
import { MainWindowNotLogged } from "./MainWindowNotLogged";

type MainWindowProps = {
  onClose: () => void;
  onMinimize: () => void;
  toggleChatWindow: () => void;
};

export function MainWindow({ onClose, onMinimize, toggleChatWindow }: MainWindowProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleClick(value: boolean) {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    setIsLoggedIn(value);
  }

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className={`login-window p-2 position-relative ${isLoading ? "isLoading" : ""}`}>
        <LoginWindowToolbar onClose={onClose} onMinimize={onMinimize} />

        {isLoading && <MainWindowLoading handleClick={() => handleClick(false)} />}

        {!isLoggedIn && !isLoading && (
          <MainWindowNotLogged handleClick={() => handleClick(true)} />
        )}

        {isLoggedIn && !isLoading && (
          <MainWindowLogged toggleChatWindow={toggleChatWindow} />
        )}
      </div>
    </Draggable>
  );
}
