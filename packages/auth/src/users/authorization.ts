export function isProfileOwner(
  activeUserId: string | null | undefined,
  targetUserId: string,
): boolean {
  return activeUserId != null && activeUserId === targetUserId;
}
