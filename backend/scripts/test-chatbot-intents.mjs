import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
  detectAssistantIntent,
  issueAssistantResponseId,
  verifyAssistantResponseId,
} from '../dist/controllers/enhancedChatbotController.js'

const cases = [
  ['查一下我的课表', 'TIMETABLE'],
  ['show my timetable', 'TIMETABLE'],
  ['查看我的成绩和出勤', 'GRADES'],
  ['check my grade', 'GRADES'],
  ['推荐适合零基础的英语课程', 'COURSE_DISCOVERY'],
  ['recommend a course for me', 'COURSE_DISCOVERY'],
  ['帮我制定一周日语学习计划', 'STUDY_PLAN'],
  ['如何提高英语口语', 'STUDY_PLAN'],
  ['体检和保险需要什么材料', 'SCHOOL_POLICY'],
  ['校园里有哪些社团', 'SCHOOL_POLICY'],
  ['把这句话翻译成俄语', 'TRANSLATE'],
  ['translate this sentence into Chinese', 'TRANSLATE'],
  ['Составь план занятий на неделю', 'STUDY_PLAN'],
  ['Создай план подготовки к экзамену', 'STUDY_PLAN'],
  ['Покажи моё расписание на неделю', 'TIMETABLE'],
  ['你好', 'GENERAL'],
  ['我还有一个问题', 'GENERAL'],
]

for (const [message, expected] of cases) {
  assert.equal(
    detectAssistantIntent(message),
    expected,
    `Expected "${message}" to resolve to ${expected}`,
  )
}

const responseId = issueAssistantResponseId()
const replacement = responseId.endsWith('x') ? 'y' : 'x'
const tamperedResponseId = `${responseId.slice(0, -1)}${replacement}`
assert.equal(verifyAssistantResponseId(responseId), true, 'issued feedback response id must verify')
assert.equal(verifyAssistantResponseId(tamperedResponseId), false, 'tampered feedback response id must be rejected')
assert.equal(verifyAssistantResponseId(randomUUID()), false, 'unsigned feedback response id must be rejected')

console.log(`chatbot intent contract: ${cases.length} cases and signed feedback ids passed`)
