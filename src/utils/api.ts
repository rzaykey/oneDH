// utils/api.ts
import {getSession} from './auth';

export async function apiFetch(url: string, options: any = {}) {
  const session = await getSession();
  const token = session?.token;
  if (!token) throw new Error('Token not found');

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
