"use client";

import { useEffect, useMemo, useState } from "react";
import { siteConfig } from "@/config/site";
import { desktopAppMap, desktopApps } from "@/features/desktop/apps/registry";
import type { AppId, DesktopWindow } from "@/features/desktop/types";
import styles from "./WindowsXpExperience.module.css";

type BootState = "booting" | "welcome" | "login" | "desktop";

const desktopIconIds: AppId[] = [
  "my-computer",
  "messenger",
  "uol-chat",
  "internet-explorer",
  "winamp",
  "minesweeper",
  "pinball",
  "solitaire",
];

export function WindowsXpExperience() {
  const [bootState, setBootState] = useState<BootState>("booting");
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const bootTimer = window.setTimeout(() => setBootState("welcome"), 2200);
    const welcomeTimer = window.setTimeout(() => setBootState("login"), 3600);

    return () => {
      window.clearTimeout(bootTimer);
      window.clearTimeout(welcomeTimer);
    };
  }, []);

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      );
    };

    updateClock();
    const timer = window.setInterval(updateClock, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const visibleWindows = useMemo(
    () => windows.filter((windowItem) => !windowItem.minimized),
    [windows],
  );

  function login() {
    setBootState("desktop");
    const audio = new Audio("/xp/audio/startup.wav");
    audio.volume = 0.25;
    void audio.play().catch(() => undefined);
  }

  function openApp(appId: AppId) {
    const app = desktopAppMap.get(appId);

    if (!app) {
      return;
    }

    const zIndex = nextZIndex + 1;
    setNextZIndex(zIndex);
    setStartOpen(false);
    setWindows((current) => {
      const existing = current.find((windowItem) => windowItem.appId === appId);

      if (existing) {
        return current.map((windowItem) =>
          windowItem.instanceId === existing.instanceId
            ? { ...windowItem, minimized: false, zIndex }
            : windowItem,
        );
      }

      return [
        ...current,
        {
          instanceId: `${app.id}-${Date.now()}`,
          appId: app.id,
          title: app.title,
          icon: app.icon,
          x: app.defaultPosition.x,
          y: app.defaultPosition.y,
          width: app.defaultSize.width,
          height: app.defaultSize.height,
          zIndex,
          minimized: false,
          maximized: false,
        },
      ];
    });
  }

  function focusWindow(instanceId: string) {
    const zIndex = nextZIndex + 1;
    setNextZIndex(zIndex);
    setWindows((current) =>
      current.map((windowItem) =>
        windowItem.instanceId === instanceId ? { ...windowItem, zIndex } : windowItem,
      ),
    );
  }

  function closeWindow(instanceId: string) {
    setWindows((current) =>
      current.filter((windowItem) => windowItem.instanceId !== instanceId),
    );
  }

  function minimizeWindow(instanceId: string) {
    setWindows((current) =>
      current.map((windowItem) =>
        windowItem.instanceId === instanceId
          ? { ...windowItem, minimized: true }
          : windowItem,
      ),
    );
  }

  function toggleMaximize(instanceId: string) {
    focusWindow(instanceId);
    setWindows((current) =>
      current.map((windowItem) =>
        windowItem.instanceId === instanceId
          ? { ...windowItem, maximized: !windowItem.maximized }
          : windowItem,
      ),
    );
  }

  function moveWindow(instanceId: string, x: number, y: number) {
    setWindows((current) =>
      current.map((windowItem) =>
        windowItem.instanceId === instanceId ? { ...windowItem, x, y } : windowItem,
      ),
    );
  }

  if (bootState === "booting") {
    return <BootScreen />;
  }

  if (bootState === "welcome") {
    return <WelcomeScreen />;
  }

  if (bootState === "login") {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <main className={styles.desktopShell}>
      <div className={styles.desktop}>
        <div className={styles.iconGrid}>
          {desktopIconIds.map((appId) => {
            const app = desktopAppMap.get(appId);

            if (!app) {
              return null;
            }

            return (
              <button
                className={styles.desktopIcon}
                key={app.id}
                onDoubleClick={() => openApp(app.id)}
                onClick={() => focusWindow(app.id)}
              >
                <img alt="" height={42} src={app.icon} width={42} />
                <span>{app.title}</span>
              </button>
            );
          })}
        </div>

        {visibleWindows.map((windowItem) => {
          const app = desktopAppMap.get(windowItem.appId);

          if (!app) {
            return null;
          }

          return (
            <XpWindow
              key={windowItem.instanceId}
              onClose={() => closeWindow(windowItem.instanceId)}
              onFocus={() => focusWindow(windowItem.instanceId)}
              onMaximize={() => toggleMaximize(windowItem.instanceId)}
              onMinimize={() => minimizeWindow(windowItem.instanceId)}
              onMove={(x, y) => moveWindow(windowItem.instanceId, x, y)}
              windowItem={windowItem}
            >
              {app.render()}
            </XpWindow>
          );
        })}
      </div>

      {startOpen && <StartMenu onOpenApp={openApp} />}

      <footer className={styles.taskbar}>
        <button
          aria-label="Abrir menu iniciar"
          className={styles.startButton}
          onClick={() => setStartOpen((current) => !current)}
        >
          <img alt="" height={22} src="/xp/icons/start.png" width={75} />
        </button>

        <div className={styles.taskbarApps}>
          {windows.map((windowItem) => (
            <button
              className={styles.taskbarApp}
              data-minimized={windowItem.minimized}
              key={windowItem.instanceId}
              onClick={() => {
                focusWindow(windowItem.instanceId);
                setWindows((current) =>
                  current.map((item) =>
                    item.instanceId === windowItem.instanceId
                      ? { ...item, minimized: !item.minimized }
                      : item,
                  ),
                );
              }}
            >
              <img alt="" height={16} src={windowItem.icon} width={16} />
              <span>{windowItem.title}</span>
            </button>
          ))}
        </div>

        <div className={styles.tray}>
          <span>{clock}</span>
        </div>
      </footer>
    </main>
  );
}

function BootScreen() {
  return (
    <main className={styles.bootScreen}>
      <img alt="Windows XP" height={110} src="/xp/boot/windows-xp-logo.png" width={220} />
      <div className={styles.bootProgress}>
        <span />
      </div>
    </main>
  );
}

function WelcomeScreen() {
  return (
    <main className={styles.welcomeScreen}>
      <h1>Welcome</h1>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className={styles.loginScreen}>
      <section className={styles.loginMain}>
        <div className={styles.loginIntro}>
          <img alt="Windows XP" height={100} src="/xp/boot/windows-xp-logo.png" width={150} />
          <p>Para comecar, clique no seu nome de usuario</p>
        </div>
        <div className={styles.loginSeparator} />
        <button className={styles.userTile} onClick={onLogin}>
          <img alt="" height={56} src="/xp/icons/avatar.png" width={56} />
          <span>{siteConfig.ownerNick}</span>
        </button>
      </section>
      <footer className={styles.loginFooter}>
        <button className={styles.shutdownButton}>
          <img alt="" height={24} src="/xp/icons/shutdown.png" width={24} />
          Desligar computador
        </button>
        <p>Depois de fazer logon, voce pode explorar os programas e arquivos.</p>
      </footer>
    </main>
  );
}

function StartMenu({ onOpenApp }: { onOpenApp: (appId: AppId) => void }) {
  return (
    <aside className={styles.startMenu}>
      <header className={styles.startMenuHeader}>
        <img alt="" height={48} src="/xp/icons/avatar.png" width={48} />
        <strong>{siteConfig.ownerNick}</strong>
      </header>
      <div className={styles.startMenuContent}>
        <div className={styles.startMenuColumn}>
          {desktopApps.slice(1, 6).map((app) => (
            <button key={app.id} onClick={() => onOpenApp(app.id)}>
              <img alt="" height={28} src={app.icon} width={28} />
              <span>{app.title}</span>
            </button>
          ))}
        </div>
        <div className={styles.startMenuColumn} data-secondary>
          {desktopApps.slice(0, 1).concat(desktopApps.slice(6)).map((app) => (
            <button key={app.id} onClick={() => onOpenApp(app.id)}>
              <img alt="" height={24} src={app.icon} width={24} />
              <span>{app.title}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function XpWindow({
  children,
  onClose,
  onFocus,
  onMaximize,
  onMinimize,
  onMove,
  windowItem,
}: {
  children: React.ReactNode;
  onClose: () => void;
  onFocus: () => void;
  onMaximize: () => void;
  onMinimize: () => void;
  onMove: (x: number, y: number) => void;
  windowItem: DesktopWindow;
}) {
  const position = windowItem.maximized
    ? { height: "calc(100vh - 34px)", left: 0, top: 0, width: "100vw" }
    : {
        height: windowItem.height,
        left: windowItem.x,
        top: windowItem.y,
        width: windowItem.width,
      };

  return (
    <section
      className={styles.window}
      onPointerDown={onFocus}
      style={{ ...position, zIndex: windowItem.zIndex }}
    >
      <header
        className={styles.windowTitlebar}
        onDoubleClick={onMaximize}
        onPointerDown={(event) => {
          if (windowItem.maximized) {
            return;
          }

          const startX = event.clientX;
          const startY = event.clientY;
          const initialX = windowItem.x;
          const initialY = windowItem.y;
          event.currentTarget.setPointerCapture(event.pointerId);

          const onPointerMove = (moveEvent: PointerEvent) => {
            const nextX = Math.max(0, initialX + moveEvent.clientX - startX);
            const nextY = Math.max(0, initialY + moveEvent.clientY - startY);
            onMove(nextX, nextY);
          };

          const onPointerUp = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
          };

          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", onPointerUp);
        }}
      >
        <div>
          <img alt="" height={16} src={windowItem.icon} width={16} />
          <span>{windowItem.title}</span>
        </div>
        <div className={styles.windowControls}>
          <button aria-label="Minimizar" onClick={onMinimize}>
            _
          </button>
          <button aria-label="Maximizar" onClick={onMaximize}>
            □
          </button>
          <button aria-label="Fechar" onClick={onClose}>
            x
          </button>
        </div>
      </header>
      <div className={styles.windowBody}>{children}</div>
    </section>
  );
}
