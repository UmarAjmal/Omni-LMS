/**
 * app/api/[...path]/route.ts
 *
 * Catch-all proxy — forwards ANY /api/* request from the Next.js frontend
 * to the Express backend server, preserving method, body, and query string.
 *
 * Why this exists:
 *   The deployed Express server on Render sometimes lags behind the latest
 *   commit. When the frontend calls a route that doesn't exist yet on the
 *   deployed server, Render returns an HTML 404 page → the browser gets
 *   "<!DOCTYPE html>" instead of JSON → SyntaxError: Unexpected token '<'
 *
 *   By routing through Next.js API routes we always get a JSON response
 *   (either the real data, or a structured error object), so the UI can
 *   display a meaningful message instead of crashing.
 */

import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Reconstruct the full backend URL including query string
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const backendUrl = `${BACKEND}/api/${path.join("/")}${qs ? `?${qs}` : ""}`;

  console.log(`[proxy] Incoming request for ${backendUrl}`);
  console.log(`[proxy] Authorization header:`, request.headers.get("authorization"));

  // Read request body for mutating methods
  let body: string | undefined;
  const method = request.method;
  if (!["GET", "HEAD", "DELETE"].includes(method)) {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(backendUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Forward the Authorization header if present
        ...(request.headers.get("authorization")
          ? { Authorization: request.headers.get("authorization")! }
          : {}),
      },
      ...(body ? { body } : {}),
    });

    // If the upstream returns non-JSON (HTML error page from Render 404),
    // synthesise a clean JSON error so the frontend never sees "<DOCTYPE"
    const contentType = upstream.headers.get("content-type") || "";
    
    // Forward images and binaries natively
    if (contentType.startsWith("image/") || contentType.startsWith("application/octet-stream")) {
      const buffer = await upstream.arrayBuffer();
      return new NextResponse(buffer, {
        status: upstream.status,
        headers: { "Content-Type": contentType },
      });
    }

    if (!contentType.includes("application/json")) {
      const text = await upstream.text();
      console.error(
        `[proxy] Backend returned non-JSON for ${method} ${backendUrl} ` +
          `(HTTP ${upstream.status}): ${text.slice(0, 200)}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Backend route not found or server error (HTTP ${upstream.status}). ` +
            `Path: /api/${path.join("/")}`,
        },
        { status: upstream.status === 200 ? 502 : upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[proxy] Fetch error for ${backendUrl}: ${message}`);

    // If local backend (localhost) is offline, attempt fallback to production backend
    if (BACKEND.includes("localhost")) {
      const fallbackUrl = `https://omnilearn-lms.onrender.com/api/${path.join("/")}${qs ? `?${qs}` : ""}`;
      console.log(`[proxy] Local backend unreachable. Falling back to production backend: ${fallbackUrl}`);
      try {
        const fallbackUpstream = await fetch(fallbackUrl, {
          method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(request.headers.get("authorization")
              ? { Authorization: request.headers.get("authorization")! }
              : {}),
          },
          ...(body ? { body } : {}),
        });

        const contentType = fallbackUpstream.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const fallbackData = await fallbackUpstream.json();
          return NextResponse.json(fallbackData, { status: fallbackUpstream.status });
        }
      } catch (fallbackErr: unknown) {
        console.error(`[proxy] Fallback backend fetch error:`, fallbackErr);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `Backend server at ${BACKEND} is unreachable. Please start the server using 'npm run dev' inside the server directory. Details: ${message}`,
      },
      { status: 502 }
    );
  }
}

// Export all HTTP methods — Next.js App Router requires explicit exports
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
