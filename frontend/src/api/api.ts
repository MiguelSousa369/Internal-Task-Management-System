const BASE_URL = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

const headers = (auth = false): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const handle = async (res: Response) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
  }).then(handle);

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getUsers = () =>
  fetch(`${BASE_URL}/users`, { headers: headers(true) }).then(handle);

export const createUser = (data: object) =>
  fetch(`${BASE_URL}/users`, {
    method: 'POST', headers: headers(true), body: JSON.stringify(data),
  }).then(handle);

export const updateUser = (id: number, data: object) =>
  fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT', headers: headers(true), body: JSON.stringify(data),
  }).then(handle);

export const deleteUser = (id: number) =>
  fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE', headers: headers(true),
  }).then(handle);

// ── TASKS ─────────────────────────────────────────────────────────────────────
export const getTasks = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetch(`${BASE_URL}/tasks${qs}`, { headers: headers(true) }).then(handle);
};

export const getTask = (id: number) =>
  fetch(`${BASE_URL}/tasks/${id}`, { headers: headers(true) }).then(handle);

export const createTask = (data: object) =>
  fetch(`${BASE_URL}/tasks`, {
    method: 'POST', headers: headers(true), body: JSON.stringify(data),
  }).then(handle);

export const updateTask = (id: number, data: object) =>
  fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT', headers: headers(true), body: JSON.stringify(data),
  }).then(handle);

export const startTask = (id: number) =>
  fetch(`${BASE_URL}/tasks/${id}/start`, {
    method: 'PUT', headers: headers(true),
  }).then(handle);

export const releaseTask = (id: number) =>
  fetch(`${BASE_URL}/tasks/${id}/release`, {
    method: 'PUT', headers: headers(true),
  }).then(handle);

export const updateTaskPriority = (id: number, prioridade: string) =>
  fetch(`${BASE_URL}/tasks/${id}/priority`, {
    method: 'PUT', headers: headers(true), body: JSON.stringify({ prioridade }),
  }).then(handle);

export const completeTask = (id: number) =>
  fetch(`${BASE_URL}/tasks/${id}/complete`, {
    method: 'PUT', headers: headers(true),
  }).then(handle);

export const reopenTask = (id: number) =>
  fetch(`${BASE_URL}/tasks/${id}/reopen`, {
    method: 'PUT', headers: headers(true),
  }).then(handle);

export const deleteTask = (id: number) =>
  fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE', headers: headers(true),
  }).then(handle);

// ── COMMENTS ──────────────────────────────────────────────────────────────────
export const getComments = (taskId: number) =>
  fetch(`${BASE_URL}/tasks/${taskId}/comments`, { headers: headers(true) }).then(handle);

export const addComment = (taskId: number, comentario: string) =>
  fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
    method: 'POST', headers: headers(true), body: JSON.stringify({ comentario }),
  }).then(handle);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const getDashboard = () =>
  fetch(`${BASE_URL}/dashboard`, { headers: headers(true) }).then(handle);

export const getStats = () =>
  fetch(`${BASE_URL}/stats`, { headers: headers(true) }).then(handle);
