export const getOidcAccessToken = (): string | null => {
  const oidcKey = Object.keys(sessionStorage).find((k) => k.startsWith('oidc.user:'));
  if (!oidcKey) return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(oidcKey) ?? '');
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
};