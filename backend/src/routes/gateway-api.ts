import { Router } from 'express'
import type { Response } from 'express'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { requireStudentAuth } from '../middleware/studentAuth.js'
import {
  EducationDataError,
  getEducationCourses,
  getIntegrationStatus,
  getStudentGrades,
  getStudentTimetable,
  type EducationDataResult,
} from '../services/educationDataService.js'

const router = Router()

function sendData<T>(res: Response, result: EducationDataResult<T>) {
  res.setHeader('x-data-source', result.source)
  res.setHeader('x-data-fetched-at', result.fetchedAt)
  res.setHeader('x-data-degraded', result.degraded ? 'true' : 'false')
  sendOk(res, result.data)
}

function handleDataError(res: Response, error: unknown) {
  if (error instanceof EducationDataError) {
    sendError(res, error.message, error.statusCode)
    return
  }
  console.error('[education-data] unexpected gateway error', error)
  sendError(res, 'Education data service failed', 500)
}

router.get('/courses', async (req, res) => {
  try {
    const language = typeof req.query.language === 'string' ? req.query.language : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    sendData(res, await getEducationCourses({
      ...(language ? { language } : {}),
      ...(q ? { q } : {}),
      ...(locale ? { locale } : {}),
    }))
  } catch (error) {
    handleDataError(res, error)
  }
})

router.get('/courses/:id', async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const result = await getEducationCourses(locale ? { locale } : {})
    const course = result.data.find((item) => item.id === id)
    if (!course) {
      sendError(res, '课程不存在或已下架', 404)
      return
    }
    sendData(res, { ...result, data: course })
  } catch (error) {
    handleDataError(res, error)
  }
})

router.get('/status', requireStudentAuth, (_req, res) => {
  sendOk(res, getIntegrationStatus())
})

router.get('/timetable', requireStudentAuth, async (req, res) => {
  try {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    sendData(res, await getStudentTimetable(req.student!.studentId, locale))
  } catch (error) {
    handleDataError(res, error)
  }
})

router.get('/grades', requireStudentAuth, async (req, res) => {
  try {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    sendData(res, await getStudentGrades(req.student!.studentId, locale))
  } catch (error) {
    handleDataError(res, error)
  }
})

export default router
