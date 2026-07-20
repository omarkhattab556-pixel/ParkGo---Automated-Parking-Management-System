import api from './axios';

export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  text: string;
  created_at?: string;
}

/** Structured action the assistant proposes; the UI renders a confirm card. */
export type ActionSuggestion =
  | { type: 'reservation'; params: { reservation_start: string } }
  | { type: 'cancel_reservation'; params: { reservation_id: number } }
  | {
      type: 'extend_parking';
      params: { parking_code: number; extra_minutes: number };
    };

export interface ChatResponse {
  reply: string;
  actionSuggestion: ActionSuggestion | null;
}

export const chatApi = {
  /**
   * Send a message. History is NOT sent — the server loads it from the database
   * scoped to the signed-in user and their role.
   */
  send: async (message: string): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/chat', { message });
    return data;
  },

  /** The signed-in user's own stored conversation. */
  history: async (): Promise<ChatTurn[]> => {
    const { data } = await api.get<ChatTurn[]>('/chat/history');
    return data;
  },

  /** Clear only the signed-in user's own conversation. */
  clear: async (): Promise<void> => {
    await api.delete('/chat/history');
  },
};

export default chatApi;
