const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong"
    );
  }

  return data;
}
