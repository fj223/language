import { http } from './http'

export interface Flashcard {
  id: string
  videoId: string
  userId?: string | null
  term: string
  definition: string
  example?: string | null
  createdAt: string
}

export async function createFlashcard(data: Omit<Flashcard, 'id' | 'createdAt'>): Promise<Flashcard> {
  const res = await http.post<{ ok: boolean; data: Flashcard }>('/api/flashcards', data)
  if (!res.data.ok || !res.data.data) throw new Error('Failed to save flashcard')
  return res.data.data
}

export async function fetchFlashcards(videoId?: string): Promise<Flashcard[]> {
  const params: Record<string, string> = {}
  if (videoId) params.videoId = videoId
  const res = await http.get<{ ok: boolean; data: Flashcard[] }>('/api/flashcards', { params })
  if (!res.data.ok || !res.data.data) throw new Error('Failed to fetch flashcards')
  return res.data.data
}

export async function deleteFlashcard(id: string): Promise<void> {
  const res = await http.delete<{ ok: boolean; data: unknown }>(`/api/flashcards/${id}`)
  if (!res.data.ok) throw new Error(`Failed to delete flashcard`)
}

// ============================================================
// Flashcard extraction (non-streaming AI endpoint)
// ============================================================

export interface FlashcardExtract {
  term: string
  definition: string
  example: string
}

export async function extractFlashcardContent(content: string): Promise<FlashcardExtract> {
  const { data } = await http.post<{ ok: boolean; data: FlashcardExtract }>(
    '/api/chatbot/flashcard',
    { content },
    { timeout: 45_000 }, // AI 调用最多 30s，预留余量
  )
  if (!data.ok || !data.data) throw new Error('Flashcard extraction failed')
  return data.data
}
