export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function errorResponse(error, status = 400) {
  return json(
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error || 'Request failed.'),
    },
    { status }
  );
}
