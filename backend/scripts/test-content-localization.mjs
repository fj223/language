import assert from 'node:assert/strict'
import {
  localizeCourse,
  localizeGrades,
  localizeTimetable,
  normalizeContentLocale,
  parseCourseTranslations,
} from '../dist/services/contentLocalization.js'
import { localizeLearningChapters } from '../dist/services/learningContentLocalization.js'

const baseCourse = {
  id: 'c004',
  title: '英语零基础入门',
  level: 'A1',
  schedule: '周六/周日 09:00–11:00',
  teacher: '王芳老师',
  language: '英语',
  coverUrl: null,
}

const english = localizeCourse(baseCourse, 'en')
assert.equal(english.title, 'English for Complete Beginners')
assert.equal(english.teacher, 'Wang Fang')
assert.equal(english.schedule, 'Sat/Sun 09:00–11:00')
assert.equal(english.language, '英语', 'canonical language value must remain stable for filters')
assert.equal(english.languageLabel, 'English')

const russian = localizeCourse({
  ...baseCourse,
  translations: {
    ru: {
      title: 'Авторский курс',
      teacher: 'Анна',
      schedule: 'Сб 10:00',
    },
  },
}, 'ru')
assert.equal(russian.title, 'Авторский курс', 'managed translations must override demo fallbacks')
assert.equal(russian.teacher, 'Анна')
assert.equal(russian.schedule, 'Сб 10:00')

const timetable = localizeTimetable([
  {
    dayOfWeek: 1,
    courseName: '英语口语 B2',
    startTime: '19:00',
    endTime: '21:00',
    location: '3号楼 301教室',
  },
], 'en')
assert.equal(timetable[0].courseName, 'English Speaking B2')
assert.equal(timetable[0].location, 'Building 3, Room 301')

const grades = localizeGrades([
  { courseName: '俄语入门 A1', semester: '2024秋', grade: 92, attendanceRate: 100 },
], 'ru')
assert.equal(grades[0].courseName, 'Русский для начинающих A1')
assert.equal(grades[0].semester, 'Осень 2024')

assert.equal(normalizeContentLocale('en-US'), 'en')
assert.equal(normalizeContentLocale('ru-RU'), 'ru')
assert.equal(normalizeContentLocale('unsupported'), 'zh')
assert.deepEqual(parseCourseTranslations({ en: { title: '  Title  ' }, xx: { title: 'ignored' } }), {
  en: { title: 'Title' },
})

const starterChapter = {
  title: '第一章 · 学习起步',
  description: '完成“雅思 7 分冲刺班”的核心课时、阶段作业和随堂测验。',
  lessons: [{ title: '课程导学与目标设定', summary: '了解课程结构，并写下本阶段最重要的学习目标。' }],
  assignments: [{ title: '阶段学习反思', instructions: '请用不少于 80 字总结本阶段掌握的内容、仍有疑问的地方，以及下一步行动。' }],
  quizzes: [{ title: '第一章随堂测验', description: '检查你是否完成了目标设定并掌握了本章的学习方法。' }],
}
const localizedOutline = localizeLearningChapters([starterChapter], 'en')
assert.equal(localizedOutline[0].title, 'Chapter 1 · Getting Started')
assert.equal(localizedOutline[0].lessons[0].title, 'Course Orientation and Goal Setting')
assert.equal(localizedOutline[0].assignments[0].title, 'Stage Learning Reflection')
assert.equal(localizeLearningChapters([starterChapter], 'ru')[0].quizzes[0].title, 'Проверочный тест к главе 1')

console.log('content localization contract: course, timetable, grade, outline, fallback, and override cases passed')
