/**
 * lib/apiClient.ts
 * Centralized API client wrapper that automatically attaches the JWT token
 * to every request for secure authentication.
 */

export async function apiClient(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("lms_token");
  }

  const headers: Record<string, string> = {};
  
  // Copy options.headers if they exist
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set default Content-Type to JSON if not specified and body is not FormData
  if (!headers["Content-Type"] && !headers["content-type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  const isMobile =
    process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" ||
    (typeof window !== "undefined" &&
      (window.location.protocol === "file:" ||
        (window.location.hostname === "localhost" && window.location.port === "") ||
        (window as any).Capacitor !== undefined));

  let targetUrl = url;
  if (isMobile && !url.startsWith("http://") && !url.startsWith("https://")) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://10.0.2.2:5000").replace(/\/$/, "");
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    targetUrl = `${baseUrl}${cleanPath}`;
  }

  return fetch(targetUrl, fetchOptions);
}
