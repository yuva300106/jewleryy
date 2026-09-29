/**
 * Service to interact with the n8n Chatbot Webhook
 */

export const DEFAULT_N8N_WEBHOOK_URL =
  (import.meta as any).env?.VITE_N8N_CHAT_WEBHOOK_URL ||
  'https://yuva7.app.n8n.cloud/webhook/8df5c952-9110-4460-a489-65ac77788b05/chat';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'jewelfinder_chat_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function resetSessionId(): string {
  const STORAGE_KEY = 'jewelfinder_chat_session_id';
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem(STORAGE_KEY, newSessionId);
  return newSessionId;
}

/**
 * Send a message to the n8n chatbot webhook
 */
export async function sendChatMessageToN8n(
  message: string,
  sessionId: string,
  webhookUrl: string = DEFAULT_N8N_WEBHOOK_URL
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const payload = {
      action: 'sendMessage',
      chatInput: message,
      sessionId,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();

      // n8n Chat Trigger can return { output: "..." } or { text: "..." } or { response: "..." }
      if (typeof data === 'string') return data;
      if (data.output) return String(data.output);
      if (data.text) return String(data.text);
      if (data.message) return String(data.message);
      if (data.response) return String(data.response);
      return JSON.stringify(data);
    } else {
      const text = await response.text();
      return text || 'Message received by assistant.';
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The assistant took too long to respond.');
    }
    throw error;
  }
}
