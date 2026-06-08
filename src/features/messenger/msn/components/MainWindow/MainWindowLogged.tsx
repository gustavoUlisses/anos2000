import { useState } from "react";
import type { MsnContact, MsnProfile } from "../../types";

type MainWindowLoggedProps = {
  contacts: MsnContact[];
  isRealtimeConfigured: boolean;
  onLogout: () => void;
  onOpenChat: (contact: MsnContact) => void;
  onPersonalMessageChange: (message: string) => void;
  profile: MsnProfile;
};

const statusIcon = {
  away: "/msn/images/user/user-away.png",
  offline: "/msn/images/user/user-invisible.png",
  online: "/msn/images/user/user-online.png",
};

export function MainWindowLogged({
  contacts,
  isRealtimeConfigured,
  onLogout,
  onOpenChat,
  onPersonalMessageChange,
  profile,
}: MainWindowLoggedProps) {
  const personalMessage = profile.personalMessage || (profile.isAdmin ? "Criador do projeto" : "<Enter a personal message>");
  const [draftMessage, setDraftMessage] = useState(personalMessage);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const onlineContacts = contacts.filter((contact) => contact.status === "online" || contact.status === "away");
  const offlineContacts = contacts.filter((contact) => contact.status === "offline");

  function savePersonalMessage() {
    const nextMessage = draftMessage.trim() || "<Enter a personal message>";
    setDraftMessage(nextMessage);
    setIsEditingMessage(false);
    onPersonalMessageChange(nextMessage);
  }

  return (
    <div className="logged-window-content">
      <div>
        <div className="logged-window-header p-1 my-2 position-relative">
          <div className="row g-0 align-items-center">
            <div className="col-auto">
              <img src="/msn/images/user.png" alt="User profile" width="65" className="border border-2 border-white" />
            </div>
            <div className="col d-flex flex-column ps-2">
              <span className="fw-bold">{profile.nick}</span>
              {isEditingMessage ? (
                <input
                  autoFocus
                  className="personal-message-input"
                  maxLength={80}
                  onBlur={savePersonalMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      savePersonalMessage();
                    }

                    if (event.key === "Escape") {
                      setDraftMessage(personalMessage);
                      setIsEditingMessage(false);
                    }
                  }}
                  value={draftMessage}
                />
              ) : (
                <button className="personal-message-button" onClick={() => setIsEditingMessage(true)} type="button">
                  {personalMessage}
                </button>
              )}
              <div className="d-flex gap-3 pt-1 justify-content-center">
                <img src="/msn/images/msn-icons/mail.png" alt="Icon" width="20" />
                <img src="/msn/images/msn-icons/folder.png" alt="Icon" width="20" />
                <img src="/msn/images/msn-icons/music.png" alt="Icon" width="20" />
                <img src="/msn/images/msn-icons/phone.png" alt="Icon" width="20" />
                <img src="/msn/images/footer-icon.png" alt="Icon" width="20" />
              </div>
            </div>
          </div>
        </div>
        <div className="logged-window-body p-2 bg-white">
          <div className="toolbar">
            <div className="row g-0">
              <div className="col">
                <input type="search" className="w-100" placeholder="Find a contact or number..." />
              </div>
              <div className="col-auto px-2" role="button">
                <img src="/msn/images/user/user-add.png" alt="Add user" />
              </div>
              <div className="col-auto" role="button">
                <img src="/msn/images/msn-icons/sort-contacts.png" alt="Sort contacts" />
              </div>
            </div>
            <hr className="mt-2 mb-1" />
            <div className="d-flex gap-2">
              <img src="/msn/images/msn-icons/info.png" alt="Info icon" width={16} />
              <span className="text-primary text-decoration-underline" role="button">
                {isRealtimeConfigured ? "You are connected to Anos 2000 MSN" : "Modo local: configure Supabase para conversar em tempo real"}
              </span>
            </div>
            <hr className="my-1" />
            <details open>
              <summary className="fw-bold">Online ({onlineContacts.length})</summary>
              {onlineContacts.map((contact) => (
                <div
                  className="d-flex gap-1"
                  key={contact.id}
                  onClick={() => onOpenChat(contact)}
                  onDoubleClick={() => onOpenChat(contact)}
                  role="button"
                >
                  <img src={statusIcon[contact.status]} alt="User icon" width={16} />
                  <span>{contact.nick}<span className="text-secondary"> - {contact.message}</span></span>
                </div>
              ))}
            </details>
            <hr className="my-1" />
            <details open>
              <summary className="fw-bold">Offline ({offlineContacts.length})</summary>
              {offlineContacts.map((contact) => (
                <div
                  className="d-flex gap-1"
                  key={contact.id}
                  onClick={() => onOpenChat(contact)}
                  onDoubleClick={() => onOpenChat(contact)}
                  role="button"
                >
                  <img src={statusIcon[contact.status]} alt="User icon" width={16} />
                  <span>{contact.nick}<span className="text-secondary"> - {contact.message}</span></span>
                </div>
              ))}
            </details>
          </div>
        </div>
      </div>
      <div className="logged-window-ad">
        <span>Advertisement</span>
        <img src="https://gifdb.com/images/high/microsoft-internet-explorer-admk702irl7ymxag.webp" alt="Ads" className="w-75" />
      </div>
      <div className="msn-account-footer py-1 d-flex align-items-center justify-content-between w-100">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-box-arrow-right" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
          </svg>
          <span className="text-secondary ps-1">Windows Live ID</span>
        </div>
        <button className="logout-button" onClick={onLogout} type="button">
          Sair
        </button>
      </div>
    </div>
  );
}
