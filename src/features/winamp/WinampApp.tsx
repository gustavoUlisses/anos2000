"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OverlayTaskbarItem } from "@/features/desktop/react-xp/context/types";
import { winampTracks } from "./tracks";
import styles from "./WinampApp.module.scss";

const WINAMP_TASKBAR_ITEM: OverlayTaskbarItem = {
    icon: "/winamp/images/winamp.png",
    id: "winamp",
    title: "Winamp",
};

type WebampConstructor = typeof import("webamp").default;
type WebampInstance = InstanceType<WebampConstructor>;

interface WinampAppProps {
    onClose: () => void;
    onTaskbarItemChange: (item: OverlayTaskbarItem | null) => void;
}

export function WinampApp({ onClose, onTaskbarItemChange }: WinampAppProps) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const webampRef = useRef<WebampInstance | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const taskbarItem = useMemo<OverlayTaskbarItem>(() => ({
        ...WINAMP_TASKBAR_ITEM,
        active: !isMinimized,
    }), [isMinimized]);

    useEffect(() => {
        onTaskbarItemChange(taskbarItem);

        return () => onTaskbarItemChange(null);
    }, [onTaskbarItemChange, taskbarItem]);

    useEffect(() => {
        const handleTaskbarClick = () => {
            setIsMinimized((current) => !current);
        };

        window.addEventListener("anos2000:winamp-taskbar-click", handleTaskbarClick);

        return () => window.removeEventListener("anos2000:winamp-taskbar-click", handleTaskbarClick);
    }, []);

    useEffect(() => {
        let isDisposed = false;
        let unsubscribeClose: (() => void) | undefined;
        let unsubscribeMinimize: (() => void) | undefined;

        const mountWebamp = async () => {
            const host = hostRef.current;
            if (!host) return;

            const { default: Webamp } = await import("webamp");

            if (!Webamp.browserIsSupported()) {
                setError("Este navegador nao suporta o Winamp.");
                return;
            }

            const webamp = new Webamp({
                initialTracks: winampTracks,
                windowLayout: {
                    main: { position: { left: 0, top: 0 } },
                    equalizer: { closed: false, position: { left: 0, top: 116 } },
                    playlist: {
                        closed: false,
                        position: { left: 0, top: 232 },
                        size: { extraHeight: 4, extraWidth: 0 },
                    },
                },
            });

            webampRef.current = webamp;
            await webamp.renderWhenReady(host);

            if (isDisposed) {
                webamp.dispose();
                return;
            }

            const webampElement = document.querySelector("#webamp");
            if (webampElement && webampElement.parentElement !== host) {
                host.appendChild(webampElement);
            }

            unsubscribeClose = webamp.onClose(onClose);
            unsubscribeMinimize = webamp.onMinimize(() => setIsMinimized(true));
        };

        mountWebamp().catch(() => {
            setError("Nao foi possivel abrir o Winamp.");
        });

        return () => {
            isDisposed = true;
            unsubscribeClose?.();
            unsubscribeMinimize?.();
            webampRef.current?.dispose();
            webampRef.current = null;
        };
    }, [onClose]);

    return (
        <div ref={hostRef} className={styles.winampLayer} data-minimized={isMinimized}>
            {error && <div className={styles.fallback}>{error}</div>}
        </div>
    );
}
