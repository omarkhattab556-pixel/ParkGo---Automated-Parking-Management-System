import api from './axios';

export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  text: string;
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
  send: async (message: string, history: ChatTurn[]): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/chat', { message, history });
    return data;
  },
};

export default chatApi;
