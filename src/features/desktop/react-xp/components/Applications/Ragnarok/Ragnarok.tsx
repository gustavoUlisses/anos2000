import styles from "./Ragnarok.module.scss";

const Ragnarok = () => {
    return (
        <main className={styles.ragnarokApp}>
            <iframe
                className={styles.frame}
                src="https://maeloro.com/"
                title="Ragnarok"
                allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media; gamepad; pointer-lock"
                sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
                referrerPolicy="no-referrer-when-downgrade"
            />
        </main>
    );
};

export default Ragnarok;
