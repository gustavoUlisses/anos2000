import styles from "./Ragnarok.module.scss";

const RAGNAROK_URL = "https://maeloro.com/";

const Ragnarok = () => {
    const openRagnarok = () => {
        window.open(RAGNAROK_URL, "_blank", "noopener,noreferrer");
    };

    return (
        <main className={styles.ragnarokApp}>
            <section className={styles.launcher}>
                <img src="/ragnarok/ragnarok.jfif" alt="" width="96" height="96" />
                <div>
                    <h2>Ragnarok Online</h2>
                    <p>maeloro.com nao permite abrir dentro da janela.</p>
                    <button type="button" onClick={openRagnarok}>Jogar</button>
                </div>
            </section>
        </main>
    );
};

export default Ragnarok;
