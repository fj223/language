CREATE TABLE `AdminAuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `actorEmail` VARCHAR(255) NOT NULL,
  `actorName` VARCHAR(100) NOT NULL,
  `actorRole` ENUM('SUPER_ADMIN', 'CONTENT_MANAGER', 'POLICY_EDITOR', 'ANALYST') NOT NULL,
  `action` VARCHAR(80) NOT NULL,
  `targetType` VARCHAR(80) NOT NULL,
  `targetId` VARCHAR(191) NULL,
  `summary` VARCHAR(500) NOT NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `AdminAuditLog_createdAt_idx`(`createdAt`),
  INDEX `AdminAuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
  INDEX `AdminAuditLog_targetType_targetId_idx`(`targetType`, `targetId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AdminAuditLog`
  ADD CONSTRAINT `AdminAuditLog_actorId_fkey`
  FOREIGN KEY (`actorId`) REFERENCES `AdminUser`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
