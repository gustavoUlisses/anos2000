import type { MessengerContact } from "./types";

type MainWindowLoggedProps = {
  activeContactId: string | null;
  contacts: MessengerContact[];
  nick: string;
  onOpenChat: (contact: MessengerContact) => void;
};

const statusIcon = {
  away: "/images/user/user-away.png",
  offline: "/images/user/user-invisible.png",
  online: "/images/user/user-online.png",
};

export function MainWindowLogged({
  activeContactId,
  contacts,
  nick,
  onOpenChat,
}: MainWindowLoggedProps) {
  const onlineContacts = contacts.filter((contact) => contact.status !== "offline");
  const offlineContacts = contacts.filter((contact) => contact.status === "offline");

  return (
    <div>
      <div>
        <div className="logged-window-header p-1 my-2 position-relative">
          <div className="row g-0 align-items-center">
            <div className="col-auto">
              <img src="/images/user.png" alt="User profile" width="65" className="border border-2 border-white" />
            </div>
            <div className="col d-flex flex-column ps-2">
              <span className="fw-bold">{nick}</span>
              <span>&lt;Digite uma mensagem pessoal&gt;</span>
              <div className="d-flex gap-3 pt-1 justify-content-center">
                <img src="/images/msn-icons/mail.png" alt="Icon" width="20" />
                <img src="/images/msn-icons/folder.png" alt="Icon" width="20" />
                <img src="/images/msn-icons/music.png" alt="Icon" width="20" />
                <img src="/images/msn-icons/phone.png" alt="Icon" width="20" />
                <img src="/images/footer-icon.png" alt="Icon" width="20" />
              </div>
            </div>
          </div>
        </div>
        <div className="logged-window-body p-2 bg-white">
          <div className="toolbar">
            <div className="row g-0">
              <div className="col">
                <input type="search" className="w-100" placeholder="Buscar contato ou numero..." />
              </div>
              <div className="col-auto px-2" role="button">
                <img src="/images/user/user-add.png" alt="Add user" />
              </div>
              <div className="col-auto" role="button">
                <img src="/images/msn-icons/sort-contacts.png" alt="Sort contacts" />
              </div>
            </div>
            <hr className="mt-2 mb-1" />
            <div className="d-flex gap-2">
              <img src="/images/msn-icons/info.png" alt="Info icon" width={16} />
              <span className="text-primary text-decoration-underline" role="button">Voce esta conectado ao MSN do Anos 2000</span>
            </div>
            <hr className="my-1" />
            <details open>
              <summary className="fw-bold">Online ({onlineContacts.length})</summary>
              {onlineContacts.map((contact) => (
                <button
                  className="contact-row d-flex gap-1"
                  data-active={activeContactId === contact.id}
                  key={contact.id}
                  onClick={() => onOpenChat(contact)}
                  type="button"
                >
                  <img src={statusIcon[contact.status]} alt="User icon" width={16} />
                  <span>{contact.nick} - <span className="text-secondary">{contact.message}</span></span>
                </button>
              ))}
            </details>
            <hr className="my-1" />
            <details open>
              <summary className="fw-bold">Offline ({offlineContacts.length})</summary>
              {offlineContacts.map((contact) => (
                <div className="d-flex gap-1" key={contact.id}>
                  <img src={statusIcon[contact.status]} alt="User icon" width={16} />
                  <span>{contact.nick} - <span className="text-secondary">{contact.message}</span></span>
                </div>
              ))}
            </details>
          </div>
        </div>
      </div>
      <div>
        <span>Publicidade</span>
        <div className="msn-ad">Anos 2000</div>
      </div>
      <div className="position-absolute bottom-0 py-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
          <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
        </svg>
        <span className="text-secondary ps-1">Windows Live ID</span>
      </div>
    </div>
  );
}
