// Application administration is reserved to the account explicitly designated by the owner.
// Firestore independently enforces the same identity plus the trusted UID grant.
export const administratorEmail = "getuliopedromoreirafilho@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === administratorEmail.toLowerCase();
}
