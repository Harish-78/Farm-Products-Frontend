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
  targetUrl.search = parsedUrl.search;

  // --- Forward incoming headers (drop hop-by-hop / host / length) ---
  const headers = new Headers();
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
    headers.set(key, value);
  }

  // Tell the backend the public origin so OAuth callback/redirect URLs are
  // built against the FRONTEND host, not the backend host.
  headers.set("x-forwarded-host", parsedUrl.host);
  headers.set("x-forwarded-proto", "https");

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

    // --- Build response headers, skipping hop-by-hop + cookies (handled below) ---
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
    // Cloudflare merges multiple Set-Cookie values when read via .get(),
    // so read them individually with getSetCookie() / getAll().
    let setCookies = [];
    if (typeof backendResponse.headers.getSetCookie === "function") {
      setCookies = backendResponse.headers.getSetCookie();
    } else if (typeof backendResponse.headers.getAll === "function") {
      setCookies = backendResponse.headers.getAll("Set-Cookie");
    } else {
      const raw = backendResponse.headers.get("set-cookie");
      if (raw) setCookies = [raw];
    }

    // Append each cookie individually — do NOT collapse into one header.
    for (const c of setCookies) {
      let out = c;
      // Remove Domain so the cookie binds to the frontend host (the proxy origin).
      out = out.replace(/;\s*Domain=[^;]+/gi, "");
      // Ensure Path=/ so the cookie is sent on every route.
      if (!/;\s*Path=/i.test(out)) {
        out += "; Path=/";
      }
      // Ensure Secure is present (Cloudflare Pages is HTTPS).
      if (!/;\s*Secure/i.test(out)) {
        out += "; Secure";
      }
      // Ensure SameSite=Lax if not set (safe for same-origin proxy).
      if (!/;\s*SameSite=/i.test(out)) {
        out += "; SameSite=Lax";
      }
      responseHeaders.append("Set-Cookie", out);
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
