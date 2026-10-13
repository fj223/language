import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { requireStudentAuth } from '../middleware/studentAuth.js'

const router = Router()

// ============================================================
// POST /flashcards — create a flashcard
// ============================================================

router.post('/flashcards', requireStudentAuth, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const videoId = typeof body.videoId === 'string' ? body.videoId.trim() : ''
    const term = typeof body.term === 'string' ? body.term.trim() : ''
    const definition = typeof body.definition === 'string' ? body.definition.trim() : ''
    const example = typeof body.example === 'string' ? body.example.trim() || null : null

    if (!videoId) { sendError(res, 'videoId is required', 400); return }
    if (!term) { sendError(res, 'term is required', 400); return }
    if (!definition) { sendError(res, 'definition is required', 400); return }
    if (videoId.length > 191) { sendError(res, 'videoId is too long', 400); return }
    if (term.length > 500) { sendError(res, 'term must not exceed 500 characters', 400); return }
    if (definition.length > 5000) { sendError(res, 'definition must not exceed 5000 characters', 400); return }
    if (example && example.length > 5000) { sendError(res, 'example must not exceed 5000 characters', 400); return }

    const card = await prisma.flashcard.create({
      data: { videoId, term, definition, example, userId: req.student!.studentId },
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

router.get('/flashcards', requireStudentAuth, async (req, res) => {
  try {
    const videoId = typeof req.query.videoId === 'string' ? req.query.videoId.trim() : ''
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''

    const where: Prisma.FlashcardWhereInput = { userId: req.student!.studentId }
    if (videoId) where.videoId = videoId
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

router.delete('/flashcards/:id', requireStudentAuth, async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    if (!id) { sendError(res, 'id is required', 400); return }
    const result = await prisma.flashcard.deleteMany({
      where: { id, userId: req.student!.studentId },
    })
    if (result.count === 0) {
      sendError(res, 'flashcard not found', 404)
      return
    }
    sendOk(res, { id })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

export default router
