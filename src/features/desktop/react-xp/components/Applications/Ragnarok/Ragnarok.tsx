import styles from "./Ragnarok.module.scss";

const RAGNAROK_URL = "https://classicweb.niktoutro.com/";

const Ragnarok = () => {
    return (
        <main className={styles.ragnarokApp}>
            <iframe
                className={styles.frame}
                src={RAGNAROK_URL}
                title="Ragnarok Online"
                allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media; gamepad; pointer-lock"
                sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
                referrerPolicy="no-referrer-when-downgrade"
            />
        </main>
    );
};

export default Ragnarok;
