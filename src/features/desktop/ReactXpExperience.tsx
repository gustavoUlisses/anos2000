"use client";

import ReactXpApp from "@/features/desktop/react-xp/App";
import { Provider } from "@/features/desktop/react-xp/context/provider";

export function ReactXpExperience() {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black">
      <Provider>
        <ReactXpApp />
      </Provider>
    </div>
  );
}
