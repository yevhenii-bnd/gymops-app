import type { StaffIdentity } from "../../shared/api/client";

const ACCESS_TOKEN_KEY = "gymops_access_token";
const CSRF_TOKEN_KEY = "gymops_csrf_token";
const STAFF_KEY = "gymops_staff";

export type StoredSession = {
  accessToken: string;
  csrfToken: string;
  staff: StaffIdentity;
};

export function saveSession(session: StoredSession): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(CSRF_TOKEN_KEY, session.csrfToken);
  window.localStorage.setItem(STAFF_KEY, JSON.stringify(session.staff));
}

export function readSession(): StoredSession | null {
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const csrfToken = window.localStorage.getItem(CSRF_TOKEN_KEY);
  const staffJson = window.localStorage.getItem(STAFF_KEY);

  if (accessToken === null || csrfToken === null || staffJson === null) {
    return null;
  }

  try {
    const staff = JSON.parse(staffJson) as StaffIdentity;

    return { accessToken, csrfToken, staff };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(CSRF_TOKEN_KEY);
  window.localStorage.removeItem(STAFF_KEY);
}
