export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;
  const apiPrefix = process.env.API_PREFIX || '/api';

  if (!backendUrl) {
    res.status(500).json({
      success: false,
      message: 'BACKEND_URL environment variable is not defined on the frontend Vercel project.',
    });
    return;
  }

  // Extract path from Vercel query or URL
  let pathSegments = req.query.path;
  let targetPath = '';

  if (Array.isArray(pathSegments)) {
    targetPath = pathSegments.join('/');
  } else if (typeof pathSegments === 'string') {
    targetPath = pathSegments;
  } else {
    // Fallback: strip /api from original request url
    const parsedUrl = new URL(req.url, 'http://localhost');
    targetPath = parsedUrl.pathname.replace(/^\/api\/?/, '');
  }

  // Construct target destination: e.g. https://backend.vercel.app/api/auth/me
  const cleanBackend = backendUrl.replace(/\/$/, '');
  const cleanPrefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`;
  const targetUrl = new URL(
    `${cleanBackend}${cleanPrefix}${targetPath ? `/${targetPath}` : ''}`
  );

  // Preserve incoming query params (except the internal 'path' param added by Vercel)
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (key !== 'path') {
        const val = req.query[key];
        if (Array.isArray(val)) {
          val.forEach((v) => targetUrl.searchParams.append(key, v));
        } else if (val !== undefined) {
          targetUrl.searchParams.set(key, val);
        }
      }
    });
  }

  // Forward incoming headers, keeping cookie and content-type
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    const lowerKey = key.toLowerCase();
    // Do not forward host or connection headers
    if (lowerKey !== 'host' && lowerKey !== 'connection' && lowerKey !== 'content-length') {
      headers[lowerKey] = value;
    }
  }

  // Prepare fetch options
  const fetchOptions = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  // Attach body if present and method is not GET/HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
      fetchOptions.body = req.body;
    } else {
      fetchOptions.body = JSON.stringify(req.body);
    }
  }

  try {
    const backendResponse = await fetch(targetUrl.toString(), fetchOptions);

    // Forward status code
    res.status(backendResponse.status);

    // Forward headers from backend response
    backendResponse.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      // Handle Set-Cookie separately to preserve multi-cookies
      if (lower !== 'set-cookie' && lower !== 'content-encoding' && lower !== 'content-length') {
        res.setHeader(key, val);
      }
    });

    // Forward Set-Cookie headers unmodified so the browser stores cookies on the frontend origin
    const rawSetCookies =
      typeof backendResponse.headers.getSetCookie === 'function'
        ? backendResponse.headers.getSetCookie()
        : backendResponse.headers.get('set-cookie');

    if (rawSetCookies) {
      res.setHeader('Set-Cookie', rawSetCookies);
    }

    // Pipe response body
    const buffer = await backendResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(502).json({
      success: false,
      message: 'Proxy error communicating with backend service',
      error: error.message,
    });
  }
}
