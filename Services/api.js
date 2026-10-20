const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

const TOKEN_KEY = "avemel:api-token";

export function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(
  path,
  {
    method = "GET",
    body,
    authenticated = true,
    responseType = "json",
    signal
  } = {}
) {
  if (!API_BASE_URL) {
    throw new Error("The API address is missing from .env.local.");
  }

  if (!path.startsWith("/api/")) {
    throw new Error("API paths must start with /api/.");
  }

  const headers = new Headers();
  let requestBody;

  if (authenticated) {
    const token = getToken();

    if (!token) {
      throw new Error("Please log in before continuing.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  if (body instanceof FormData) {
    // The browser generates the multipart Content-Type and boundary.
    requestBody = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: requestBody,
      signal
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "Unable to connect to the API. Check that it is running."
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    const validationMessages = errorBody?.errors
      ? Object.values(errorBody.errors).flat().join(" ")
      : null;

    const message =
      errorBody?.message ||
      validationMessages ||
      errorBody?.detail ||
      errorBody?.title ||
      `Request failed (${response.status}).`;

    if (response.status === 401) {
      clearToken();
    }

    const error = new Error(
      response.status === 401
        ? "Your login has expired. Please log in again."
        : message
    );

    error.status = response.status;
    throw error;
  }
  if (response.status === 204) {
    return null;
  }

  if (responseType === "blob") {
    return response.blob();
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `The API returned HTTP ${response.status} with an empty response for ${method} ${path}.`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `The API returned invalid JSON for ${method} ${path}.`
    );
  }
 
}