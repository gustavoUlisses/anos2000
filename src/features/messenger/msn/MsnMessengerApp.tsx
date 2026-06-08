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

const initialAssets = [
  "/msn/favicon.ico",
  "/msn/images/user.png",
];

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

function appendStylesheet(shadowRoot: ShadowRoot, href: string) {
  return new Promise<void>((resolve) => {
    const existingLink = shadowRoot.querySelector<HTMLLinkElement>(`link[href="${href}"]`);

    if (existingLink?.sheet) {
      resolve();
      return;
    }

    if (existingLink) {
      existingLink.addEventListener("load", () => resolve(), { once: true });
      existingLink.addEventListener("error", () => resolve(), { once: true });
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
    link.href = href;
    shadowRoot.append(link);
  });
}

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
      mount = document.createElement("div");
      mount.dataset.msnRoot = "true";
      shadowRoot.append(mount);
    }

    let isActive = true;

    Promise.all([
      ...stylesheets.map((href) => appendStylesheet(shadowRoot, href)),
      ...initialAssets.map(preloadImage),
    ]).then(() => {
      if (isActive) {
        setMountNode(mount);
      }
    });

    return () => {
      isActive = false;
    };
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
