// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api/config';

/**
 * Hop-by-hop headers that should NOT be forwarded.
 * See RFC 7230 section 6.1
 */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function filterHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lower)) {
      out[key] = value;
    }
  });
  return out;
}

async function handleProxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  if (!params?.path || params.path.length === 0) {
    return NextResponse.json({ error: 'Missing proxy path' }, { status: 400 });
  }

  // Build backend URL: join path segments and include query string
  const path = params.path.join('/');
  // Ensure no double-slash when API_BASE_URL has trailing slash
  const base = API_BASE_URL.replace(/\/$/, '');
  const search = request.nextUrl.search ?? '';
  const url = `${base}/${path}${search}`;

  try {
    console.log(`[proxy] ${method} -> ${url}`);

    // Forward headers, but filter hop-by-hop headers
    const forwardedHeaders = filterHeaders(request.headers);

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...forwardedHeaders,
        // ensure we accept json by default, backend may rely on accept header
        accept: forwardedHeaders['accept'] ?? 'application/json',
      },
      // credentials not forwarded by default - backend should validate Authorization header
    };

    // Forward the Authorization header explicitly if present (defensive)
    const auth = request.headers.get('authorization') ?? request.headers.get('Authorization');
    if (auth) (fetchOptions.headers as Record<string, string>)['Authorization'] = auth;

    // If not GET/HEAD, try to forward body
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        // NextRequest.json() will parse JSON body; next supports other body types via arrayBuffer/ formData
        // We attempt to forward the raw body where possible.
        const contentType = request.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const json = await request.json();
          fetchOptions.body = JSON.stringify(json);
          (fetchOptions.headers as Record<string, string>)['Content-Type'] =
            'application/json';
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const text = await request.text();
          fetchOptions.body = text;
          (fetchOptions.headers as Record<string, string>)['Content-Type'] =
            contentType;
        } else {
          // fallback to streaming the raw body
          const arr = await request.arrayBuffer();
          fetchOptions.body = arr;
          if (contentType) (fetchOptions.headers as Record<string, string>)['Content-Type'] = contentType;
        }
      } catch (e) {
        console.warn('[proxy] Could not read request body (no body or invalid JSON)', e);
      }
    }

    const response = await fetch(url, fetchOptions);

    // copy response headers minus hop-by-hop ones
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // If the response is JSON, return NextResponse.json so Next.js sets content-type and serializes
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: Object.fromEntries(responseHeaders.entries()),
      });
    }

    // For non-JSON responses, forward the body stream/raw buffer
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: Object.fromEntries(responseHeaders.entries()),
    });
  } catch (error: unknown) {
    console.error('[proxy] Error while proxying', { url, error });
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Proxy error',
        message,
        url,
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params, 'GET');
}
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params, 'POST');
}
export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params, 'PUT');
}
export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params, 'PATCH');
}
export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params, 'DELETE');
}
