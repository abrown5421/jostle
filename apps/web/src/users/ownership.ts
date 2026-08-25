export function isProfileOwner(
  activeUserId: string | null | undefined,
  targetUserId: string | null | undefined,
): boolean {
  return Boolean(activeUserId) && activeUserId === targetUserId;
}
