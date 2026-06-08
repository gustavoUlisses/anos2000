import type { DesktopApp } from "@/features/desktop/types";
import {
  AdminApp,
  InternetExplorerApp,
  MessengerApp,
  MyComputerApp,
  SimpleGameApp,
  UolChatApp,
  WinampApp,
} from "./PlaceholderApps";

export const desktopApps: DesktopApp[] = [
  {
    id: "my-computer",
    title: "Meu Computador",
    icon: "/xp/icons/my-computer.png",
    defaultSize: { width: 680, height: 420 },
    defaultPosition: { x: 90, y: 70 },
    render: () => <MyComputerApp />,
  },
  {
    id: "messenger",
    title: "MSN Messenger",
    icon: "/xp/icons/msn.png",
    defaultSize: { width: 360, height: 520 },
    defaultPosition: { x: 160, y: 80 },
    render: () => <MessengerApp />,
  },
  {
    id: "uol-chat",
    title: "Bate-papo UOL",
    icon: "/xp/icons/folder.png",
    defaultSize: { width: 560, height: 420 },
    defaultPosition: { x: 210, y: 120 },
    render: () => <UolChatApp />,
  },
  {
    id: "internet-explorer",
    title: "Internet Explorer",
    icon: "/xp/icons/internet-explorer.png",
    defaultSize: { width: 760, height: 480 },
    defaultPosition: { x: 120, y: 60 },
    render: () => <InternetExplorerApp />,
  },
  {
    id: "winamp",
    title: "Winamp",
    icon: "/xp/icons/winamp.png",
    defaultSize: { width: 380, height: 260 },
    defaultPosition: { x: 260, y: 130 },
    render: () => <WinampApp />,
  },
  {
    id: "minesweeper",
    title: "Campo Minado",
    icon: "/xp/icons/pinball.png",
    defaultSize: { width: 360, height: 420 },
    defaultPosition: { x: 300, y: 90 },
    render: () => <SimpleGameApp title="Campo Minado" />,
  },
  {
    id: "pinball",
    title: "Pinball",
    icon: "/xp/icons/pinball.png",
    defaultSize: { width: 640, height: 480 },
    defaultPosition: { x: 130, y: 70 },
    render: () => <SimpleGameApp title="Pinball" />,
  },
  {
    id: "solitaire",
    title: "Paciencia",
    icon: "/xp/icons/solitaire.png",
    defaultSize: { width: 640, height: 460 },
    defaultPosition: { x: 180, y: 80 },
    render: () => <SimpleGameApp title="Paciencia" />,
  },
  {
    id: "admin",
    title: "Admin",
    icon: "/xp/icons/avatar.png",
    defaultSize: { width: 720, height: 480 },
    defaultPosition: { x: 220, y: 80 },
    render: () => <AdminApp />,
  },
];

export const desktopAppMap = new Map(desktopApps.map((app) => [app.id, app]));
