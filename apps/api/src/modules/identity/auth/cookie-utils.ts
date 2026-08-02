type CookieOptions = {
  httpOnly?: boolean;
  maxAgeSeconds?: number;
  path: string;
  sameSite: "Lax" | "Strict";
  secure: boolean;
};

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (cookieHeader === undefined || cookieHeader.length === 0) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = part.trim().split("=");
    if (rawName === undefined || rawName.length === 0) {
      continue;
    }

    cookies[rawName] = decodeURIComponent(rawValueParts.join("="));
  }

  return cookies;
}

export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`
  ];

  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${String(options.maxAgeSeconds)}`);
  }

  if (options.httpOnly === true) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function serializeExpiredCookie(name: string, path: string, secure: boolean): string {
  const parts = [
    `${name}=`,
    `Path=${path}`,
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
