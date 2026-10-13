import assert from 'node:assert/strict'
import http from 'node:http'

let timetableAttempts = 0
let gradeAttempts = 0

const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json')

  if (req.url === '/students/student-1/timetable') {
    timetableAttempts += 1
    if (timetableAttempts === 1) {
      res.statusCode = 503
      res.end(JSON.stringify({ error: 'temporary failure' }))
      return
    }
    res.end(JSON.stringify([
      {
        dayOfWeek: 1,
        courseName: 'Integration Testing',
        startTime: '09:00',
        endTime: '10:30',
        location: 'Lab 1',
      },
    ]))
    return
  }

  if (req.url === '/students/student-1/grades') {
    gradeAttempts += 1
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'unauthorized' }))
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ error: 'not found' }))
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object')

process.env.EDU_DATA_PROVIDER = 'external'
process.env.EDU_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.EDU_API_TIMEOUT_MS = '1000'
process.env.EDU_API_RETRY_COUNT = '1'

try {
  const {
    EducationDataError,
    getIntegrationStatus,
    getStudentGrades,
    getStudentTimetable,
  } = await import('../dist/services/educationDataService.js')

  const timetable = await getStudentTimetable('student-1')
  assert.equal(timetable.data.length, 1)
  assert.equal(timetable.data[0].courseName, 'Integration Testing')
  assert.equal(timetableAttempts, 2, '503 response should be retried once')

  await assert.rejects(
    () => getStudentGrades('student-1'),
    (error) => error instanceof EducationDataError && error.statusCode === 502,
  )
  assert.equal(gradeAttempts, 1, '401 response must not be retried')

  const status = getIntegrationStatus()
  assert.equal(status.telemetry.requestCount, 2)
  assert.equal(status.telemetry.attemptCount, 3)
  assert.equal(status.telemetry.successCount, 1)
  assert.equal(status.telemetry.failureCount, 1)
  assert.equal(status.telemetry.retryCount, 1)
  assert.equal(status.telemetry.lastError, 'HTTP 401')

  console.log('education data integration contract: retry, no-retry and telemetry passed')
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}
