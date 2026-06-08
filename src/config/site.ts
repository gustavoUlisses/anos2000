export const siteConfig = {
  name: "Anos 2000",
  description:
    "Um desktop interativo inspirado no Windows XP, com MSN, bate-papo UOL, Winamp, arquivos pessoais, jogos e dashboard admin.",
  ownerNick: "GusDev",
  milestones: [
    {
      title: "Desktop XP",
      description:
        "Boot, login, desktop, taskbar, janelas e atalhos como camada principal da experiencia.",
    },
    {
      title: "Realtime seguro",
      description:
        "MSN e UOL usando Supabase Realtime com RLS, nicks anonimos e historico auditavel.",
    },
    {
      title: "Admin privado",
      description:
        "Dashboard para mensagens, usuarios online, uploads de midia e moderacao.",
    },
  ],
} as const;
