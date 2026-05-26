import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'

const router = Router()

// ============================================================
// POST /flashcards — create a flashcard
// ============================================================

router.post('/flashcards', async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const videoId = typeof body.videoId === 'string' ? body.videoId.trim() : ''
    const term = typeof body.term === 'string' ? body.term.trim() : ''
    const definition = typeof body.definition === 'string' ? body.definition.trim() : ''
    const example = typeof body.example === 'string' ? body.example.trim() || null : null
    const userId = typeof body.userId === 'string' ? body.userId.trim() || null : null

    if (!videoId) { sendError(res, 'videoId is required', 400); return }
    if (!term) { sendError(res, 'term is required', 400); return }
    if (!definition) { sendError(res, 'definition is required', 400); return }

    const card = await prisma.flashcard.create({
      data: { videoId, term, definition, example, userId },
    })

    sendOk(res, card, 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// ============================================================
// GET /flashcards — list flashcards (optional filters)
//   ?videoId=  — filter by video
//   ?userId=   — filter by user
//   ?search=   — fuzzy search by term
// ============================================================

router.get('/flashcards', async (req, res) => {
  try {
    const videoId = typeof req.query.videoId === 'string' ? req.query.videoId.trim() : ''
    const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : ''
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''

    const where: Record<string, unknown> = {}
    if (videoId) where.videoId = videoId
    if (userId) where.userId = userId
    if (search) {
      where.term = { contains: search }
    }

    const cards = await prisma.flashcard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    sendOk(res, cards)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// ============================================================
// DELETE /flashcards/:id — delete a flashcard
// ============================================================

router.delete('/flashcards/:id', async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    if (!id) { sendError(res, 'id is required', 400); return }
    await prisma.flashcard.delete({ where: { id } })
    sendOk(res, { id })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

export default router
