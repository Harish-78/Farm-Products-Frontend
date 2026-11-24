// Cloudflare Pages Function — proxies /api/* to the backend
// File: functions/api/[[path]].js  (matches /api/* routes)

// Environment variable (set in Cloudflare Pages dashboard → Settings → Environment variables):
//   BACKEND_URL = https://farm-products-backend.vercel.app

export async function onRequest(context) {
  const { request, env } = context;

  const backendUrl = env.BACKEND_URL;
  if (!backendUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message:
          "BACKEND_URL environment variable is not defined on the frontend Cloudflare Pages project.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // --- Parse the incoming request path ---
  const parsedUrl = new URL(request.url);
  const subPath = parsedUrl.pathname.replace(/^\/api/, "");

  const cleanBackend = backendUrl.replace(/\/$/, "");
  const targetUrl = new URL(`${cleanBackend}/api${subPath}`);

  // Carry query string verbatim (avoids duplicating params like OAuth code/state)
  targetUrl.search = parsedUrl.search;

  // --- Forward incoming headers (drop hop-by-hop / host / length) ---
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "host" ||
      lowerKey === "connection" ||
      lowerKey === "content-length" ||
      lowerKey === "transfer-encoding"
    ) {
      continue;
    }
    headers[lowerKey] = value;
  }

  // Tell the backend the public origin so OAuth callback/redirect URLs are
  // built against the FRONTEND host, not the backend host.
  headers["x-forwarded-host"] = parsedUrl.host;
  headers["x-forwarded-proto"] = "https";

  // --- Prepare fetch ---
  const fetchOptions = {
    method: request.method,
    headers,
    redirect: "manual", // we forward 3xx (OAuth redirects) ourselves
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      fetchOptions.body = body;
    }
  }

  try {
    const backendResponse = await fetch(targetUrl.toString(), fetchOptions);

    // --- Copy response headers, skipping hop-by-hop + cookies (handled below) ---
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (
        lower === "set-cookie" ||
        lower === "content-encoding" ||
        lower === "content-length" ||
        lower === "transfer-encoding"
      ) {
        return;
      }
      responseHeaders.set(key, val);
    });

    // --- Rewrite Set-Cookie to bind to the FRONTEND origin ---
    const setCookies = [];
    const rawSetCookie = backendResponse.headers.get("set-cookie");
    if (rawSetCookie) {
      try {
        // getSetCookie() may not be available in all runtimes; fall back to header
        const cookies = backendResponse.headers.getSetCookie
          ? backendResponse.headers.getSetCookie()
          : [rawSetCookie];
        setCookies.push(...cookies);
      } catch {
        setCookies.push(rawSetCookie);
      }
    }

    if (setCookies.length > 0) {
      const rewritten = setCookies.map((c) => {
        let out = c;
        // Remove Domain so the cookie binds to the frontend host (the proxy origin).
        out = out.replace(/;\s*Domain=[^;]+/gi, "");
        // Ensure Secure is present (Cloudflare Pages is HTTPS). Avoid duplicating it.
        if (!/;\s*Secure/i.test(out)) {
          out += "; Secure";
        }
        // Ensure SameSite=Lax if not set (safe for same-origin proxy).
        if (!/;\s*SameSite=/i.test(out)) {
          out += "; SameSite=Lax";
        }
        return out;
      });
      responseHeaders.set("Set-Cookie", rewritten);
    }

    // --- Send body ---
    const buffer = await backendResponse.arrayBuffer();
    return new Response(buffer, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Proxy error communicating with backend service",
        error: error.message,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
