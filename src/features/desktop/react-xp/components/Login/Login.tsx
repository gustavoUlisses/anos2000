import React, { useEffect, useState } from "react";
import { useContext } from "../../context/context";
import playSound from "../../utils/sounds";
import Bios from "../Bios/Bios";
import ShutDownModal from "../ShutDownModal/ShutDownModal";
import styles from "./Login.module.scss";

interface LoginProps {
    user: string;
}

const Login = ({ user }: LoginProps) => {
    const {currentWindows, windowsInitiationState, isInitialBoot, transitionLabel, isShutDownModalOpen, dispatch} = useContext();
    const [shutdownMsg, setShutdownMsg] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (windowsInitiationState === "bios") {
            const biosDelay = setTimeout(() => {
                dispatch({ type: "SET_WINDOWS_INITIATION_STATE", payload: "welcome" });
            }, 3000);

            return () => clearTimeout(biosDelay);
        }

        if (windowsInitiationState === "welcome") {
            const welcomeDelay = setTimeout(() => {
                dispatch({ type: "SET_WINDOWS_INITIATION_STATE", payload: "login" });
            }, 3000);

            return () => clearTimeout(welcomeDelay);
        }
    }, [windowsInitiationState, dispatch]);

    useEffect(() => {
        if (windowsInitiationState !== "shutDown") return;

        const timeouts = [
            [5000, "Fim da sessao."],
            [13000, null],
            [16000, "Atualize a pagina para ligar novamente."]
        ];

        const timers = timeouts.map(([delay, message]) =>
            setTimeout(() => {
                setShutdownMsg((message) ? <h3 className={styles.consoleMsg}>{message}</h3> : null);
            }, delay as number)
        );

        return () => timers.forEach(clearTimeout);
    }, [windowsInitiationState]);


    const onUserClickHandler = () => {
        dispatch({ type: "SET_WINDOWS_INITIATION_STATE", payload: "loggingIn" });
        const loggingInDelay = setTimeout(() => {
            playSound("startup", true);
            dispatch({ type: "SET_WINDOWS_INITIATION_STATE", payload: "loggedIn" });
            sessionStorage.setItem("loggedIn", "true");
        }, 500);

        return () => clearTimeout(loggingInDelay);
    };

    const onShutDownModalButtonHandler = () => {
        dispatch({ type: "SET_IS_SHUTDOWN_MODAL_OPEN", payload: true });
    };

    return (
        <>
            {windowsInitiationState == "shutDown" && <div className="absolute inset-0 z-100 bg-black flex items-center justify-center"><span>{shutdownMsg}</span></div>}
            {windowsInitiationState == "bios" && <Bios />}
            {windowsInitiationState !== "bios" && <div className={`${styles.login} flex flex-col justify-center relative w-full h-full`}>
                <div className="grow h-1/7"></div>

                {(windowsInitiationState === "welcome") && (
                    <main className="flex h-6/7 px-8">
                        <h1 className="text-9xl">Bem-vindo</h1>
                    </main>
                )}

                {(windowsInitiationState === "transition") && (
                    <main className="flex h-6/7 px-8">
                        <div className={`${styles.transition} flex flex-col items-end relative`}>
                            <img className="mb-6" src="/logo__windows_xp.png" height="100" width="100" />
                            <h3 className="mr-8 absolute w-max -bottom-8">{transitionLabel}</h3>
                        </div>
                    </main>
                )}

                {(!["shutDown", "welcome", "transition"].includes(windowsInitiationState)) && (
                    <main className="flex h-6/7 px-8">
                        <div className={`${styles.details} flex flex-col justify-center items-end`}>
                            {(windowsInitiationState !== "loggingIn") && (
                                <>
                                    <img className="mb-6" src="/logo__windows_xp.png" height="150" width="150" />
                                    <h3 className="text-right">Para comecar, clique no seu nome de usuario</h3>
                                </>
                            )}
                            {(windowsInitiationState === "loggingIn") && <h1 className={styles.loginMsg}>Bem-vindo</h1>}
                        </div>
                        <span className={`${styles.seperator} m-9`}></span>
                        <div className="flex flex-col justify-center">
                            <button className={`${styles.userContainer} flex p-3 gap-5`} data-init-state={windowsInitiationState} onClick={onUserClickHandler}>
                                <img className={`${styles.avatar} m-1.5`} width="50" height="50" data-init-state={windowsInitiationState} src="/avatar__skateboard.png" />
                                <div className={`${styles.userNameContainer} flex flex-col`}>
                                    <h3  data-init-state={windowsInitiationState}>{user}</h3>
                                    {!isInitialBoot && currentWindows.length > 0 && <p className="font-bold">{currentWindows.length} programa{currentWindows.length > 1 ? "s" : ""} em execucao.</p>}
                                    {currentWindows.length === 0 && windowsInitiationState === "loggingIn" && <p className="font-bold text-[#102f96]">Carregando suas configuracoes pessoais...</p>}
                                </div>
                            </button>
                        </div>
                    </main>
                )}

                <div className={`flex justify-center grow h-1/7`}>
                    <div className={`${styles.footer} w-full p-9 flex`}>
                        {["login", "loggingIn"].includes(windowsInitiationState) && (
                            <>
                                <button className={`${styles.shutDown} flex items-center mb-4`} onClick={() => onShutDownModalButtonHandler()}>
                                    <img className="mr-3" width="22" height="22" src="/icon__shut_down--large.png" />
                                    <h3>Desligar computador</h3>
                                </button>
                                <div className="max-w-90">
                                    <p>Depois de fazer logon, voce pode explorar os programas e arquivos disponiveis.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div> }
            {isShutDownModalOpen && <ShutDownModal />}
        </>   
    );
};

export default Login;
