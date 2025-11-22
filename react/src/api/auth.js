import axios from './axios';

export async function registerMember(payload) {
  const response = await axios.post('/api/auth/register/', {
    username: payload.username,
    password: payload.password,
  });
  return response.data;
}

export async function loginMember(payload) {
  const response = await axios.post('/api/auth/login/', {
    username: payload.username,
    password: payload.password,
  });
  return response.data;
}

export async function fetchCurrentMember() {
  const response = await axios.get('/api/auth/me/');
  return response.data;
}

export async function logoutMember() {
  await axios.post('/api/auth/logout/');
}
