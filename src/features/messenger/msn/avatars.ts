export const defaultMsnAvatar = "/msn/images/user.png";

export const msnAvatarOptions = [
  "/msn/images/avatars/cachorro.png",
  "/msn/images/avatars/doguinho.png",
  "/msn/images/avatars/foguete.png",
  "/msn/images/avatars/jb.png",
  "/msn/images/avatars/kelly.png",
  "/msn/images/avatars/key.png",
  "/msn/images/avatars/nhe.png",
  "/msn/images/avatars/nisin.png",
  "/msn/images/avatars/pato.png",
  "/msn/images/avatars/praia.png",
  "/msn/images/avatars/tapa.png",
  "/msn/images/avatars/ui.png",
  "/msn/images/avatars/xadrez.png",
] as const;

export function normalizeMsnAvatar(avatar: string | undefined | null) {
  if (!avatar) {
    return defaultMsnAvatar;
  }

  if (avatar === defaultMsnAvatar || msnAvatarOptions.includes(avatar as (typeof msnAvatarOptions)[number])) {
    return avatar;
  }

  return defaultMsnAvatar;
}
