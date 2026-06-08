import type { Metadata } from "next";
import "./globals.css";
import "@/features/desktop/react-xp/index.css";
import "@/features/messenger/msn-clone/msn-clone.css";

export const metadata: Metadata = {
  title: "Anos 2000",
  description: "Portfolio interativo inspirado no Windows XP e na internet dos anos 2000.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
