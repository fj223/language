import { prisma } from '../db/prisma.js'

export async function ensureStarterCurriculum(courseId: string, fallbackTitle = '课程学习') {
  const existing = await prisma.courseChapter.count({ where: { courseId } })
  if (existing > 0) return { created: false, chapterCount: existing }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
  })
  const resources = course?.videoResources ?? []
  const title = course?.title || fallbackTitle

  await prisma.courseChapter.create({
    data: {
      courseId,
      title: '第一章 · 学习起步',
      description: `完成“${title}”的核心课时、阶段作业和随堂测验。`,
      sortOrder: 0,
      lessons: {
        create: resources.length > 0
          ? resources.map((resource, index) => ({
              title: resource.title || `课程资源 ${index + 1}`,
              summary: index === 0 ? '从课程导学开始，建立本阶段的学习目标。' : '跟随课程资源完成本节学习。',
              contentUrl: resource.sourceUrl,
              durationMinutes: 20,
              sortOrder: index,
            }))
          : [
              { title: '课程导学与目标设定', summary: '了解课程结构，并写下本阶段最重要的学习目标。', durationMinutes: 15, sortOrder: 0 },
              { title: '核心知识精讲', summary: '完成本阶段核心知识学习，整理三个关键要点。', durationMinutes: 25, sortOrder: 1 },
            ],
      },
      assignments: {
        create: {
          title: '阶段学习反思',
          instructions: '请用不少于 80 字总结本阶段掌握的内容、仍有疑问的地方，以及下一步行动。',
          maxScore: 100,
          sortOrder: 0,
        },
      },
      quizzes: {
        create: {
          title: '第一章随堂测验',
          description: '检查你是否完成了目标设定并掌握了本章的学习方法。',
          passScore: 60,
          sortOrder: 0,
          questions: {
            create: [
              {
                prompt: '开始一个学习阶段时，最有效的第一步是什么？',
                options: ['直接跳到最后一课', '设定明确且可检查的目标', '只收藏资料不学习', '等老师提醒'],
                correctOption: 1,
                explanation: '明确、可检查的目标能帮助你安排学习并判断是否取得进展。',
                sortOrder: 0,
              },
              {
                prompt: '完成课时后，哪种行动最有利于巩固学习？',
                options: ['立即忘记内容', '只看进度数字', '总结要点并完成练习', '反复刷新页面'],
                correctOption: 2,
                explanation: '主动总结与练习比被动浏览更能形成长期记忆。',
                sortOrder: 1,
              },
            ],
          },
        },
      },
    },
  })
  return { created: true, chapterCount: 1 }
}

export async function requireApprovedEnrollment(studentId: string, courseId: string) {
  return prisma.enrollmentApplication.findFirst({
    where: { studentId, courseId, status: 'APPROVED' },
  })
}

