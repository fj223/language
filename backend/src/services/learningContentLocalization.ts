import type { ContentLocale } from './contentLocalization.js'

type TranslationPair = Record<'en' | 'ru', string>

const STARTER_CONTENT_TRANSLATIONS: Record<string, TranslationPair> = {
  '第一章 · 学习起步': { en: 'Chapter 1 · Getting Started', ru: 'Глава 1 · Начало обучения' },
  '课程导学与目标设定': { en: 'Course Orientation and Goal Setting', ru: 'Введение в курс и постановка целей' },
  '了解课程结构，并写下本阶段最重要的学习目标。': {
    en: 'Review the course structure and write down your most important goal for this stage.',
    ru: 'Изучите структуру курса и запишите главную цель этого этапа.',
  },
  '核心知识精讲': { en: 'Core Concepts in Depth', ru: 'Подробный разбор ключевых знаний' },
  '完成本阶段核心知识学习，整理三个关键要点。': {
    en: 'Study the core concepts for this stage and summarize three key takeaways.',
    ru: 'Изучите ключевые материалы этапа и сформулируйте три главных вывода.',
  },
  '阶段学习反思': { en: 'Stage Learning Reflection', ru: 'Рефлексия по итогам этапа' },
  '请用不少于 80 字总结本阶段掌握的内容、仍有疑问的地方，以及下一步行动。': {
    en: 'In at least 80 words, summarize what you learned, what remains unclear, and your next action.',
    ru: 'Не менее чем в 80 словах опишите изученное, оставшиеся вопросы и следующий шаг.',
  },
  '第一章随堂测验': { en: 'Chapter 1 Checkpoint Quiz', ru: 'Проверочный тест к главе 1' },
  '检查你是否完成了目标设定并掌握了本章的学习方法。': {
    en: 'Check whether you have set a clear goal and understood the learning method for this chapter.',
    ru: 'Проверьте, поставили ли вы цель и освоили ли метод обучения этой главы.',
  },
  '开始一个学习阶段时，最有效的第一步是什么？': {
    en: 'What is the most effective first step when starting a learning stage?',
    ru: 'Какой первый шаг наиболее эффективен в начале учебного этапа?',
  },
  '直接跳到最后一课': { en: 'Skip directly to the final lesson', ru: 'Сразу перейти к последнему уроку' },
  '设定明确且可检查的目标': { en: 'Set a clear and measurable goal', ru: 'Поставить ясную и проверяемую цель' },
  '只收藏资料不学习': { en: 'Save materials without studying', ru: 'Только сохранять материалы, не изучая их' },
  '等老师提醒': { en: 'Wait for the teacher to remind you', ru: 'Ждать напоминания преподавателя' },
  '明确、可检查的目标能帮助你安排学习并判断是否取得进展。': {
    en: 'A clear, measurable goal helps you plan your study and assess progress.',
    ru: 'Ясная и проверяемая цель помогает планировать обучение и оценивать прогресс.',
  },
  '完成课时后，哪种行动最有利于巩固学习？': {
    en: 'Which action best reinforces learning after a lesson?',
    ru: 'Какое действие лучше всего закрепляет материал после урока?',
  },
  '立即忘记内容': { en: 'Immediately forget the content', ru: 'Сразу забыть материал' },
  '只看进度数字': { en: 'Only look at the progress number', ru: 'Смотреть только на процент прогресса' },
  '总结要点并完成练习': { en: 'Summarize key points and complete practice', ru: 'Подвести итоги и выполнить упражнение' },
  '反复刷新页面': { en: 'Repeatedly refresh the page', ru: 'Постоянно обновлять страницу' },
  '主动总结与练习比被动浏览更能形成长期记忆。': {
    en: 'Active summarization and practice build long-term memory better than passive browsing.',
    ru: 'Активное повторение и практика лучше формируют долговременную память, чем пассивный просмотр.',
  },
}

function localizeDescription(value: string, locale: ContentLocale) {
  if (locale === 'zh') return value
  if (/^完成“.+”的核心课时、阶段作业和随堂测验。$/.test(value)) {
    return locale === 'en'
      ? 'Complete the core lessons, stage assignment, and checkpoint quiz for this course.'
      : 'Пройдите основные уроки, этапное задание и проверочный тест этого курса.'
  }
  return STARTER_CONTENT_TRANSLATIONS[value]?.[locale] ?? value
}

export function localizeLearningText(value: string | null, locale: ContentLocale) {
  if (!value || locale === 'zh') return value
  return localizeDescription(value, locale)
}

type LocalizableQuestion = {
  prompt: string
  options: unknown
  explanation?: string | null
}

type LocalizableQuiz = {
  title: string
  description: string | null
  questions?: LocalizableQuestion[]
}

type LocalizableChapter = {
  title: string
  description: string | null
  lessons: Array<{ title: string; summary: string | null }>
  assignments: Array<{ title: string; instructions: string }>
  quizzes: LocalizableQuiz[]
}

export function localizeLearningChapters<T extends LocalizableChapter>(chapters: T[], locale: ContentLocale): T[] {
  if (locale === 'zh') return chapters
  return chapters.map((chapter) => ({
    ...chapter,
    title: localizeLearningText(chapter.title, locale) ?? chapter.title,
    description: localizeLearningText(chapter.description, locale),
    lessons: chapter.lessons.map((lesson) => ({
      ...lesson,
      title: localizeLearningText(lesson.title, locale) ?? lesson.title,
      summary: localizeLearningText(lesson.summary, locale),
    })),
    assignments: chapter.assignments.map((assignment) => ({
      ...assignment,
      title: localizeLearningText(assignment.title, locale) ?? assignment.title,
      instructions: localizeLearningText(assignment.instructions, locale) ?? assignment.instructions,
    })),
    quizzes: chapter.quizzes.map((quiz) => ({
      ...quiz,
      title: localizeLearningText(quiz.title, locale) ?? quiz.title,
      description: localizeLearningText(quiz.description, locale),
      ...(quiz.questions
        ? {
            questions: quiz.questions.map((question) => ({
              ...question,
              prompt: localizeLearningText(question.prompt, locale) ?? question.prompt,
              options: Array.isArray(question.options)
                ? question.options.map((option) => typeof option === 'string'
                    ? localizeLearningText(option, locale) ?? option
                    : option)
                : question.options,
              ...('explanation' in question
                ? { explanation: localizeLearningText(question.explanation ?? null, locale) }
                : {}),
            })),
          }
        : {}),
    })),
  })) as T[]
}
