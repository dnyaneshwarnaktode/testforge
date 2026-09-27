const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "proxy-authorization",
  "token",
  "x-auth-token",
];

export function redactHeaders(
  headers: Record<string, unknown>
): Record<string, unknown> {
  const result = {
    ...headers,
  };

  for (const key of Object.keys(result)) {
    if (
      SENSITIVE_HEADERS.includes(
        key.toLowerCase()
      )
    ) {
      result[key] = "[REDACTED]";
    }
  }

  return result;
}
