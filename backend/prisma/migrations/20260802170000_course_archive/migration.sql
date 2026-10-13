ALTER TABLE `Course`
  ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `archivedAt` DATETIME(3) NULL,
  ADD COLUMN `archivedBy` VARCHAR(191) NULL;

CREATE INDEX `Course_isArchived_isPublished_idx` ON `Course`(`isArchived`, `isPublished`);
