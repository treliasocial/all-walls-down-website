const currentHost = typeof window === "undefined" ? "localhost" : window.location.hostname;
const currentProtocol = typeof window === "undefined" ? "http:" : window.location.protocol;

export const apiBaseUrl = import.meta.env.VITE_AWD_API_URL || `${currentProtocol}//${currentHost}:8787`;
export const portalUrl = import.meta.env.VITE_PORTAL_URL || "/portal";

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Portal server is not reachable. Make sure the AWD API is running, then try again.");
  }
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export function goToPortal() {
  window.location.href = portalUrl;
}
