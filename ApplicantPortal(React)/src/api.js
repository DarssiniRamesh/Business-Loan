const BASE_API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

/** PUBLIC_INTERFACE
 * Login - Authenticate user with email and password.
 */
export async function login(email, password) {
  const res = await fetch(`${BASE_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || 'Login failed');
  }
  const data = await res.json();
  if (data && data.token) {
    localStorage.setItem('authToken', data.token);
  }
  return data;
}

/** PUBLIC_INTERFACE
 * Signup - Register a new user.
 */
export async function signup(name, email, password) {
  const res = await fetch(`${BASE_API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || 'Signup failed');
  }
  return await res.json();
}
