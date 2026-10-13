export type CourseTextField = 'title' | 'language' | 'schedule' | 'teacher' | 'description'

const IGNORED_CHARACTERS = /[\s\d:./\\\-\u2013\u2014_()[\]{}]/g

export function hasSuspiciousReplacementCharacters(value: string | null | undefined) {
  if (!value) return false
  const meaningfulCharacters = value.replace(IGNORED_CHARACTERS, '')
  if (!meaningfulCharacters) return false

  const replacementCount = meaningfulCharacters.match(/[?\uff1f]/g)?.length ?? 0
  return replacementCount >= 2 && replacementCount / meaningfulCharacters.length >= 0.5
}

export function findSuspiciousCourseTextField(
  fields: Partial<Record<CourseTextField, string | null>>,
): CourseTextField | null {
  for (const field of ['title', 'language', 'schedule', 'teacher', 'description'] as const) {
    if (hasSuspiciousReplacementCharacters(fields[field])) return field
  }
  return null
}
