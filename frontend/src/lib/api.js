import axios from 'axios';
import { cacheData, enqueue, getCachedData, flushQueue, isOnline } from './offline';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const localApiHost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  ? window.location.hostname
  : 'localhost';

export const api = axios.create({
  baseURL: configuredApiUrl || `http://${localApiHost}:5000/api/v1`,
  timeout: 30000,
});

const isNetworkError = error => !error.response || !isOnline();
const cacheKey = (url, params) => `${url}${params ? `?${new URLSearchParams(params).toString()}` : ''}`;

function updateCachedRows(url, operation, payload, id) {
  const key = url.split('?')[0];
  const cached = getCachedData(key);
  if (!cached) return;
  const rows = Array.isArray(cached) ? cached : (cached.data || []);
  let next = rows;
  if (operation === 'POST') next = [{ ...payload, id }, ...rows];
  if (operation === 'PUT') next = rows.map(row => String(row.id) === String(id) ? { ...row, ...payload } : row);
  if (operation === 'DELETE') next = rows.filter(row => String(row.id) !== String(id));
  cacheData(key, Array.isArray(cached) ? next : { ...cached, data: next }, 86400000);
}

async function queueMutation(method, url, body) {
  const match = url.match(/^(.+?)(?:\/(\d+))?$/);
  const resource = match?.[1] || url;
  const id = match?.[2];
  const localId = id || Date.now();
  enqueue({ method, url, body, entity: resource });
  updateCachedRows(resource, method, body || {}, localId);
  return { message: 'Saved offline and queued for sync', id: localId, offline: true };
}

api.interceptors.request.use(c => {
  const t = localStorage.getItem('academypro_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401) {
      localStorage.removeItem('academypro_token');
      localStorage.removeItem('academypro_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(e);
  }
);

export async function get(u, p) {
  const key = cacheKey(u, p);
  try {
    const data = (await api.get(u, { params: p })).data;
    cacheData(key, data, 86400000);
    return data;
  } catch (error) {
    const cached = getCachedData(key, true);
    if (cached !== null && isNetworkError(error)) return cached;
    throw error;
  }
}

export async function post(u, d) {
  try { return (await api.post(u, d)).data; }
  catch (error) { if (isNetworkError(error)) return queueMutation('POST', u, d); throw error; }
}

export async function put(u, d) {
  try { return (await api.put(u, d)).data; }
  catch (error) { if (isNetworkError(error)) return queueMutation('PUT', u, d); throw error; }
}

export async function del(u) {
  try { return (await api.delete(u)).data; }
  catch (error) { if (isNetworkError(error)) return queueMutation('DELETE', u); throw error; }
}

window.addEventListener('online', () => { flushQueue().catch(() => {}); });
