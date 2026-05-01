const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

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
  const res = await fetch(`${BASE}/api/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save flashcard: ${res.status}`)
  const json = await res.json() as { data: Flashcard }
  return json.data
}

export async function fetchFlashcards(videoId?: string): Promise<Flashcard[]> {
  const url = videoId ? `${BASE}/api/flashcards?videoId=${encodeURIComponent(videoId)}` : `${BASE}/api/flashcards`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch flashcards: ${res.status}`)
  const json = await res.json() as { data: Flashcard[] }
  return json.data
}

export async function deleteFlashcard(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/flashcards/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete flashcard: ${res.status}`)
}
