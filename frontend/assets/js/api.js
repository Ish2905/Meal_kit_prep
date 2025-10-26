// frontend/assets/js/api.js
// Centralized API client

const API_BASE_URL = (window.API_BASE_URL_OVERRIDE || 'http://localhost:3001/api');

async function apiFetch(endpoint, options = {}) {
  const resp = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data;
  try { data = await resp.json(); } catch (_) { data = {}; }
  if (!resp.ok) {
    const message = (data && (data.error || data.message)) || `Request failed: ${resp.status}`;
    throw new Error(message);
  }
  return data;
}

async function apiHealth() {
  try { return await apiFetch('/health'); } catch (e) { return { ok: false, error: e.message }; }
}
