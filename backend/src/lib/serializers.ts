export type SerializableResource = {
  id: string
  courseId: string
  resourceType: string
  sourceUrl: string
  title: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type SerializableCourse = {
  id: string
  title: string
  coverUrl: string | null
  description: string | null
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
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export function serializeCourse(course: SerializableCourse) {
  return {
    id: course.id,
    title: course.title,
    coverUrl: course.coverUrl,
    description: course.description,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    resources: course.videoResources.map(serializeResource),
  }
}
