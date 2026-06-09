"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useUolChat } from "./useUolChat";
import styles from "./UolChatApp.module.scss";
import type { UolMessage } from "./types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function getMessageClassName(message: UolMessage, selfId?: string) {
  if (message.senderId === selfId) {
    return styles.selfMessage;
  }

  return "";
}

export function UolChatApp() {
  const {
    hasPresenceSynced,
    isRealtimeConfigured,
    login,
    logout,
    messages,
    onlineUsers,
    profile,
    sendMessage,
  } = useUolChat();
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState("");
  const [loginNick, setLoginNick] = useState("");
  const [message, setMessage] = useState("");
  const [privateMode, setPrivateMode] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const sortedMessages = useMemo(() => (
    [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-160)
  ), [messages]);

  useEffect(() => {
    if (!autoScroll || !messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [autoScroll, sortedMessages]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await login(loginNick);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Nao foi possivel entrar na sala.");
    }
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = await sendMessage(privateMode ? `(reservadamente) ${message}` : message);

    if (sent) {
      setMessage("");
    }
  }

  if (!profile) {
    return (
      <div className={styles.shell}>
        <section className={styles.loginHeader}>
          <div className={styles.logo}>BATE-PAPO UOL</div>
          <div className={styles.loginAd}>entre agora gratis</div>
        </section>
        <form className={styles.loginPanel} onSubmit={submitLogin}>
          <h2>Salas de bate-papo</h2>
          <p>Escolha um apelido para entrar na sala Anos 2000.</p>
          <label>
            Apelido
            <input value={loginNick} maxLength={24} onChange={(event) => setLoginNick(event.target.value)} autoFocus />
          </label>
          <label>
            Sala
            <select defaultValue="anos2000">
              <option value="anos2000">Por nostalgia - Anos 2000</option>
            </select>
          </label>
          {error && <strong className={styles.error}>{error}</strong>}
          <button type="submit">Entrar na sala</button>
          <small>{isRealtimeConfigured ? "bate-papo em tempo real" : "modo local sem Supabase"}</small>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.topBar}>
        <div className={styles.logo}>BATE-PAPO UOL</div>
        <div className={styles.roomInfo}>
          <strong>Por Nostalgia</strong>
          <span>anos 2000 ({onlineUsers.length})</span>
        </div>
        <select defaultValue="radio">
          <option value="radio">Sintonize a Radio UOL</option>
          <option value="pop">UOL Pop</option>
          <option value="rock">UOL Rock</option>
        </select>
        <label>
          <input type="checkbox" checked={autoScroll} onChange={(event) => setAutoScroll(event.target.checked)} />
          rolagem automatica
        </label>
        <button type="button" onClick={() => void logout()}>sair</button>
      </section>

      <section className={styles.adBar}>
        <div>SHOPPING <strong>UOL</strong></div>
        <span>os melhores anuncios da internet antiga</span>
      </section>

      <section className={styles.content}>
        <div className={styles.messages} ref={messageListRef}>
          <p className={styles.systemLine}>
            *** Voce entrou na sala Anos 2000. Respeite os visitantes e aproveite a nostalgia. ***
          </p>
          {!hasPresenceSynced && isRealtimeConfigured && (
            <p className={styles.systemLine}>*** sincronizando participantes... ***</p>
          )}
          {sortedMessages.map((chatMessage) => (
            <p key={chatMessage.id} className={getMessageClassName(chatMessage, profile.id)}>
              <span>({formatTime(chatMessage.createdAt)})</span>{" "}
              <strong>{chatMessage.senderNick}</strong>{" "}
              <em>fala para todos:</em>{" "}
              {chatMessage.body}
            </p>
          ))}
        </div>
        <aside className={styles.userList}>
          <header>na sala</header>
          {onlineUsers.map((user) => (
            <button key={user.id} type="button" data-self={user.id === profile.id}>
              <span></span>
              {user.nick}
            </button>
          ))}
        </aside>
      </section>

      <form className={styles.composer} onSubmit={submitMessage}>
        <label>
          <input type="checkbox" checked={privateMode} onChange={(event) => setPrivateMode(event.target.checked)} />
          reservadamente
        </label>
        <span>apelido</span>
        <input className={styles.nickField} value={profile.nick} readOnly />
        <span>fala para</span>
        <select defaultValue="todos">
          <option value="todos">todos</option>
        </select>
        <input className={styles.messageField} value={message} maxLength={500} onChange={(event) => setMessage(event.target.value)} />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}
