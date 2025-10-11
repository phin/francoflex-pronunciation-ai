/**
 * API client for Francoflex backend
 * Connects to Netlify serverless functions
 */

import { auth } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/.netlify/functions';

type SessionQuestionPayload = {
  learning: string
  native: string
  audio_url?: string | null
  status?: string
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async authorizedFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    const currentUser = auth.currentUser;

    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = new Headers(options.headers || {});

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await this.authorizedFetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.details || 'Request failed');
    }

    return response.json();
  }

  // User Preferences
  async getPreferences(userId: string) {
    return this.request(`/get-preferences?user_id=${userId}`);
  }

  async savePreferences(data: {
    user_id: string;
    learning: string;
    native: string;
    industry: string;
    job: string;
    name: string;
  }) {
    return this.request('/save-preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sessions
  async createSession(userId: string, level: string, mode: string = 'repeat') {
    return this.request('/create-session', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, level, mode }),
    });
  }

  async getSession(userId: string) {
    return this.request(`/get-session?user_id=${userId}`);
  }

  async getAllSessions(userId: string) {
    return this.request(`/get-all-sessions?user_id=${userId}`);
  }

  async getSpecificSession(userId: string, sessionId: string) {
    return this.request(`/get-specific-session?user_id=${userId}&session_id=${sessionId}`);
  }

  // Messages
  async saveMessage(data: {
    author: 'system' | 'user';
    session_id: string;
    content: string;
    audio_url?: string;
    ai_feedback?: string;
    user_id: string;
  }) {
    return this.request('/save-message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessagesFromSession(sessionId: string) {
    return this.request(`/get-messages?session_id=${sessionId}`);
  }

  // Pronunciation Analysis
  async analyzePronunciation(data: {
    audio_url: string;
    target_text: string;
    session_id: string;
    analysis_language?: string;
    native_language?: string;
  }) {
    return this.request('/analyze-pronunciation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async savePronunciationAnalysis(data: {
    user_id: string;
    level: string;
    analysis_content: unknown;
    analysis_type?: string;
  }) {
    return this.request('/save-pronunciation-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPronunciationAnalyses(userId: string, level?: string) {
    const query = level ? `?user_id=${userId}&level=${level}` : `?user_id=${userId}`;
    return this.request(`/get-pronunciation-analyses${query}`);
  }

  async getLatestPronunciationAnalysis(userId: string) {
    return this.request(`/get-latest-pronunciation-analysis?user_id=${userId}`);
  }

  // Audio
  async uploadAudio(file: File, userId: string, sessionId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    if (sessionId) formData.append('session_id', sessionId);

    const response = await this.authorizedFetch(`${this.baseUrl}/upload-audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async textToAudio(text: string, voiceType: string = 'professional_female') {
    const response = await this.authorizedFetch(`${this.baseUrl}/text-to-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_type: voiceType }),
    });

    if (!response.ok) {
      throw new Error('Text to audio conversion failed');
    }

    return response.blob();
  }

  // Questions
  async updateQuestionStatus(sessionId: string, questionIndex: number, userId: string, status: string = 'done') {
    return this.request('/update-question-status', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, question_index: questionIndex, status, user_id: userId }),
    });
  }

  async getNextQuestion(sessionId: string, userId: string) {
    return this.request(`/get-next-question?session_id=${sessionId}&user_id=${userId}`);
  }

  // AI Generation
  async generateGreeting(data: {
    user_name: string;
    learning_language: string;
    session_content: SessionQuestionPayload[];
    level: string;
  }) {
    return this.request('/generate-greeting', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async speechToText(audioUrl: string, language: string = 'fr') {
    return this.request('/speech-to-text', {
      method: 'POST',
      body: JSON.stringify({ audio_url: audioUrl, language }),
    });
  }

  async generateConversationalResponse(data: {
    user_message: string;
    session_id: string;
    learning_language: string;
    level: string;
    user_id: string;
  }) {
    return this.request('/conversational-response', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
