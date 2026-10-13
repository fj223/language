-- Administrator accounts and role-based permissions
ALTER TABLE `StudyRecord` DROP FOREIGN KEY `StudyRecord_courseId_fkey`;

CREATE TABLE `AdminUser` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'CONTENT_MANAGER', 'POLICY_EDITOR', 'ANALYST') NOT NULL DEFAULT 'CONTENT_MANAGER',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `AdminUser_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Published policy knowledge consumed by the assistant
CREATE TABLE `SchoolPolicy` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `keywords` JSON NOT NULL,
  `summary` TEXT NOT NULL,
  `guidance` TEXT NOT NULL,
  `owner` VARCHAR(100) NOT NULL,
  `isPublished` BOOLEAN NOT NULL DEFAULT true,
  `version` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `SchoolPolicy_isPublished_updatedAt_idx`(`isPublished`, `updatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CourseFavorite` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `level` VARCHAR(20) NULL,
  `teacher` VARCHAR(100) NULL,
  `schedule` VARCHAR(200) NULL,
  `coverUrl` VARCHAR(2048) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CourseFavorite_studentId_courseId_key`(`studentId`, `courseId`),
  INDEX `CourseFavorite_studentId_createdAt_idx`(`studentId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LearningReminder` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `note` VARCHAR(500) NULL,
  `courseId` VARCHAR(191) NULL,
  `remindAt` DATETIME(3) NOT NULL,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `LearningReminder_studentId_remindAt_idx`(`studentId`, `remindAt`),
  INDEX `LearningReminder_studentId_completedAt_idx`(`studentId`, `completedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseFavorite`
  ADD CONSTRAINT `CourseFavorite_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LearningReminder`
  ADD CONSTRAINT `LearningReminder_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
