export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;
  const apiPrefix = process.env.API_PREFIX || "/api";

  if (!backendUrl) {
    res.status(500).json({
      success: false,
      message:
        "BACKEND_URL environment variable is not defined on the frontend Vercel project.",
    });
    return;
  }

  // --- Parse the incoming request path ---
  // NOTE: If Vercel rewrites /api/* to this function, req.url should still
  // contain the original path (e.g. /api/auth/login). If you observe it is
  // rewritten to /api/proxy/..., change the strip regex below to match.
  const parsedUrl = new URL(req.url, "http://localhost");
  const subPath = parsedUrl.pathname.replace(/^\/api/, "");

  const cleanBackend = backendUrl.replace(/\/$/, "");
  const cleanPrefix = apiPrefix.startsWith("/") ? apiPrefix : `/${apiPrefix}`;
  const targetUrl = new URL(`${cleanBackend}${cleanPrefix}${subPath}`);

  // Carry query string verbatim (avoids duplicating params like OAuth code/state)
  targetUrl.search = parsedUrl.search;

  // --- Forward incoming headers (drop hop-by-hop / host / length) ---
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
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
  headers["x-forwarded-host"] =
    req.headers["x-forwarded-host"] || req.headers.host;
  headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] || "https";

  // --- Prepare fetch ---
  const fetchOptions = {
    method: req.method,
    headers,
    redirect: "manual", // we forward 3xx (OAuth redirects) ourselves
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = req.body;
    if (body !== undefined && body !== null) {
      fetchOptions.body =
        typeof body === "string" || Buffer.isBuffer(body)
          ? body
          : JSON.stringify(body);
    }
  }

  try {
    const backendResponse = await fetch(targetUrl.toString(), fetchOptions);

    // --- Copy status ---
    res.status(backendResponse.status);

    // --- Copy response headers, skipping hop-by-hop + cookies (handled below) ---
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
      res.setHeader(key, val);
    });

    // --- Rewrite Set-Cookie to bind to the FRONTEND origin ---
    // Normalize to an array (works across Vercel runtimes).
    let setCookies = [];
    if (typeof backendResponse.headers.getSetCookie === "function") {
      setCookies = backendResponse.headers.getSetCookie();
    } else {
      const raw = backendResponse.headers.get("set-cookie");
      if (raw) setCookies = [raw];
    }

    if (setCookies.length > 0) {
      const rewritten = setCookies.map((c) => {
        let out = c;
        // Remove Domain so the cookie binds to the frontend host (the proxy origin).
        out = out.replace(/;\s*Domain=[^;]+/gi, "");
        // Ensure Secure is present (Vercel is HTTPS). Avoid duplicating it.
        if (!/;\s*Secure/i.test(out)) {
          out += "; Secure";
        }
        // Ensure SameSite=Lax if not set (safe for same-origin proxy).
        if (!/;\s*SameSite=/i.test(out)) {
          out += "; SameSite=Lax";
        }
        return out;
      });
      res.setHeader("Set-Cookie", rewritten);
    }

    // --- Send body ---
    const buffer = await backendResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(502).json({
      success: false,
      message: "Proxy error communicating with backend service",
      error: error.message,
    });
  }
}
