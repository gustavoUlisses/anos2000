type MainWindowLoadingProps = {
  onCancel: () => void;
};

export function MainWindowLoading({ onCancel }: MainWindowLoadingProps) {
  return (
    <>
      <div className="d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-center my-5">
            <img src="/images/user.png" alt="User" className="border border-2 border-white" width="130" />
          </div>
          <div className="d-flex flex-column align-items-center">
            <span>Entrando...</span>
            <img src="/images/signing-in.gif" alt="MSN Signing in" width="100" />
          </div>
        </div>
        <div className="text-center" onClick={onCancel}>
          <button className="my-3 px-3 text-center" type="button">Cancelar</button>
        </div>
      </div>
      <div className="links d-flex position-absolute bottom-0 py-1">
        <span role="button" className="text-primary">Privacidade</span>
        <span role="button" className="px-1">|</span>
        <span role="button" className="text-primary">Status do servidor</span>
      </div>
    </>
  );
}
