import type { FormEvent } from "react";

type MainWindowNotLoggedProps = {
  nick: string;
  setNick: (nick: string) => void;
  status: string;
  setStatus: (status: string) => void;
  onLogin: () => void;
};

export function MainWindowNotLogged({
  nick,
  onLogin,
  setNick,
  setStatus,
  status,
}: MainWindowNotLoggedProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin();
  }

  return (
    <>
      <div className="d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-center my-5">
            <img src="/images/user.png" alt="User" className="border border-2 border-white" width="130" />
          </div>
          <form className="px-4" onSubmit={handleSubmit}>
            <div className="mb-2 d-flex flex-column">
              <label htmlFor="messengerNickInput">Apelido:</label>
              <input
                type="text"
                className="border border-secondary"
                id="messengerNickInput"
                maxLength={24}
                onChange={(event) => setNick(event.target.value)}
                placeholder="Digite seu nick"
                value={nick}
              />
            </div>
            <div className="d-flex gap-1">
              <label htmlFor="statusInput">Status:</label>
              <select
                className="bg-transparent border-0 outline-none"
                id="statusInput"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="online">Online</option>
                <option value="away">Ausente</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div className="d-flex gap-1 mt-4">
              <input type="checkbox" name="rememberMeInput" id="rememberMeInput" />
              <label htmlFor="rememberMeInput">Lembrar de mim</label>
            </div>
            <div className="text-center">
              <button className="my-3 px-3 text-center" type="submit">Entrar</button>
            </div>
          </form>
        </div>
        <div className="links px-4 d-flex flex-column text-primary">
          <span role="button">Criar apelido temporario</span>
          <span role="button">Status do servico</span>
          <span role="button">Entrar como visitante</span>
        </div>
      </div>
      <div className="position-absolute bottom-0 py-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
          <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
        </svg>
        <span className="text-secondary ps-1">Windows Live ID</span>
      </div>
    </>
  );
}
