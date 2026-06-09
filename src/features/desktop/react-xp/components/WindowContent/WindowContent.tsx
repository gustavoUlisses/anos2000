import { lazy, Suspense, useMemo } from "react";

interface WindowAppProps {
    appId?: string;
    componentId?: string;
    landingUrl?: string;
    content?: unknown;
}

type WindowContentProps = WindowAppProps;

const windowRegistry: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
    FileExplorer: () => import("../Applications/FileExplorer/FileExplorer"),
    InternetExplorer: () => import("../Applications/InternetExplorer/InternetExplorer"),
    Notepad: () => import("../Applications/Notepad/Notepad"),
    Ragnarok: () => import("../Applications/Ragnarok/Ragnarok"),
    Run: () => import("../Applications/Run/Run"),
    Settings: () => import("../Applications/Settings/Settings"),
    WebEmbed: () => import("../Applications/WebEmbed/WebEmbed"),
};

export const WindowContent = ({ componentId, ...props }: WindowContentProps) => {
    const importer = componentId ? windowRegistry[componentId] : null;

    const Component = useMemo(() => {
        if (!importer) return null;
        return lazy(importer);
    }, [importer]);

    if (!Component || !componentId) return null;

    return (
        <Suspense fallback={null}>
            <Component {...props} />
        </Suspense>
    );
};
