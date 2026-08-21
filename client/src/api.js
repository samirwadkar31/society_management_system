const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function apiUrl() {
  return BASE;
}

export async function api(path, options = {}) {
  const token = localStorage.getItem('kutumb_token');
  const headers = { ...(options.headers || {}) };
  if (!options.body || !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(BASE + '/api' + path, { ...options, headers });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  return api('/upload', { method: 'POST', body: fd });
}
