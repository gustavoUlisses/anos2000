"use client";

import dynamic from "next/dynamic";

export const NoSsrReactXpExperience = dynamic(
  () =>
    import("@/features/desktop/ReactXpExperience").then(
      (module) => module.ReactXpExperience,
    ),
  {
    ssr: false,
  },
);
