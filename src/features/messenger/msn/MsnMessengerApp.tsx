"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MsnApp } from "./MsnApp";

type MsnMessengerAppProps = {
  onClose: () => void;
};

const stylesheets = [
  "/msn/styles/bootstrap.min.css",
  "/msn/styles/MainWindow.css",
  "/msn/styles/ChatWindow.css",
  "/msn/styles/MsnApp.css",
];

export function MsnMessengerApp({ onClose }: MsnMessengerAppProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    let mount = shadowRoot.querySelector<HTMLDivElement>("[data-msn-root]");

    if (!mount) {
      for (const href of stylesheets) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        shadowRoot.append(link);
      }

      mount = document.createElement("div");
      mount.dataset.msnRoot = "true";
      shadowRoot.append(mount);
    }

    setMountNode(mount);
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        position: "absolute",
        zIndex: 40,
      }}
    >
      {mountNode ? createPortal(<MsnApp onClose={onClose} />, mountNode) : null}
    </div>
  );
}
