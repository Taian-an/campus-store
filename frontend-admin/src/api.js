// Prod: same origin, mounted under the Nginx /campus-store/ prefix.
// Dev: the backend's dual-mount also serves every route at root on :4002,
// so no vite proxy is needed (CORS is already open on the API).
export const API_BASE = import.meta.env.PROD ? '/campus-store' : 'http://localhost:4002';

export async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
