import type { GatewayCourse, GradeEntry, TimetableEntry } from './mockEducationData.js'

export type ContentLocale = 'zh' | 'en' | 'ru'

export type LocalizedCourseFields = {
  title?: string
  teacher?: string
  schedule?: string
  description?: string
}

export type CourseTranslations = Partial<Record<'en' | 'ru', LocalizedCourseFields>>

const COURSE_TRANSLATIONS: Record<string, CourseTranslations> = {
  c001: { en: { title: 'IELTS Band 7 Intensive', teacher: 'Zhang Xiaoming' }, ru: { title: 'Интенсивный курс IELTS 7', teacher: 'Чжан Сяомин' } },
  c002: { en: { title: 'Business English Elite', teacher: 'Li Wen' }, ru: { title: 'Продвинутый деловой английский', teacher: 'Ли Вэнь' } },
  c003: { en: { title: 'English Pronunciation Intensive', teacher: 'David Chen' }, ru: { title: 'Интенсив по английскому произношению', teacher: 'Дэвид Чэнь' } },
  c004: { en: { title: 'English for Complete Beginners', teacher: 'Wang Fang' }, ru: { title: 'Английский с нуля', teacher: 'Ван Фан' } },
  c005: { en: { title: 'Advanced English Writing C1', teacher: 'Dr. Chen' }, ru: { title: 'Продвинутое письмо на английском C1', teacher: 'д-р Чэнь' } },
  c006: { en: { title: 'Russian for Complete Beginners', teacher: 'Ivan Petrov' }, ru: { title: 'Русский язык с нуля', teacher: 'Иван Петров' } },
  c007: { en: { title: 'TORFL Exam Preparation', teacher: 'Natasha Ivanova' }, ru: { title: 'Подготовка к экзамену ТРКИ', teacher: 'Наташа Иванова' } },
  c008: { en: { title: 'Russian Literature and Culture', teacher: 'Ekaterina' }, ru: { title: 'Русская литература и культура', teacher: 'Екатерина' } },
  c009: { en: { title: 'French for Beginners A1', teacher: 'Marie Dupont' }, ru: { title: 'Французский для начинающих A1', teacher: 'Мари Дюпон' } },
  c010: { en: { title: 'TEF French Exam Preparation', teacher: 'Pierre Martin' }, ru: { title: 'Подготовка к экзамену TEF', teacher: 'Пьер Мартен' } },
  c011: { en: { title: 'Business Communication in French B1', teacher: 'Sophie Leblanc' }, ru: { title: 'Деловое общение на французском B1', teacher: 'Софи Леблан' } },
  c012: { en: { title: 'Japanese N5 for Beginners', teacher: 'Kenichi Tanaka' }, ru: { title: 'Японский N5 для начинающих', teacher: 'Кэнъити Танака' } },
  c013: { en: { title: 'Japanese N3 Intensive', teacher: 'Misaki Sato' }, ru: { title: 'Интенсив по японскому N3', teacher: 'Мисаки Сато' } },
  c014: { en: { title: 'Japanese N1 Elite', teacher: 'Taro Yamada' }, ru: { title: 'Продвинутый японский N1', teacher: 'Таро Ямада' } },
  c015: { en: { title: 'German A1 Foundations', teacher: 'Hans Müller' }, ru: { title: 'Основы немецкого A1', teacher: 'Ханс Мюллер' } },
  c016: { en: { title: 'German B2 Exam Intensive', teacher: 'Anna Schmidt' }, ru: { title: 'Подготовка к экзамену по немецкому B2', teacher: 'Анна Шмидт' } },
  c017: { en: { title: 'Everyday Spanish A2', teacher: 'Carlos Rodríguez' }, ru: { title: 'Разговорный испанский A2', teacher: 'Карлос Родригес' } },
  c018: { en: { title: 'Spanish DELE B1 Preparation', teacher: 'Isabel García' }, ru: { title: 'Подготовка к DELE B1', teacher: 'Исабель Гарсия' } },
  c019: { en: { title: 'Korean TOPIK I Starter', teacher: 'Kim Ji-eun' }, ru: { title: 'Корейский TOPIK I для начинающих', teacher: 'Ким Чиын' } },
  c020: { en: { title: 'Korean TOPIK II Advanced', teacher: 'Park Min-jun' }, ru: { title: 'Продвинутый корейский TOPIK II', teacher: 'Пак Минджун' } },
}

const CONTENT_TRANSLATIONS: Record<string, Record<'en' | 'ru', string>> = {
  '英语口语 B2': { en: 'English Speaking B2', ru: 'Разговорный английский B2' },
  '日语 N3 强化': { en: 'Japanese N3 Intensive', ru: 'Интенсив по японскому N3' },
  '法语入门 A1': { en: 'French for Beginners A1', ru: 'Французский для начинающих A1' },
  '法语进阶 B1': { en: 'Advanced French B1', ru: 'Продвинутый французский B1' },
  '俄语入门 A1': { en: 'Russian for Beginners A1', ru: 'Русский для начинающих A1' },
}

const LANGUAGE_LABELS: Record<string, Record<'en' | 'ru', string>> = {
  英语: { en: 'English', ru: 'Английский' },
  俄语: { en: 'Russian', ru: 'Русский' },
  法语: { en: 'French', ru: 'Французский' },
  日语: { en: 'Japanese', ru: 'Японский' },
  德语: { en: 'German', ru: 'Немецкий' },
  西班牙语: { en: 'Spanish', ru: 'Испанский' },
  韩语: { en: 'Korean', ru: 'Корейский' },
}

export function normalizeContentLocale(value: unknown): ContentLocale {
  if (typeof value !== 'string') return 'zh'
  const normalized = value.trim().toLowerCase()
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  if (normalized === 'ru' || normalized.startsWith('ru-')) return 'ru'
  return 'zh'
}

function nonEmptyText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text ? text.slice(0, maxLength) : undefined
}

export function parseCourseTranslations(value: unknown): CourseTranslations | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const source = value as Record<string, unknown>
  const result: CourseTranslations = {}
  for (const locale of ['en', 'ru'] as const) {
    const raw = source[locale]
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const fields = raw as Record<string, unknown>
    const title = nonEmptyText(fields.title, 200)
    const teacher = nonEmptyText(fields.teacher, 100)
    const schedule = nonEmptyText(fields.schedule, 200)
    const description = nonEmptyText(fields.description, 10_000)
    const localized: LocalizedCourseFields = {
      ...(title ? { title } : {}),
      ...(teacher ? { teacher } : {}),
      ...(schedule ? { schedule } : {}),
      ...(description ? { description } : {}),
    }
    if (Object.values(localized).some(Boolean)) result[locale] = localized
  }
  return Object.keys(result).length ? result : undefined
}

function translateKnown(value: string, locale: ContentLocale) {
  if (locale === 'zh') return value
  return CONTENT_TRANSLATIONS[value]?.[locale] ?? value
}

function localizeSchedule(value: string | null, locale: ContentLocale) {
  if (!value || locale === 'zh') return value
  const weekdayMap = locale === 'en'
    ? { 周一: 'Mon', 周二: 'Tue', 周三: 'Wed', 周四: 'Thu', 周五: 'Fri', 周六: 'Sat', 周日: 'Sun' }
    : { 周一: 'Пн', 周二: 'Вт', 周三: 'Ср', 周四: 'Чт', 周五: 'Пт', 周六: 'Сб', 周日: 'Вс' }
  return Object.entries(weekdayMap).reduce(
    (localized, [source, target]) => localized.replaceAll(source, target),
    value,
  )
}

function localizeLocation(value: string, locale: ContentLocale) {
  if (locale === 'zh') return value
  const match = value.match(/^(\d+)号楼\s*(\d+)教室$/)
  if (!match) return value
  return locale === 'en'
    ? `Building ${match[1]}, Room ${match[2]}`
    : `Корпус ${match[1]}, аудитория ${match[2]}`
}

function localizeSemester(value: string, locale: ContentLocale) {
  if (locale === 'zh') return value
  const match = value.match(/^(\d{4})(春|秋)$/)
  if (!match) return value
  const season = locale === 'en'
    ? (match[2] === '春' ? 'Spring' : 'Fall')
    : (match[2] === '春' ? 'Весна' : 'Осень')
  return `${season} ${match[1]}`
}

export function localizeCourse(
  course: GatewayCourse & { translations?: unknown },
  locale: ContentLocale,
): GatewayCourse {
  const translations = {
    ...(COURSE_TRANSLATIONS[course.id] ?? {}),
    ...(parseCourseTranslations(course.translations) ?? {}),
  }
  const localized = locale === 'zh' ? undefined : translations[locale]
  const { translations: _courseTranslations, resources, ...baseCourse } = course
  const localizedResources = resources?.map((resource) => {
    const resourceTranslations = parseCourseTranslations(resource.translations)
    const { translations: _resourceTranslations, ...baseResource } = resource
    return {
      ...baseResource,
      title: locale === 'zh'
        ? resource.title
        : resourceTranslations?.[locale]?.title ?? resource.title,
    }
  })
  return {
    ...baseCourse,
    title: localized?.title ?? translateKnown(course.title, locale),
    teacher: localized?.teacher ?? (course.teacher ? translateKnown(course.teacher, locale) : null),
    schedule: localized?.schedule ?? localizeSchedule(course.schedule, locale),
    description: localized?.description ?? course.description ?? null,
    languageLabel: locale === 'zh'
      ? course.language
      : LANGUAGE_LABELS[course.language]?.[locale] ?? course.language,
    ...(localizedResources ? { resources: localizedResources } : {}),
  }
}

export function localizeTimetable(entries: TimetableEntry[], locale: ContentLocale): TimetableEntry[] {
  return entries.map((entry) => ({
    ...entry,
    courseName: translateKnown(entry.courseName, locale),
    location: localizeLocation(entry.location, locale),
  }))
}

export function localizeGrades(entries: GradeEntry[], locale: ContentLocale): GradeEntry[] {
  return entries.map((entry) => ({
    ...entry,
    courseName: translateKnown(entry.courseName, locale),
    semester: localizeSemester(entry.semester, locale),
  }))
}
