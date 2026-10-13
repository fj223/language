CREATE TABLE `CourseChapter` (
  `id` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isPublished` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `CourseChapter_courseId_sortOrder_idx`(`courseId`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CourseLesson` (
  `id` VARCHAR(191) NOT NULL,
  `chapterId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `summary` TEXT NULL,
  `contentUrl` TEXT NULL,
  `durationMinutes` INTEGER NOT NULL DEFAULT 15,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isPublished` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `CourseLesson_chapterId_sortOrder_idx`(`chapterId`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LessonProgress` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `lessonId` VARCHAR(191) NOT NULL,
  `positionSeconds` INTEGER NOT NULL DEFAULT 0,
  `isCompleted` BOOLEAN NOT NULL DEFAULT false,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LessonProgress_studentId_lessonId_key`(`studentId`, `lessonId`),
  INDEX `LessonProgress_lessonId_idx`(`lessonId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Assignment` (
  `id` VARCHAR(191) NOT NULL,
  `chapterId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `instructions` TEXT NOT NULL,
  `maxScore` INTEGER NOT NULL DEFAULT 100,
  `dueAt` DATETIME(3) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isPublished` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `Assignment_chapterId_sortOrder_idx`(`chapterId`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AssignmentSubmission` (
  `id` VARCHAR(191) NOT NULL,
  `assignmentId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `status` ENUM('SUBMITTED', 'GRADED') NOT NULL DEFAULT 'SUBMITTED',
  `score` INTEGER NULL,
  `feedback` TEXT NULL,
  `gradedBy` VARCHAR(191) NULL,
  `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `gradedAt` DATETIME(3) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `AssignmentSubmission_assignmentId_studentId_key`(`assignmentId`, `studentId`),
  INDEX `AssignmentSubmission_studentId_submittedAt_idx`(`studentId`, `submittedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Quiz` (
  `id` VARCHAR(191) NOT NULL,
  `chapterId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `passScore` INTEGER NOT NULL DEFAULT 60,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isPublished` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `Quiz_chapterId_sortOrder_idx`(`chapterId`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `QuizQuestion` (
  `id` VARCHAR(191) NOT NULL,
  `quizId` VARCHAR(191) NOT NULL,
  `prompt` TEXT NOT NULL,
  `options` JSON NOT NULL,
  `correctOption` INTEGER NOT NULL,
  `explanation` TEXT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  INDEX `QuizQuestion_quizId_sortOrder_idx`(`quizId`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `QuizAttempt` (
  `id` VARCHAR(191) NOT NULL,
  `quizId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `answers` JSON NOT NULL,
  `score` INTEGER NOT NULL,
  `passed` BOOLEAN NOT NULL,
  `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `QuizAttempt_quizId_studentId_submittedAt_idx`(`quizId`, `studentId`, `submittedAt`),
  INDEX `QuizAttempt_studentId_submittedAt_idx`(`studentId`, `submittedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseLesson` ADD CONSTRAINT `CourseLesson_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `CourseChapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LessonProgress` ADD CONSTRAINT `LessonProgress_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `CourseLesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `CourseChapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AssignmentSubmission` ADD CONSTRAINT `AssignmentSubmission_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AssignmentSubmission` ADD CONSTRAINT `AssignmentSubmission_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `CourseChapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizQuestion` ADD CONSTRAINT `QuizQuestion_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
