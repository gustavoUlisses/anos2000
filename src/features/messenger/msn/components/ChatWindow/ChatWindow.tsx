"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import type { MsnChatPart, MsnContact, MsnMessage, MsnProfile } from "../../types";

type ChatWindowProps = {
  contact: MsnContact;
  currentProfile: MsnProfile;
  isContactOnline: boolean;
  messages: MsnMessage[];
  nudgeSignal: number;
  onBlockContact: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onNudgePlayed: () => void;
  onSendNudge: () => boolean;
  onSendMessage: (parts: MsnChatPart[]) => void;
};

export function ChatWindow({
  contact,
  currentProfile,
  isContactOnline,
  messages,
  nudgeSignal,
  onBlockContact,
  onClose,
  onMinimize,
  onNudgePlayed,
  onSendNudge,
  onSendMessage,
}: ChatWindowProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastLocalNudgeAt = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const contactStatusIcon = contact.status === "offline"
    ? "/msn/images/user/user-invisible.png"
    : "/msn/images/user/user-online.png";

  function setChatWindowNode(node: HTMLDivElement | null) {
    nodeRef.current = node;
    chatWindowRef.current = node;
  }

  const emojiList = Array.from({ length: 32 }, (_, index) => (
    <li key={index} role="button" onClick={() => insertEmoji(index + 1)}>
      <img src={`/msn/images/emojis/${index + 1}.png`} alt="emoji" />
    </li>
  ));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playTiltSound = useCallback(() => {
    const audio = new Audio("/msn/sounds/tilt.mp3");
    const chatWindow = chatWindowRef.current;

    if (chatWindow) {
      chatWindow.classList.remove("shake");
      void chatWindow.offsetWidth;
      chatWindow.classList.add("shake");
    }

    void audio.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!nudgeSignal) {
      return;
    }

    playTiltSound();
    onNudgePlayed();
  }, [nudgeSignal, onNudgePlayed, playTiltSound]);

  function sendNudge() {
    if (!isContactOnline) {
      return;
    }

    const now = Date.now();

    if (now - lastLocalNudgeAt.current < 5_000) {
      return;
    }

    if (!onSendNudge()) {
      return;
    }

    lastLocalNudgeAt.current = now;
    playTiltSound();
  }

  function clearEditor() {
    const editor = editorRef.current;

    if (editor) {
      editor.textContent = "";
    }
  }

  function readEditorParts() {
    const editor = editorRef.current;
    const parts: MsnChatPart[] = [];

    function collect(node: ChildNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent) {
          parts.push({ text: node.textContent, type: "text" });
        }
        return;
      }

      if (!(node instanceof HTMLElement)) {
        return;
      }

      if (node instanceof HTMLImageElement && node.dataset.msnEmoji) {
        parts.push({
          alt: node.alt || "emoji",
          src: node.getAttribute("src") || node.src,
          type: "emoji",
        });
        return;
      }

      if (node.tagName === "BR") {
        parts.push({ text: "\n", type: "text" });
        return;
      }

      node.childNodes.forEach(collect);
    }

    editor?.childNodes.forEach(collect);

    return parts;
  }

  function renderMessageParts(parts: MsnChatPart[]) {
    return parts.map((part, index) => {
      if (part.type === "text") {
        return <span key={index}>{part.text}</span>;
      }

      return (
        <img
          alt={part.alt}
          className="message-emoji"
          key={index}
          src={part.src}
        />
      );
    });
  }

  function sendMessage() {
    if (!isContactOnline) {
      return;
    }

    const parts = readEditorParts();
    const hasContent = parts.some((part) => part.type === "emoji" || part.text.trim());

    if (!hasContent) {
      return;
    }

    clearEditor();
    onSendMessage(parts);
  }

  function insertEmoji(emojiNumber: number) {
    if (!isContactOnline) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const emojiImage = document.createElement("img");
    emojiImage.alt = "emoji";
    emojiImage.className = "composer-emoji";
    emojiImage.dataset.msnEmoji = String(emojiNumber);
    emojiImage.src = `/msn/images/emojis/${emojiNumber}.png`;

    editor.focus();

    const selection = window.getSelection();
    const selectedRange = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const isSelectionInsideEditor = selectedRange ? editor.contains(selectedRange.commonAncestorContainer) : false;
    const insertionRange = isSelectionInsideEditor && selectedRange ? selectedRange : document.createRange();

    if (!isSelectionInsideEditor) {
      insertionRange.selectNodeContents(editor);
      insertionRange.collapse(false);
    }

    insertionRange.deleteContents();
    insertionRange.insertNode(emojiImage);
    insertionRange.setStartAfter(emojiImage);
    insertionRange.collapse(true);

    selection?.removeAllRanges();
    selection?.addRange(insertionRange);
    setIsEmojiOpen(false);
  }

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={setChatWindowNode} className="chat-window position-relative" id="chatWindow">
        <div className="d-flex justify-content-between align-items-center handle px-2">
          <div className="d-flex align-items-center">
            <img src={contactStatusIcon} alt="User status icon" width="35" className="p-1" />
            <div className="d-grid">
              <span className="ps-1 fw-bold lh-1">{contact.nick}</span>
              <span className="ps-1 lh-1">{contact.message}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <svg role="button" onClick={onMinimize} xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="#787878" className="bi bi-dash-lg" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="#787878" className="bi bi-window-fullscreen" viewBox="0 0 16 16">
              <path d="M3 3.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m1.5 0a.5.5 0 1 1-1 0m1 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1" />
              <path d="M.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5zM1 5V2h14v3zm0 1h14v8H1z" />
            </svg>
            <svg role="button" onClick={onClose} xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="#787878" className="close-btn bi bi-x-lg" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
            </svg>
          </div>
        </div>
        <div className="d-flex gap-3 p-2 border-1 border-top">
          <img role="button" src="/msn/images/user/user-invite.png" alt="Icon" width="20" />
          <img role="button" src="/msn/images/msn-icons/folder.png" alt="Icon" width="20" />
          <img role="button" src="/msn/images/msn-icons/music.png" alt="Icon" width="20" />
          <img role="button" src="/msn/images/msn-icons/phone.png" alt="Icon" width="20" />
          <img role="button" src="/msn/images/msn-icons/games.png" alt="Icon" width="20" />
          <img
            role="button"
            src="/msn/images/user/user-blocked.png"
            alt="Block contact"
            title="Bloquear contato"
            width="20"
            onClick={onBlockContact}
          />
        </div>
        <div className="row g-0 mx-2 messages-block-row">
          <div className="col col-md-9">
            <div className="me-2 messages-block white-box d-flex flex-column pt-1 overflow-auto">
              {messages.map((chat) => {
                if (chat.kind === "system") {
                  return (
                    <div key={chat.id} className="system-message px-2 py-1">
                      {renderMessageParts(chat.parts)}
                    </div>
                  );
                }

                const isMine = chat.senderId === currentProfile.id;

                return (
                  <div key={chat.id} className="mb-2 px-2">
                    <p className="m-0 fw-bold message-user">{isMine ? `${currentProfile.nick} says: ` : `${chat.senderNick} says: `}</p>
                    <div className={`m-0 message ${isMine ? "user" : "bot"}`}>
                      <p className="mb-0">{renderMessageParts(chat.parts)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="d-flex justify-content-center mb-0 mb-lg-2 separator">
              <span className="fw-bolder">. . . . . . . . </span>
            </div>
            <div className="white-box me-2">
              <div className="d-flex gap-2 chat-box-toolbar">
                <div className="px-2 my-1 border-end">
                  <div className="btn-group dropup">
                    <button type="button" className="dropdown-toggle" onClick={() => setIsEmojiOpen((current) => !current)}>
                      <img src="/msn/images/msn-icons/emoticon.png" alt="Emoji" />
                    </button>
                    <ul className={`dropdown-menu emojis-grid ${isEmojiOpen ? "show" : ""}`}>
                      {emojiList}
                    </ul>
                  </div>
                  <img className="ps-2" src="/msn/images/tilt.png" alt="Tilt icon" role="button" onClick={sendNudge} />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <img src="/msn/images/bg.png" alt="icons" role="button" width="18" />
                  <img src="/msn/images/msn-icons/text.png" alt="icons" role="button" width="18" />
                  <img src="/msn/images/msn-icons/voice.png" alt="icons" role="button" width="18" />
                </div>
              </div>
              <div className="px-2 d-flex chat-box">
                <div
                  aria-label="Message"
                  className="w-100 my-1 message-editor"
                  contentEditable={isContactOnline}
                  data-disabled={!isContactOnline}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  ref={editorRef}
                  role="textbox"
                  suppressContentEditableWarning
                />
                <div className="d-grid gap-1 ps-1 py-1 chat-buttons">
                  <button disabled={!isContactOnline} onClick={sendMessage} type="button" className="send-button" />
                  <button type="button" className="search-button">Search</button>
                </div>
              </div>
              <div className="chat-box-toolbar">
                <p className="is-writing-label m-0">{isContactOnline ? "\u200e " : "O usuario esta offline."}</p>
              </div>
            </div>
          </div>
          <div className="col-auto d-flex flex-column justify-content-between">
            <div className="p-lg-2 p-1">
              <div className="msn-avatar-frame msn-avatar-frame-chat">
                <img src={contact.avatar} alt="User profile" className="user-profile-pic" />
              </div>
            </div>
            <div className="p-lg-2 p-1">
              <div className="msn-avatar-frame msn-avatar-frame-chat">
                <img src="/msn/images/user.png" alt="User profile" className="user-profile-pic" />
              </div>
            </div>
          </div>
        </div>
        <div className="chat-window-footer">
          <img src="/msn/favicon.ico" alt="Windows Live Messenger icon" width="25" className="p-1" />
          <span className="ps-1">Windows Live Messenger</span>
        </div>
      </div>
    </Draggable>
  );
}
