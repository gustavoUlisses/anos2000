import { useRef, useState, useEffect } from "react";
import { useContext } from "../../../context/context";
import applicationsJSON from "../../../data/applications.json";
import { getCurrentWindow } from "../../../utils/general";
import WindowMenu from "../../WindowMenu/WindowMenu";
import styles from "./InternetExplorer.module.scss";
import type { Application } from "../../../context/types";

const Applications = applicationsJSON as unknown as Record<string, Application>;
const IE_HOME_URL = "anos2000://home";
const WAYBACK_TIMESTAMP = "20080601000000id_";
const DIRECT_ALLOWED_URLS = ["https://yorgute.com/inicio"];

const IE_FAVORITES = [
    { label: "Colheita Feliz", url: "https://fazendadossonhos.app/" },
    { label: "Orkut", url: "https://yorgute.com/inicio" },
    { label: "Reddit", url: "https://old.reddit.com" },
    { label: "Jogos", url: "https://poki.com/" },
    { label: "MySpace", url: "https://spacehey.com/" },
    { label: "Gifs", url: "https://gifcities.org/" },
    { label: "Kibeloco", url: "https://www.kibeloco.com.br/" },
];

const normalizeUrl = (inputValue: string) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return IE_HOME_URL;
    if (/^https?:\/\//i.test(trimmed) || trimmed === "about:blank" || trimmed === IE_HOME_URL) return trimmed;
    return `https://${trimmed}`;
};

const isDirectAllowed = (url: string) => {
    const normalized = normalizeUrl(url).replace(/\/$/, "");

    return DIRECT_ALLOWED_URLS.some((allowedUrl) => {
        const normalizedAllowedUrl = normalizeUrl(allowedUrl).replace(/\/$/, "");
        return normalized === normalizedAllowedUrl || normalized.startsWith(normalizedAllowedUrl);
    });
};

const getIframeSrc = (inputValue: string) => {
    const value = normalizeUrl(inputValue);
    const shouldUseWayback = value !== "about:blank" && value !== IE_HOME_URL && !isDirectAllowed(value);
    const url = shouldUseWayback ? `https://web.archive.org/web/${WAYBACK_TIMESTAMP}/${value}` : value;

    return { url, value };
};

const InternetExplorer = ({ appId }: Record<string, string>) => {
    const { currentWindows, dispatch } = useContext();
    const [isBackDisabled, setIsBackDisabled] = useState(true);
    const [isForwardDisabled, setIsForwardDisabled] = useState(true);
    const { currentWindow, updatedCurrentWindows } = getCurrentWindow(currentWindows);
    const HOMEPAGE = currentWindow?.landingUrl || IE_HOME_URL;
    const [iframeSrc, setIframeSrc] = useState(() => getIframeSrc(HOMEPAGE).url);
    const [isHomeVisible, setIsHomeVisible] = useState(HOMEPAGE === IE_HOME_URL);

    const inputFieldRef = useRef<HTMLInputElement | null>(null);
    const currentUrl = useRef<string>(HOMEPAGE);
    
    useEffect(() => {
        if (!currentWindow) return;

        if (currentWindow.history) setIsBackDisabled(currentWindow.history.length === 0);
        if (currentWindow.forward) setIsForwardDisabled(currentWindow.forward.length === 0);
    }, [currentWindow, currentWindows]);

    const appData = Applications[appId];

    const updateIframe = (inputValue = inputFieldRef.current?.value || HOMEPAGE) => {
        const { url, value } = getIframeSrc(inputValue);
        setIsHomeVisible(value === IE_HOME_URL);
        setIframeSrc(url);
    };

    const navigateTo = (nextInputValue: string, addToHistory = true) => {
        const nextValue = normalizeUrl(nextInputValue);
        const inputField = inputFieldRef.current;

        if (inputField) inputField.value = nextValue === IE_HOME_URL ? "" : nextValue;

        if (addToHistory && currentWindow?.history && currentUrl.current !== nextValue) {
            if (currentUrl.current !== currentWindow.history.at(-1)) currentWindow.history.push(currentUrl.current);
            if (currentWindow.forward) currentWindow.forward = [];
            dispatch({ type: "SET_CURRENT_WINDOWS", payload: updatedCurrentWindows });
        }

        currentUrl.current = nextValue;
        updateIframe(nextValue);
    };

    const backClickHandler = () => {
        if (!currentWindow?.history || !currentWindow?.forward || currentWindow.history.length === 0) return;

        currentWindow.forward.push(currentUrl.current);
        const previousUrl = currentWindow.history.pop() || HOMEPAGE;
        const inputField = inputFieldRef.current;
        currentUrl.current = previousUrl;
        if (inputField) inputField.value = previousUrl === IE_HOME_URL ? "" : previousUrl;
        updateIframe(previousUrl);
        dispatch({ type: "SET_CURRENT_WINDOWS", payload: updatedCurrentWindows });
    };

    const forwardClickHandler = () => {
        if (!currentWindow?.history || !currentWindow?.forward || currentWindow.forward.length === 0) return;

        currentWindow.history.push(currentUrl.current);
        const nextUrl = currentWindow.forward.pop() || HOMEPAGE;
        const inputField = inputFieldRef.current;
        currentUrl.current = nextUrl;
        if (inputField) inputField.value = nextUrl === IE_HOME_URL ? "" : nextUrl;
        updateIframe(nextUrl);
        dispatch({ type: "SET_CURRENT_WINDOWS", payload: updatedCurrentWindows });
    };

    const submitURLHandler = () => {
        navigateTo(inputFieldRef.current?.value || HOMEPAGE);
    };

    const keyDownHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            submitURLHandler();
        }
    };

    const stopClickHandler = () => {
        setIsHomeVisible(false);
        setIframeSrc("about:blank");
    };

    const refreshClickHandler = () => {
        updateIframe(currentUrl.current);
    };

    const homeClickHandler = () => {
        navigateTo(HOMEPAGE);
    };

    const favoriteClickHandler = (url: string) => {
        navigateTo(url);
    };

    return (
        <>
            <div className={styles.menusContainer}>
                <WindowMenu menuItems={["File", "Edit", "View", "Favorites", "Tools", "Help"]} hasWindowsLogo={true} />
                <section className={`${styles.appMenu} relative`}>
                    <div className="flex absolute">
                        <div className="flex shrink-0">
                            <button className="flex items-center m-0.5" onClick={backClickHandler} disabled={isBackDisabled}>
                                <img className="mr-2" src="/icon__back.png" width="20" height="20" />
                                <h4>Back</h4>
                                <span className="h-full"><span className={styles.dropdown}>v</span></span>
                            </button>
                            <button className="flex items-center m-0.5" onClick={forwardClickHandler} disabled={isForwardDisabled}>
                                <img src="/icon__forward.png" width="20" height="20" />
                                <h4 className="hidden">Forward</h4>
                                <span className="h-full"><span className={styles.dropdown}>v</span></span>
                            </button>
                            <button className="flex items-center m-0.5" onClick={stopClickHandler}>
                                <img src="/icon__stop--large.png" width="20" height="20" />
                                <h4 className="hidden">Stop</h4>
                            </button>
                            <button className="flex items-center m-0.5" onClick={refreshClickHandler}>
                                <img src="/icon__refresh--large.png" width="20" height="20" />
                                <h4 className="hidden">Refresh</h4>
                            </button>
                            <button className="flex items-center m-0.5" onClick={homeClickHandler}>
                                <img src="/icon__home--large.png" width="20" height="20" />
                                <h4 className="hidden">Home</h4>
                            </button>
                        </div>
                        <div className="flex shrink-0">
                            <button className="flex items-center m-0.5 cursor-not-allowed">
                                <img className="mr-2" src="/icon__search--large.png" width="20" height="20" />
                                <h4>Search</h4>
                            </button>
                            <button className="flex items-center m-0.5">
                                <img className="mr-2" src="/icon__favourites--large.png" width="20" height="20" />
                                <h4>Favourites</h4>
                            </button>
                            <button className="flex items-center m-0.5 cursor-default" data-selected={true}>
                                <img className="mr-2" src="/icon__history--large.png" width="20" height="20" />
                                <h4>Anos 2000</h4>
                            </button>
                        </div>
                        <div className="flex shrink-0">
                            <button className="flex items-center m-0.5 cursor-not-allowed">
                                <img className="mr-2" src="/icon__mail--large.png" width="20" height="20" />
                                <h4 className="hidden">Mail</h4>
                            </button>
                            <button className="flex items-center m-0.5 cursor-not-allowed">
                                <img className="mr-2" src="/icon__print--large.png" width="20" height="20" />
                                <h4 className="hidden">Print</h4>
                            </button>
                        </div>
                    </div>
                </section>
                <section className={`${styles.navMenu} relative`}>
                    <div className="w-full h-full flex items-center absolute px-3">
                        <span className={`${styles.navLabel} mr-1`}>Address</span>

                        <div className={`${styles.navBar} flex mx-1 h-full`}>
                            <img src={appData.icon || appData.iconLarge} className="mx-1" width="14" height="14" />
                            <input ref={inputFieldRef} className={`${styles.navBar} h-full`} type="text" defaultValue={HOMEPAGE === IE_HOME_URL ? "" : HOMEPAGE} onKeyDown={keyDownHandler} />
                            <button className={styles.dropDown} onClick={submitURLHandler}>Submit</button>
                        </div>
                        <button className={`${styles.goButton} flex items-center`} onClick={submitURLHandler}>
                            <img src="/icon__go.png" className="mr-1.5" width="19" height="19" />
                            <span>Go</span>
                        </button>
                    </div>
                </section>
                <section className={`${styles.favoritesMenu} flex items-center`}>
                    <span>Favorites</span>
                    {IE_FAVORITES.map((favorite) => (
                        <button key={favorite.url} type="button" onClick={() => favoriteClickHandler(favorite.url)}>
                            {favorite.label}
                        </button>
                    ))}
                </section>
            </div>
            <main className={`${styles.mainContent} h-full flex overflow-auto`}>
                {isHomeVisible && (
                    <section className={styles.homePage}>
                        <img src="/icon__internet_explorer--large.png" alt="" width="64" height="64" />
                        <h2>Internet Explorer</h2>
                        <p>Digite um endereco ou escolha um favorito.</p>
                        <div>
                            {IE_FAVORITES.map((favorite) => (
                                <button key={favorite.url} type="button" onClick={() => favoriteClickHandler(favorite.url)}>
                                    {favorite.label}
                                </button>
                            ))}
                        </div>
                    </section>
                )}
                {!isHomeVisible && (
                    <iframe
                        src={iframeSrc}
                        width="100%"
                        height="100%"
                        allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media; gamepad; pointer-lock"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                )}
            </main >
            <div className={`${styles.statusBar} flex justify-between px-2 py-0.5`}>
                <div className="flex items-center gap-1">
                    <img src="icon__internet_explorer.png" height="12" width="12" />
                    <p>Wayback 2008 ativo</p>
                </div>
                <div className="flex">
                    <div className="flex items-center">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className={styles.verticaLine}></div>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 ml-3 w-44">
                        <img src="icon__globe.png" height="12" width="12" />
                        <p>Internet</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InternetExplorer;
