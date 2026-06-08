"use client";

import ReactXpApp from "@/features/desktop/react-xp/App";
import { Provider } from "@/features/desktop/react-xp/context/provider";

export function ReactXpExperience() {
  return (
    <Provider>
      <ReactXpApp />
    </Provider>
  );
}
