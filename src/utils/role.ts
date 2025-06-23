export function isAdminHSE(
  roles: any[],
  user: any,
  activeSite: string,
): boolean {
  return !!roles.find(
    r =>
      r.code_site === activeSite &&
      r.name?.toLowerCase().includes('admin hse') &&
      r.user_id === user?.jdeno,
  );
}
