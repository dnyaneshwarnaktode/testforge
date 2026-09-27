const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

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
