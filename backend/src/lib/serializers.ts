export type SerializableResource = {
  id: string
  courseId: string
  resourceType: string
  sourceUrl: string
  title: string | null
  translations: unknown
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type SerializableCourse = {
  id: string
  title: string
  language: string
  level: string | null
  schedule: string | null
  teacher: string | null
  coverUrl: string | null
  description: string | null
  translations: unknown
  isPublished: boolean
  isArchived: boolean
  archivedAt: Date | null
  archivedBy: string | null
  createdAt: Date
  updatedAt: Date
  videoResources: SerializableResource[]
}

export function serializeResource(r: SerializableResource) {
  return {
    id: r.id,
    courseId: r.courseId,
    resource_type: r.resourceType,
    source_url: r.sourceUrl,
    title: r.title,
    translations: r.translations,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export function serializeCourse(course: SerializableCourse) {
  return {
    id: course.id,
    title: course.title,
    language: course.language,
    level: course.level,
    schedule: course.schedule,
    teacher: course.teacher,
    coverUrl: course.coverUrl,
    description: course.description,
    translations: course.translations,
    isPublished: course.isPublished,
    isArchived: course.isArchived,
    archivedAt: course.archivedAt?.toISOString() ?? null,
    archivedBy: course.archivedBy,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    resources: course.videoResources.map(serializeResource),
  }
}
