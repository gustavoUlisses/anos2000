import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    additionalData:
      '@mixin theme-color($mode) { :global(body[data-theme="#{$mode}"]) & { @content; } }',
  },
};

export default nextConfig;
