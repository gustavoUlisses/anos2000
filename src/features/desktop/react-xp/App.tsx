import { Activity, useCallback, useEffect } from "react";
import Desktop from "./components/Desktop/Desktop";
import Login from "./components/Login/Login";
import TaskBar from "./components/TaskBar/TaskBar";
import Wallpaper from "./components/Wallpaper/Wallpaper";
import WindowManagement from "./components/WindowManagement/WindowManagement";
import { useContext } from "./context/context";
import type { MessengerTaskbarItem, OverlayTaskbarItem } from "./context/types";
import { MsnMessengerApp } from "@/features/messenger/msn/MsnMessengerApp";
import { WinampApp } from "@/features/winamp/WinampApp";

function App() {
    const {windowsInitiationState, isInitialBoot, initiationStage, isMessengerOpen, isWinampOpen, dispatch} = useContext();

    const handleMessengerTaskbarItemsChange = useCallback((items: MessengerTaskbarItem[]) => {
        dispatch({ type: "SET_MESSENGER_TASKBAR_ITEMS", payload: items });
    }, [dispatch]);

    const handleMessengerClose = useCallback(() => {
        dispatch({ type: "SET_MESSENGER_TASKBAR_ITEMS", payload: [] });
        dispatch({ type: "SET_IS_MESSENGER_OPEN", payload: false });
    }, [dispatch]);

    const handleWinampTaskbarItemChange = useCallback((item: OverlayTaskbarItem | null) => {
        dispatch({ type: "SET_WINAMP_TASKBAR_ITEM", payload: item });
    }, [dispatch]);

    const handleWinampClose = useCallback(() => {
        dispatch({ type: "SET_WINAMP_TASKBAR_ITEM", payload: null });
        dispatch({ type: "SET_IS_WINAMP_OPEN", payload: false });
    }, [dispatch]);

    useEffect(() => {
        const delayMap = [500, 500, 500];
        if (windowsInitiationState !== "loggedIn" || initiationStage >= delayMap.length) return;
        
        if(isInitialBoot) dispatch({ type: "SET_IS_INITIAL_BOOT", payload: false });
        
        const delay = setTimeout(() => {
            dispatch({ type: "SET_INITIATION_STAGE", payload: initiationStage + 1});

        }, delayMap[initiationStage]);

        return () => clearTimeout(delay);
    }, [isInitialBoot, initiationStage, windowsInitiationState, dispatch]);

    return (
        <>
            <Activity mode={(["shutDown", "bios", "welcome", "transition", "login", "loggingIn"].includes(windowsInitiationState)) ? "visible" : "hidden"}>
                <Login user="Visitante" />
            </Activity>
            <Wallpaper />
            <Activity mode={(initiationStage > 0) ? "visible" : "hidden"}>
                <Desktop />
            </Activity>
            <Activity mode={(initiationStage > 1) ? "visible" : "hidden"}>
                <TaskBar />
            </Activity>
            <Activity mode={(initiationStage > 2) ? "visible" : "hidden"}>
                <WindowManagement />
            </Activity>
            {initiationStage > 0 && isMessengerOpen && (
                <MsnMessengerApp
                    onClose={handleMessengerClose}
                    onTaskbarItemsChange={handleMessengerTaskbarItemsChange}
                />
            )}
            {initiationStage > 0 && isWinampOpen && (
                <WinampApp
                    onClose={handleWinampClose}
                    onTaskbarItemChange={handleWinampTaskbarItemChange}
                />
            )}
        </>
    );
}

export default App;
