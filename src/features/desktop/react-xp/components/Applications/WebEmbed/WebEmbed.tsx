import applicationsJSON from "../../../data/applications.json";
import type { Application } from "../../../context/types";
import styles from "./WebEmbed.module.scss";

const applications = applicationsJSON as unknown as Record<string, Application>;

interface WebEmbedProps {
    appId?: string;
}

const WebEmbed = ({ appId }: WebEmbedProps) => {
    const app = appId ? applications[appId] : null;

    if (!app?.embedUrl) {
        return <main className={styles.fallback}>Aplicativo indisponivel.</main>;
    }

    return (
        <main className={styles.webEmbed}>
            <iframe
                className={styles.frame}
                src={app.embedUrl}
                title={app.title}
                allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media; gamepad; pointer-lock"
                allowFullScreen
                sandbox={app.disableSandbox ? undefined : "allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"}
                referrerPolicy="no-referrer-when-downgrade"
            />
        </main>
    );
};

export default WebEmbed;
