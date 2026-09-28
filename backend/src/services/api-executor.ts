export interface ExecuteRequest {
  method: string;
  url: string;
  headers?: Record<string, string> | undefined;
  body?: unknown;
}

export interface ExecuteResult {
  status: number | null;
  responseTime: number;
  body: string;
  error?: string | null;
}

export function normalizeUrl(rawUrl: string): { url: string; error?: string } {
  let url = (rawUrl ?? "").trim();
  if (!url) {
    return { url: "", error: "URL cannot be empty" };
  }

  // If starts with / (e.g. /login)
  if (url.startsWith("/")) {
    const baseUrl = process.env.TARGET_BASE_URL || process.env.API_BASE_URL;
    if (baseUrl) {
      return { url: `${baseUrl.replace(/\/+$/, "")}${url}` };
    }
    return {
      url,
      error: `Relative URL '${url}' requires an absolute address. Please include protocol and domain (e.g., https://api.example.com${url} or http://localhost:3000${url}).`,
    };
  }

  // If missing protocol (e.g. "localhost:3000/api" or "api.example.com/users")
  if (!/^https?:\/\//i.test(url)) {
    if (/^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i.test(url)) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  try {
    new URL(url);
    return { url };
  } catch (err) {
    return {
      url,
      error: `Invalid URL '${rawUrl}': ${err instanceof Error ? err.message : "Malformed URL format"}`,
    };
  }
}

export async function executeRequest(
  request: ExecuteRequest
): Promise<ExecuteResult> {
  const startTime = Date.now();

  const { url: normalizedUrl, error: urlError } = normalizeUrl(request.url);

  if (urlError) {
    return {
      status: null,
      responseTime: 0,
      body: JSON.stringify(
        {
          error: "Invalid URL",
          message: urlError,
          rawUrl: request.url,
        },
        null,
        2
      ),
      error: urlError,
    };
  }

  const requestInit: RequestInit = {
    method: request.method,
  };

  if (request.headers) {
    requestInit.headers = request.headers;
  }

  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.body !== undefined &&
    request.body !== null
  ) {
    requestInit.body =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body);
  }

  try {
    const response = await fetch(normalizedUrl, requestInit);
    const responseTime = Date.now() - startTime;
    const body = await response.text();

    return {
      status: response.status,
      responseTime,
      body,
      error: null,
    };
  } catch (err) {
    const responseTime = Date.now() - startTime;
    let message = "Network request failed";

    if (err instanceof Error) {
      if ("cause" in err && (err.cause as Record<string, unknown>)?.code) {
        const code = (err.cause as Record<string, unknown>).code;
        if (code === "ECONNREFUSED") {
          message = `Connection refused at ${normalizedUrl}. Ensure the target server is running.`;
        } else if (code === "ENOTFOUND") {
          message = `Domain not found for ${normalizedUrl}. Check that the hostname is spelled correctly.`;
        } else {
          message = `${err.message} (${code})`;
        }
      } else {
        message = err.message;
      }
    }

    return {
      status: null,
      responseTime,
      body: JSON.stringify(
        {
          error: "Endpoint Unreachable",
          message,
          targetUrl: normalizedUrl,
        },
        null,
        2
      ),
      error: message,
    };
  }
}