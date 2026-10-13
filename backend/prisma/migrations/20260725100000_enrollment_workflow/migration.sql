CREATE TABLE `EnrollmentApplication` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `courseTitle` VARCHAR(200) NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `level` VARCHAR(20) NULL,
  `teacher` VARCHAR(100) NULL,
  `schedule` VARCHAR(200) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `studentNote` VARCHAR(500) NULL,
  `adminNote` VARCHAR(500) NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `EnrollmentApplication_studentId_courseId_key`(`studentId`, `courseId`),
  INDEX `EnrollmentApplication_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `EnrollmentApplication_studentId_updatedAt_idx`(`studentId`, `updatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EnrollmentApplication`
  ADD CONSTRAINT `EnrollmentApplication_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
