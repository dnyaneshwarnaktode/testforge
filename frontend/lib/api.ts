"use client";

import { useAuth } from "@clerk/nextjs";

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
  options?: RequestInit,
  token?: string | null
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

  // 1. Explicit token passed
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // 2. Auto-inject Clerk session token from window.Clerk if available
  else if (
    typeof window !== "undefined" &&
    !headers["Authorization"] &&
    !headers["authorization"]
  ) {
    try {
      if (window.Clerk?.session) {
        const sessionToken = await window.Clerk.session.getToken();
        if (sessionToken) {
          headers["Authorization"] = `Bearer ${sessionToken}`;
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

/**
 * Hook to provide authenticated API fetch calls inside React components
 */
export function useApiClient() {
  const { getToken, isSignedIn, isLoaded, userId } = useAuth();

  const fetchWithAuth = async <T>(
    path: string,
    options?: RequestInit
  ): Promise<T> => {
    let token: string | null = null;
    if (isSignedIn) {
      token = await getToken();
    }
    return apiFetch<T>(path, options, token);
  };

  return {
    fetch: fetchWithAuth,
    isSignedIn,
    isLoaded,
    userId,
  };
}
