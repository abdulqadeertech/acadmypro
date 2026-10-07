const QUEUE_KEY = 'academypro_sync_queue_v3';
const CACHE_KEY = 'academypro_cache_v3';
const LAST_SYNC_KEY = 'academypro_last_sync';

// Sync queue operations
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function queueCount() {
  return getQueue().length;
}

export function enqueue(op) {
  const queue = getQueue();
  queue.push({
    ...op,
    id: crypto.randomUUID?.() || `op-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    created_at: new Date().toISOString(),
    status: 'pending',
  });
  saveQueue(queue);
  return queue.length;
}

export async function flushQueue() {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queue = getQueue();
  const left = [];
  let synced = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      const token = localStorage.getItem('academypro_token');
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${base}${op.url}`, {
        method: op.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(op.headers || {}),
        },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });

      if (response.ok) {
        synced++;
      } else {
        op.attempts = (op.attempts || 0) + 1;
        op.last_error = `HTTP ${response.status}`;
        if (op.attempts < 3) left.push(op);
        else failed++;
      }
    } catch {
      op.attempts = (op.attempts || 0) + 1;
      if (op.attempts < 3) left.push(op);
      else failed++;
    }
  }

  saveQueue(left);
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  return { synced, failed, pending: left.length };
}

// Data cache operations
export function cacheData(key, data, ttl = 300000) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = { data, timestamp: Date.now(), ttl };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Cache storage is best-effort; app data should keep working if it is full.
  }
}

export function getCachedData(key, allowStale = false) {
  let cache;
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return null;
  }
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    if (allowStale) return entry.data;
    delete cache[key];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return null;
  }
  return entry.data;
}

export function getLastSyncTime() {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

// Connection status
export function isOnline() {
  return navigator.onLine;
}
