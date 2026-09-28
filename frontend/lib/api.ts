const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const hasBody =
    options?.body !== undefined &&
    options?.body !== null;

  const headers: Record<string, string> = {
    ...(hasBody
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options?.headers as Record<string, string>),
  };

  // If running in browser and no Authorization header is manually set, auto-inject Clerk session token
  if (typeof window !== "undefined" && !headers["Authorization"] && !headers["authorization"]) {
    try {
      if (window.Clerk?.session) {
        const token = await window.Clerk.session.getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.warn("Could not retrieve Clerk session token:", err);
    }
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        data.message ||
        "Something went wrong"
    );
  }

  return data;
}
