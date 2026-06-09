import { useState } from "react";
import type { MsnBlockedContact, MsnContact, MsnProfile } from "../../types";

type MainWindowLoggedProps = {
  blockedContacts: MsnBlockedContact[];
  contacts: MsnContact[];
  isRealtimeConfigured: boolean;
  onLogout: () => void;
  onOpenChat: (contact: MsnContact) => void;
  onPersonalMessageChange: (message: string) => void;
  onUnblockContact: (contactId: string) => void;
  profile: MsnProfile;
};

const statusIcon = {
  away: "/msn/images/user/user-away.png",
  offline: "/msn/images/user/user-invisible.png",
  online: "/msn/images/user/user-online.png",
};

export function MainWindowLogged({
  blockedContacts,
  contacts,
  isRealtimeConfigured,
  onLogout,
  onOpenChat,
  onPersonalMessageChange,
  onUnblockContact,
  profile,
}: MainWindowLoggedProps) {
  const personalMessage = profile.personalMessage.trim() || (profile.isAdmin ? "Criador do projeto" : "");
  const [draftMessage, setDraftMessage] = useState(personalMessage);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const onlineContacts = contacts.filter((contact) => contact.status === "online" || contact.status === "away");
  const offlineContacts = contacts.filter((contact) => contact.status === "offline");

  function renderContactLabel(contact: MsnContact) {
    return (
      <span>
        {contact.nick}
        {contact.message ? <span className="text-secondary"> - {contact.message}</span> : null}
      </span>
    );
  }

  function savePersonalMessage() {
    const nextMessage = draftMessage.trim();
    setDraftMessage(nextMessage);
    setIsEditingMessage(false);
    onPersonalMessageChange(nextMessage);
  }

  return (
    <div className="logged-window-content">
      <div className="logged-window-main">
        <div className="logged-window-header p-1 my-2 position-relative">
          <div className="row g-0 align-items-center">
            <div className="col-auto">
              <div className="msn-avatar-frame msn-avatar-frame-main">
                <img src="/msn/images/user.png" alt="User profile" />
              </div>
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
                  placeholder="<Enter a personal message>"
                  value={draftMessage}
                />
              ) : (
                <button
                  aria-label="Definir mensagem pessoal"
                  className="personal-message-button"
                  onClick={() => setIsEditingMessage(true)}
                  type="button"
                >
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
                  {renderContactLabel(contact)}
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
                  {renderContactLabel(contact)}
                </div>
              ))}
            </details>
            {blockedContacts.length ? (
              <>
                <hr className="my-1" />
                <details>
                  <summary className="fw-bold">Bloqueados ({blockedContacts.length})</summary>
                  {blockedContacts.map((contact) => (
                    <div className="blocked-contact-row" key={contact.id}>
                      <div className="d-flex gap-1 align-items-center min-w-0">
                        <img src="/msn/images/user/user-blocked.png" alt="Blocked user icon" width={16} />
                        <span className="blocked-contact-name">{contact.nick}</span>
                      </div>
                      <button
                        className="unblock-button"
                        onClick={() => onUnblockContact(contact.id)}
                        type="button"
                      >
                        Desbloquear
                      </button>
                    </div>
                  ))}
                </details>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="logged-window-ad">
        <span>Advertisement</span>
        <img src="/msn/images/banner.gif" alt="Ads" className="w-75" />
      </div>
      <div className="msn-account-footer py-1 d-flex align-items-center justify-content-between w-100">
        <button className="logout-button" onClick={onLogout} type="button">
          Sair
        </button>
      </div>
    </div>
  );
}
