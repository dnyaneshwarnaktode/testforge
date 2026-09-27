export interface ExecuteRequest {
  method: string;
  url: string;
  headers?: Record<string, string> | undefined;
  body?: unknown;
}

export async function executeRequest(
  request: ExecuteRequest
) {
  const startTime = Date.now();

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
    requestInit.body = JSON.stringify(request.body);
  }

  const response = await fetch(request.url, requestInit);

  const responseTime = Date.now() - startTime;

  const body = await response.text();

  return {
    status: response.status,
    responseTime,
    body,
  };
}