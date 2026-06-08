import { siteConfig } from "@/config/site";

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 items-center gap-2 border-b border-[#c7c7c7] bg-[#ece9d8] px-2 text-[11px] text-black">
      {children}
    </div>
  );
}

export function MyComputerApp() {
  const items = [
    { label: "Minhas Fotos", icon: "/xp/icons/folder.png" },
    { label: "Minhas Musicas", icon: "/xp/icons/folder.png" },
    { label: "Meus Videos", icon: "/xp/icons/folder.png" },
    { label: "Documentos", icon: "/xp/icons/folder.png" },
  ];

  return (
    <div className="h-full bg-white text-black">
      <Toolbar>
        <span>Arquivo</span>
        <span>Editar</span>
        <span>Exibir</span>
        <span>Favoritos</span>
      </Toolbar>
      <div className="flex h-[calc(100%-36px)]">
        <aside className="w-48 border-r border-[#b8c7e0] bg-[#eff3ff] p-3 text-xs">
          <h3 className="mb-2 font-bold text-[#123c9c]">Tarefas do sistema</h3>
          <p className="leading-5 text-[#1f3f88]">
            Os arquivos enviados pelo dashboard admin vao aparecer aqui.
          </p>
        </aside>
        <main className="grid flex-1 content-start grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4 p-5 text-center text-xs">
          {items.map((item) => (
            <button
              className="flex flex-col items-center gap-2 rounded p-2 hover:bg-[#dce8ff]"
              key={item.label}
            >
              <img alt="" height={32} src={item.icon} width={32} />
              <span>{item.label}</span>
            </button>
          ))}
        </main>
      </div>
    </div>
  );
}

export function MessengerApp() {
  return (
    <div className="flex h-full flex-col bg-[#dbeafc] text-black">
      <div className="bg-gradient-to-r from-[#0f5fc5] to-[#72b4f8] p-4 text-white">
        <h2 className="text-lg font-bold">MSN Messenger</h2>
        <p className="text-xs">Entre com um nick para conversar em tempo real.</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
        <label className="text-xs font-bold" htmlFor="messenger-nick">
          Apelido
        </label>
        <input
          className="h-8 border border-[#7f9db9] px-2"
          id="messenger-nick"
          placeholder="Seu nick"
        />
        <button className="h-8 w-28 border border-[#003c74] bg-[#ece9d8] text-xs shadow">
          Entrar
        </button>
        <div className="mt-3 border border-[#7f9db9] bg-white p-3 text-xs">
          <p className="font-bold">{siteConfig.ownerNick}</p>
          <p className="mt-1 text-[#267a15]">online</p>
        </div>
      </div>
    </div>
  );
}

export function UolChatApp() {
  return (
    <div className="h-full bg-[#fff8dc] text-black">
      <div className="border-b border-[#c9a33a] bg-[#ffd342] p-3">
        <h2 className="text-lg font-bold text-[#0b2c6f]">Bate-papo UOL</h2>
      </div>
      <div className="space-y-3 p-4 text-sm">
        <input className="h-8 w-64 border border-[#9b8a50] px-2" placeholder="Nick" />
        <button className="ml-2 h-8 border border-[#7a6500] bg-[#f4c400] px-4 text-xs font-bold">
          Entrar na sala
        </button>
        <div className="h-44 border border-[#9b8a50] bg-white p-3 text-xs">
          Escolha uma sala para iniciar o chat em tempo real.
        </div>
      </div>
    </div>
  );
}

export function InternetExplorerApp() {
  return (
    <div className="flex h-full flex-col bg-white text-black">
      <Toolbar>
        <button>Voltar</button>
        <button>Avancar</button>
        <button>Atualizar</button>
      </Toolbar>
      <div className="flex h-9 items-center gap-2 border-b border-[#c7c7c7] bg-[#ece9d8] px-2 text-xs">
        <span>Endereco</span>
        <input className="h-6 flex-1 border border-[#7f9db9] px-2" defaultValue="orkut.com" />
        <button className="h-6 border border-[#7f9db9] px-3">Ir</button>
      </div>
      <div className="flex flex-1 items-center justify-center bg-white p-8 text-center text-sm">
        <p>
          O navegador vai resolver atalhos nostalgicos como orkut.com, youtube.com
          e Wayback Machine em uma camada isolada.
        </p>
      </div>
    </div>
  );
}

export function WinampApp() {
  return (
    <div className="flex h-full items-center justify-center bg-[#191919] p-6 text-center text-[#39ff14]">
      <div>
        <h2 className="font-mono text-xl font-bold">WINAMP</h2>
        <p className="mt-3 max-w-sm text-xs leading-5 text-[#a7ffa1]">
          A integracao real usara o pacote webamp e uma playlist vinda do Supabase Storage.
        </p>
      </div>
    </div>
  );
}

export function SimpleGameApp({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-[#c0c0c0] text-black">
      <div className="border-2 border-[#808080] bg-[#d4d0c8] p-6 text-center shadow">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-xs">Jogo sera implementado como app nativo da shell XP.</p>
      </div>
    </div>
  );
}

export function AdminApp() {
  return (
    <div className="h-full bg-[#101827] p-5 text-white">
      <h2 className="text-lg font-bold">Dashboard Admin</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#cbd5e1]">
        Area protegida para conversas, usuarios online, uploads e moderacao. Operacoes
        sensiveis usarao Supabase Auth, RLS e rotas server-only.
      </p>
    </div>
  );
}
