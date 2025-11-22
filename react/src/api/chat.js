import axios from './axios';

export async function fetchChatMessages() {
  const response = await axios.get('/api/chat/messages/');
  return response.data;
}

export async function sendChatMessage(text) {
  const response = await axios.post('/api/chat/messages/', {
    text,
  });
  return response.data;
}
