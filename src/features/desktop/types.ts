import type { ReactNode } from "react";

export type AppId =
  | "my-computer"
  | "messenger"
  | "uol-chat"
  | "internet-explorer"
  | "winamp"
  | "minesweeper"
  | "pinball"
  | "solitaire"
  | "admin";

export type DesktopApp = {
  id: AppId;
  title: string;
  icon: string;
  defaultSize: {
    width: number;
    height: number;
  };
  defaultPosition: {
    x: number;
    y: number;
  };
  render: () => ReactNode;
};

export type DesktopWindow = {
  instanceId: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};
